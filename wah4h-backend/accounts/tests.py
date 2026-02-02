"""
accounts/tests.py
Comprehensive Test Suite for Identity & Structure Management

Test Architecture:
- Unit Tests: Verify Service Layer business logic (services.py)
- Integration Tests: Verify API endpoints delegate correctly to services
- No Mocking: Test actual database constraints and transaction atomicity

Coverage:
1. OrganizationService (deduplication)
2. PractitionerService (deduplication, PRC validation)
3. PractitionerRegistrationAPIView (full registration flow)
4. LoginAPIView (practitioner_id in response)
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date

from .models import Organization, Practitioner, Location
from .services import OrganizationService, PractitionerService, AuthService
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

User = get_user_model()


# =============================================================================
# Unit Tests: Organization Service
# =============================================================================

class OrganizationServiceTestCase(TestCase):
    """
    Test OrganizationService business logic.
    
    Focus: Deduplication rules (name + address_city must be unique)
    """
    
    def test_create_organization_success(self):
        """
        Verify standard organization creation works.
        """
        data = {
            'identifier': 'ORG-TEST-001',
            'name': 'General Hospital',
            'address_city': 'Manila',
            'type_code': 'HOSPITAL',
            'active': True,
            'status': 'active'
        }
        
        organization = OrganizationService.create_organization(data)
        
        self.assertIsNotNone(organization)
        self.assertEqual(organization.name, 'General Hospital')
        self.assertEqual(organization.address_city, 'Manila')
        self.assertEqual(Organization.objects.count(), 1)
    
    def test_create_duplicate_organization(self):
        """
        CRITICAL TEST: Verify deduplication prevents duplicate (name + city).
        
        Scenario:
        1. Create "General Hospital" in "Manila"
        2. Try creating "General Hospital" in "Manila" again
        
        Expected: ValidationError raised by Service Layer
        """
        # First creation succeeds
        data = {
            'identifier': 'ORG-TEST-DUP',
            'name': 'General Hospital',
            'address_city': 'Manila',
            'type_code': 'HOSPITAL',
            'active': True,
            'status': 'active'
        }
        org1 = OrganizationService.create_organization(data)
        self.assertIsNotNone(org1)
        
        # Second creation with same name + city should fail
        with self.assertRaises(ValidationError) as context:
            OrganizationService.create_organization(data)
        
        # Verify error message mentions deduplication
        error_message = str(context.exception)
        self.assertIn('already exists', error_message.lower())
    
    def test_create_organization_different_city_allowed(self):
        """
        Verify same name in different cities is allowed.
        
        Scenario: "General Hospital" can exist in both Manila and Cebu.
        """
        data_manila = {
            'identifier': 'ORG-TEST-MLA',
            'name': 'General Hospital',
            'address_city': 'Manila',
            'type_code': 'HOSPITAL',
            'active': True,
            'status': 'active'
        }
        
        data_cebu = {
            'identifier': 'ORG-TEST-CEB',
            'name': 'General Hospital',
            'address_city': 'Cebu',
            'type_code': 'HOSPITAL',
            'active': True,
            'status': 'active'
        }
        
        org1 = OrganizationService.create_organization(data_manila)
        org2 = OrganizationService.create_organization(data_cebu)
        
        self.assertIsNotNone(org1)
        self.assertIsNotNone(org2)
        self.assertNotEqual(org1.organization_id, org2.organization_id)
        self.assertEqual(Organization.objects.count(), 2)


# =============================================================================
# Unit Tests: Practitioner Service
# =============================================================================

class PractitionerServiceTestCase(TestCase):
    """
    Test PractitionerService business logic.
    
    Focus:
    1. Deduplication (first_name + last_name + birth_date)
    2. PRC License uniqueness (qualification_identifier)
    3. User-Practitioner linking (1:1 relationship)
    """
    
    def test_register_practitioner_success(self):
        """
        Verify standard practitioner registration without user account.
        """
        practitioner_data = {
            'identifier': 'PRAC-001',
            'first_name': 'Juan',
            'last_name': 'Dela Cruz',
            'birth_date': date(1980, 1, 15),
            'gender': 'male',
            'qualification_identifier': 'PRC-123456',
            'active': True,
            'status': 'active'
        }
        
        practitioner = PractitionerService.register_practitioner(practitioner_data)
        
        self.assertIsNotNone(practitioner)
        self.assertEqual(practitioner.first_name, 'Juan')
        self.assertEqual(practitioner.last_name, 'Dela Cruz')
        self.assertEqual(Practitioner.objects.count(), 1)
    
    def test_register_practitioner_with_user(self):
        """
        Verify practitioner registration with user account creation.
        
        Critical: User.practitioner should be set (1:1 relationship)
        """
        practitioner_data = {
            'identifier': 'PRAC-002',
            'first_name': 'Maria',
            'last_name': 'Santos',
            'birth_date': date(1985, 3, 20),
            'gender': 'female',
            'active': True,
            'status': 'active'
        }
        
        user_data = {
            'username': 'msantos',
            'email': 'maria.santos@hospital.ph',
            'password': 'SecurePass123',
            'role': 'doctor'
        }
        
        practitioner = PractitionerService.register_practitioner(
            practitioner_data,
            user_data
        )
        
        self.assertIsNotNone(practitioner)
        
        # Verify User was created and linked
        user = User.objects.get(username='msantos')
        self.assertIsNotNone(user)
        self.assertEqual(user.practitioner, practitioner)
        self.assertEqual(user.email, 'maria.santos@hospital.ph')
        self.assertTrue(user.check_password('SecurePass123'))
    
    def test_register_practitioner_deduplication(self):
        """
        CRITICAL TEST: Verify deduplication prevents duplicate identity.
        
        Scenario:
        1. Create "Juan Dela Cruz" born 1990-01-01
        2. Try creating "Juan Dela Cruz" born 1990-01-01 again
        
        Expected: ValidationError raised by Service Layer
        """
        practitioner_data = {
            'identifier': 'PRAC-003',
            'first_name': 'Juan',
            'last_name': 'Dela Cruz',
            'birth_date': date(1990, 1, 1),
            'active': True,
            'status': 'active'
        }
        
        # First creation succeeds
        practitioner1 = PractitionerService.register_practitioner(practitioner_data)
        self.assertIsNotNone(practitioner1)
        
        # Second creation with same name + birthdate should fail
        duplicate_data = {
            'identifier': 'PRAC-004',  # Different identifier
            'first_name': 'Juan',
            'last_name': 'Dela Cruz',
            'birth_date': date(1990, 1, 1),  # Same name + birthdate
            'active': True,
            'status': 'active'
        }
        
        with self.assertRaises(ValidationError) as context:
            PractitionerService.register_practitioner(duplicate_data)
        
        # Verify error message mentions duplicate/already exists
        error_message = str(context.exception)
        self.assertIn('already exists', error_message.lower())
    
    def test_register_practitioner_prc_conflict(self):
        """
        CRITICAL TEST: Verify PRC license uniqueness.
        
        Scenario:
        1. Create doctor with PRC license "12345"
        2. Try creating another doctor with PRC license "12345"
        
        Expected: ValidationError raised by Service Layer
        
        Context: PRC licenses are legal credentials - must be unique.
        """
        practitioner1_data = {
            'identifier': 'PRAC-005',
            'first_name': 'Pedro',
            'last_name': 'Ramos',
            'birth_date': date(1975, 5, 10),
            'qualification_identifier': 'PRC-12345',
            'active': True,
            'status': 'active'
        }
        
        # First creation succeeds
        practitioner1 = PractitionerService.register_practitioner(practitioner1_data)
        self.assertIsNotNone(practitioner1)
        
        # Second creation with same PRC license should fail
        practitioner2_data = {
            'identifier': 'PRAC-006',
            'first_name': 'Pablo',  # Different name
            'last_name': 'Garcia',
            'birth_date': date(1980, 8, 20),  # Different birthdate
            'qualification_identifier': 'PRC-12345',  # SAME PRC LICENSE
            'active': True,
            'status': 'active'
        }
        
        with self.assertRaises(ValidationError) as context:
            PractitionerService.register_practitioner(practitioner2_data)
        
        # Verify error message mentions PRC or qualification
        error_message = str(context.exception)
        self.assertTrue(
            'prc' in error_message.lower() or 
            'qualification' in error_message.lower() or
            'already in use' in error_message.lower()
        )
    
    def test_register_practitioner_same_name_different_birthdate_allowed(self):
        """
        Verify same name with different birthdates is allowed.
        
        Scenario: Two people named "Juan Cruz" born on different dates.
        """
        practitioner1_data = {
            'identifier': 'PRAC-007',
            'first_name': 'Juan',
            'last_name': 'Cruz',
            'birth_date': date(1990, 1, 1),
            'active': True,
            'status': 'active'
        }
        
        practitioner2_data = {
            'identifier': 'PRAC-008',
            'first_name': 'Juan',
            'last_name': 'Cruz',
            'birth_date': date(1992, 5, 15),  # Different birthdate
            'active': True,
            'status': 'active'
        }
        
        practitioner1 = PractitionerService.register_practitioner(practitioner1_data)
        practitioner2 = PractitionerService.register_practitioner(practitioner2_data)
        
        self.assertIsNotNone(practitioner1)
        self.assertIsNotNone(practitioner2)
        self.assertNotEqual(practitioner1.practitioner_id, practitioner2.practitioner_id)
        self.assertEqual(Practitioner.objects.count(), 2)


# =============================================================================
# Unit Tests: Auth Service (Email 2FA)
# =============================================================================

class AuthServiceTestCase(TestCase):
    """
    Test AuthService Email-based Two-Factor Authentication.
    
    Focus:
    1. OTP generation and email sending
    2. OTP verification with expiry (5 minutes)
    3. OTP clearing after use
    """
    
    def setUp(self):
        """Create test user for OTP testing."""
        practitioner_data = {
            'identifier': 'PRAC-OTP-001',
            'first_name': 'Test',
            'last_name': 'User',
            'birth_date': date(1990, 1, 1),
            'active': True,
            'status': 'active'
        }
        
        user_data = {
            'username': 'testuser',
            'email': 'test@hospital.ph',
            'password': 'TestPass123',
            'role': 'doctor'
        }
        
        self.practitioner = PractitionerService.register_practitioner(
            practitioner_data,
            user_data
        )
        self.user = User.objects.get(username='testuser')
    
    @patch('django.core.mail.send_mail')
    def test_generate_login_otp(self, mock_send_mail):
        """
        Verify OTP generation creates 6-digit code and sends email.
        """
        # Call the service
        AuthService.generate_login_otp(self.user)
        
        # Verify OTP was saved to user
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.otp_code)
        self.assertEqual(len(self.user.otp_code), 6)
        self.assertTrue(self.user.otp_code.isdigit())
        self.assertIsNotNone(self.user.otp_created_at)
        
        # Verify email was sent
        mock_send_mail.assert_called_once()
        call_kwargs = mock_send_mail.call_args[1]
        self.assertEqual(call_kwargs['recipient_list'], [self.user.email])
        self.assertIn(self.user.otp_code, call_kwargs['message'])
    
    def test_verify_login_otp_valid(self):
        """
        Verify OTP verification succeeds with valid code.
        """
        # Generate OTP
        self.user.otp_code = '123456'
        self.user.otp_created_at = timezone.now()
        self.user.save()
        
        # Verify OTP
        is_valid = AuthService.verify_login_otp(self.user, '123456')
        
        self.assertTrue(is_valid)
        
        # Verify OTP was cleared after use
        self.user.refresh_from_db()
        self.assertIsNone(self.user.otp_code)
        self.assertIsNone(self.user.otp_created_at)
    
    def test_verify_login_otp_invalid_code(self):
        """
        Verify OTP verification fails with wrong code.
        """
        # Generate OTP
        self.user.otp_code = '123456'
        self.user.otp_created_at = timezone.now()
        self.user.save()
        
        # Verify with wrong code
        is_valid = AuthService.verify_login_otp(self.user, '999999')
        
        self.assertFalse(is_valid)
        
        # Verify OTP was NOT cleared (for retry)
        self.user.refresh_from_db()
        self.assertEqual(self.user.otp_code, '123456')
    
    def test_verify_login_otp_expired(self):
        """
        Verify OTP verification fails with expired code (>5 minutes).
        """
        # Generate expired OTP (6 minutes ago)
        self.user.otp_code = '123456'
        self.user.otp_created_at = timezone.now() - timedelta(minutes=6)
        self.user.save()
        
        # Verify with correct code but expired
        is_valid = AuthService.verify_login_otp(self.user, '123456')
        
        self.assertFalse(is_valid)
        
        # Verify expired OTP was cleared
        self.user.refresh_from_db()
        self.assertIsNone(self.user.otp_code)
        self.assertIsNone(self.user.otp_created_at)
    
    def test_verify_login_otp_no_otp_set(self):
        """
        Verify OTP verification fails when no OTP was generated.
        """
        # Ensure no OTP is set
        self.user.otp_code = None
        self.user.otp_created_at = None
        self.user.save()
        
        # Try to verify
        is_valid = AuthService.verify_login_otp(self.user, '123456')
        
        self.assertFalse(is_valid)


# =============================================================================
# Integration Tests: Practitioner Registration API
# =============================================================================

class PractitionerRegistrationAPITestCase(APITestCase):
    """
    Test /api/accounts/register/practitioner/ endpoint.
    
    Focus: Verify API correctly delegates to Service Layer and handles errors.
    """
    
    def setUp(self):
        """Set up test data."""
        self.url = reverse('register_practitioner')
    
    def test_api_register_full_success(self):
        """
        Verify complete registration flow: practitioner + user creation.
        
        Expected:
        - HTTP 201 Created
        - Practitioner created in database
        - User created and linked to practitioner
        - Response contains practitioner_id and user info
        """
        payload = {
            'practitioner': {
                'identifier': 'PRAC-API-001',
                'first_name': 'Ana',
                'last_name': 'Reyes',
                'birth_date': '1988-07-12',
                'gender': 'female',
                'qualification_identifier': 'PRC-API-001',
                'active': True,
                'status': 'active'
            },
            'user': {
                'username': 'areyes',
                'email': 'ana.reyes@hospital.ph',
                'password': 'SecurePass123',
                'confirm_password': 'SecurePass123',
                'role': 'nurse'
            }
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        # Assert HTTP 201 Created
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Assert response structure
        self.assertTrue(response.data['success'])
        self.assertIn('practitioner', response.data)
        self.assertIn('user', response.data)
        
        practitioner_data = response.data['practitioner']
        user_data = response.data['user']
        
        # Verify practitioner fields
        self.assertEqual(practitioner_data['first_name'], 'Ana')
        self.assertEqual(practitioner_data['last_name'], 'Reyes')
        self.assertIn('practitioner_id', practitioner_data)
        
        # Verify user fields
        self.assertEqual(user_data['username'], 'areyes')
        self.assertEqual(user_data['email'], 'ana.reyes@hospital.ph')
        self.assertEqual(user_data['role'], 'nurse')
        
        # Verify database records
        practitioner = Practitioner.objects.get(identifier='PRAC-API-001')
        self.assertEqual(practitioner.first_name, 'Ana')
        
        user = User.objects.get(username='areyes')
        self.assertEqual(user.practitioner, practitioner)
        self.assertTrue(user.check_password('SecurePass123'))
    
    def test_api_register_practitioner_only(self):
        """
        Verify registration without user account creation works.
        """
        payload = {
            'practitioner': {
                'identifier': 'PRAC-API-002',
                'first_name': 'Carlos',
                'last_name': 'Mendoza',
                'birth_date': '1975-11-30',
                'active': True,
                'status': 'active'
            }
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Verify no user was created
        self.assertIsNone(response.data.get('user'))
        self.assertEqual(User.objects.count(), 0)
        
        # Verify practitioner was created
        practitioner = Practitioner.objects.get(identifier='PRAC-API-002')
        self.assertEqual(practitioner.first_name, 'Carlos')
    
    def test_api_register_validation_error_duplicate_practitioner(self):
        """
        CRITICAL TEST: Verify API returns HTTP 400 when Service Layer
        detects duplicate practitioner.
        
        Scenario:
        1. Create practitioner via API
        2. Try creating same practitioner again
        
        Expected:
        - HTTP 400 Bad Request
        - Error message mentions "already exists"
        """
        payload = {
            'practitioner': {
                'identifier': 'PRAC-API-003',
                'first_name': 'Luis',
                'last_name': 'Santos',
                'birth_date': '1982-03-15',
                'active': True,
                'status': 'active'
            }
        }
        
        # First request succeeds
        response1 = self.client.post(self.url, payload, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Second request with same name + birthdate should fail
        duplicate_payload = {
            'practitioner': {
                'identifier': 'PRAC-API-004',  # Different identifier
                'first_name': 'Luis',
                'last_name': 'Santos',
                'birth_date': '1982-03-15',  # SAME name + birthdate
                'active': True,
                'status': 'active'
            }
        }
        
        response2 = self.client.post(self.url, duplicate_payload, format='json')
        
        # Assert HTTP 400 Bad Request
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Assert error structure
        self.assertFalse(response2.data['success'])
        self.assertIn('error', response2.data)
        
        # Verify error message mentions Service Layer failure
        error_message = str(response2.data['error']).lower()
        self.assertIn('already exists', error_message)
    
    def test_api_register_validation_error_prc_conflict(self):
        """
        CRITICAL TEST: Verify API returns HTTP 400 when Service Layer
        detects PRC license conflict.
        
        Scenario:
        1. Create practitioner with PRC license "PRC-999"
        2. Try creating another practitioner with PRC license "PRC-999"
        
        Expected:
        - HTTP 400 Bad Request
        - Error message mentions PRC or qualification conflict
        """
        payload1 = {
            'practitioner': {
                'identifier': 'PRAC-API-005',
                'first_name': 'Rosa',
                'last_name': 'Fernandez',
                'birth_date': '1990-06-20',
                'qualification_identifier': 'PRC-999',
                'active': True,
                'status': 'active'
            }
        }
        
        # First request succeeds
        response1 = self.client.post(self.url, payload1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Second request with same PRC license should fail
        payload2 = {
            'practitioner': {
                'identifier': 'PRAC-API-006',
                'first_name': 'Miguel',  # Different person
                'last_name': 'Torres',
                'birth_date': '1985-09-10',
                'qualification_identifier': 'PRC-999',  # SAME PRC
                'active': True,
                'status': 'active'
            }
        }
        
        response2 = self.client.post(self.url, payload2, format='json')
        
        # Assert HTTP 400 Bad Request
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Assert error message mentions PRC/qualification
        error_message = str(response2.data['error']).lower()
        self.assertTrue(
            'prc' in error_message or 
            'qualification' in error_message or
            'already in use' in error_message
        )
    
    def test_api_register_validation_error_missing_required_fields(self):
        """
        Verify API returns HTTP 400 when required fields are missing.
        
        This tests Serializer validation, not Service Layer.
        """
        payload = {
            'practitioner': {
                'identifier': 'PRAC-API-007',
                # Missing first_name, last_name, birth_date
            }
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_api_register_validation_error_password_mismatch(self):
        """
        Verify API returns HTTP 400 when passwords don't match.
        """
        payload = {
            'practitioner': {
                'identifier': 'PRAC-API-008',
                'first_name': 'Elena',
                'last_name': 'Gomez',
                'birth_date': '1992-04-25',
                'active': True,
                'status': 'active'
            },
            'user': {
                'username': 'egomez',
                'email': 'elena@hospital.ph',
                'password': 'SecurePass123',
                'confirm_password': 'WrongPassword',  # Mismatch
                'role': 'doctor'
            }
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error_message = str(response.data).lower()
        self.assertIn('password', error_message)


# =============================================================================
# Integration Tests: Login API
# =============================================================================

class LoginAPITestCase(APITestCase):
    """
    Test /api/accounts/login/ endpoint with Email-based Two-Factor Authentication.
    
    Focus: 
    1. Two-step authentication flow (password → OTP → tokens)
    2. Verify login returns practitioner_id (critical for frontend operations)
    """
    
    def setUp(self):
        """Create test user with linked practitioner."""
        self.url = reverse('login')
        
        # Create practitioner
        practitioner_data = {
            'identifier': 'PRAC-LOGIN-001',
            'first_name': 'Test',
            'last_name': 'Doctor',
            'birth_date': date(1985, 1, 1),
            'active': True,
            'status': 'active'
        }
        
        user_data = {
            'username': 'testdoctor',
            'email': 'test.doctor@hospital.ph',
            'password': 'TestPass123',
            'role': 'doctor'
        }
        
        self.practitioner = PractitionerService.register_practitioner(
            practitioner_data,
            user_data
        )
        
        self.user = User.objects.get(username='testdoctor')
    
    @patch('django.core.mail.send_mail')
    def test_login_step1_otp_generation(self, mock_send_mail):
        """
        Test Step 1: Login with email + password triggers OTP generation.
        
        Expected:
        - HTTP 200 OK
        - Response contains step: "otp_verification"
        - OTP is generated and sent via email
        """
        payload = {
            'email': 'test.doctor@hospital.ph',
            'password': 'TestPass123'
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['step'], 'otp_verification')
        self.assertIn('OTP sent to email', response.data['message'])
        
        # Verify no tokens returned yet
        self.assertNotIn('tokens', response.data)
        
        # Verify OTP was generated
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.otp_code)
        self.assertEqual(len(self.user.otp_code), 6)
        
        # Verify email was sent
        mock_send_mail.assert_called_once()
    
    @patch('django.core.mail.send_mail')
    def test_login_step2_otp_verification_success(self, mock_send_mail):
        """
        Test Step 2: Login with email + password + valid OTP returns tokens.
        
        CRITICAL TEST: Verify complete 2FA flow and practitioner_id in response.
        
        Context: Frontend needs practitioner_id for most API operations.
        This is the "identity bridge" between User (auth) and Practitioner (FHIR).
        """
        # Step 1: Generate OTP
        payload_step1 = {
            'email': 'test.doctor@hospital.ph',
            'password': 'TestPass123'
        }
        
        response_step1 = self.client.post(self.url, payload_step1, format='json')
        self.assertEqual(response_step1.status_code, status.HTTP_200_OK)
        self.assertEqual(response_step1.data['step'], 'otp_verification')
        
        # Get the generated OTP from database
        self.user.refresh_from_db()
        otp_code = self.user.otp_code
        
        # Step 2: Verify OTP and get tokens
        payload_step2 = {
            'email': 'test.doctor@hospital.ph',
            'password': 'TestPass123',
            'otp': otp_code
        }
        
        response_step2 = self.client.post(self.url, payload_step2, format='json')
        
        self.assertEqual(response_step2.status_code, status.HTTP_200_OK)
        self.assertTrue(response_step2.data['success'])
        
        # Assert tokens are present
        self.assertIn('tokens', response_step2.data)
        self.assertIn('access', response_step2.data['tokens'])
        self.assertIn('refresh', response_step2.data['tokens'])
        
        # Assert user data with practitioner_id
        self.assertIn('user', response_step2.data)
        user_data = response_step2.data['user']
        self.assertEqual(user_data['email'], 'test.doctor@hospital.ph')
        self.assertEqual(user_data['username'], 'testdoctor')
        self.assertIn('practitioner_id', user_data)
        self.assertEqual(user_data['practitioner_id'], self.practitioner.practitioner_id)
        
        # Verify OTP was cleared after use
        self.user.refresh_from_db()
        self.assertIsNone(self.user.otp_code)
        self.assertIsNone(self.user.otp_created_at)
    
    @patch('django.core.mail.send_mail')
    def test_login_step2_otp_verification_invalid(self, mock_send_mail):
        """
        Test Step 2: Login with invalid OTP returns HTTP 400.
        """
        # Step 1: Generate OTP
        payload_step1 = {
            'email': 'test.doctor@hospital.ph',
            'password': 'TestPass123'
        }
        
        response_step1 = self.client.post(self.url, payload_step1, format='json')
        self.assertEqual(response_step1.status_code, status.HTTP_200_OK)
        
        # Step 2: Try with wrong OTP
        payload_step2 = {
            'email': 'test.doctor@hospital.ph',
            'password': 'TestPass123',
            'otp': '999999'  # Wrong OTP
        }
        
        response_step2 = self.client.post(self.url, payload_step2, format='json')
        
        self.assertEqual(response_step2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_step2.data['success'])
        self.assertIn('Invalid or expired OTP', response_step2.data['message'])
    
    @patch('django.core.mail.send_mail')
    def test_login_step2_otp_verification_expired(self, mock_send_mail):
        """
        Test Step 2: Login with expired OTP returns HTTP 400.
        """
        # Step 1: Generate OTP
        payload_step1 = {
            'email': 'test.doctor@hospital.ph',
            'password': 'TestPass123'
        }
        
        response_step1 = self.client.post(self.url, payload_step1, format='json')
        self.assertEqual(response_step1.status_code, status.HTTP_200_OK)
        
        # Manually expire the OTP
        self.user.refresh_from_db()
        otp_code = self.user.otp_code
        self.user.otp_created_at = timezone.now() - timedelta(minutes=6)
        self.user.save()
        
        # Step 2: Try with expired OTP
        payload_step2 = {
            'email': 'test.doctor@hospital.ph',
            'password': 'TestPass123',
            'otp': otp_code  # Correct code but expired
        }
        
        response_step2 = self.client.post(self.url, payload_step2, format='json')
        
        self.assertEqual(response_step2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_step2.data['success'])
        self.assertIn('Invalid or expired OTP', response_step2.data['message'])
    
    def test_login_invalid_credentials(self):
        """
        Verify login fails with invalid password (Step 1).
        """
        payload = {
            'email': 'test.doctor@hospital.ph',
            'password': 'WrongPassword'
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_nonexistent_user(self):
        """
        Verify login fails for non-existent user.
        """
        payload = {
            'email': 'nonexistent@hospital.ph',
            'password': 'SomePassword'
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
