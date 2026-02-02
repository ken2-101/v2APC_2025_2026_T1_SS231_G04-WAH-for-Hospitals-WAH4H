"""
Admission App Tests
===================
Comprehensive test suite for Encounter and Procedure management.

Test Coverage:
- Service Layer: Business logic and FK resolution
- Serializer Layer: Input validation and output enrichment
- View Layer: RESTful API endpoints

Author: WAH4H Backend Team
Date: February 2, 2026
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Encounter, Procedure, ProcedurePerformer
from .services import EncounterService, ProcedureService
from .serializers import (
    EncounterInputSerializer,
    EncounterOutputSerializer,
    ProcedureInputSerializer,
    ProcedureOutputSerializer,
)
from patients.models import Patient
from accounts.models import Practitioner


User = get_user_model()


# ==================== SERVICE LAYER TESTS ====================

class EncounterServiceTests(TestCase):
    """
    Test suite for EncounterService business logic.
    Focus: Manual FK Resolution and state transitions.
    """
    
    def setUp(self):
        """Create test fixtures."""
        # Create a test practitioner (required for User FK)
        self.practitioner = Practitioner.objects.create(
            identifier='TEST-DOC-001',
            first_name='Test',
            last_name='Doctor'
        )
        
        # Create a test user linked to practitioner
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            practitioner=self.practitioner,
            first_name='Test',
            last_name='User',
            status='active'
        )
        
        # Create a test patient with specific external ID
        self.patient = Patient.objects.create(
            patient_id='P-TEST-001',  # External string identifier
            first_name='John',
            middle_name='Doe',
            last_name='Smith',
            birthdate='1990-01-01',
            gender='M',
            mobile_number='09171234567',
            blood_type='O+',
            civil_status='Single',
            religion='Catholic',
            nationality='Filipino',
            occupation='Engineer',
            contact_first_name='Jane',
            contact_last_name='Smith',
            contact_relationship='Sister',
            contact_mobile_number='09179876543'
        )
    
    def test_create_encounter_success(self):
        """Test successful encounter creation with FK resolution."""
        encounter_data = {
            'patient_id': 'P-TEST-001',  # External string ID
            'type': 'inpatient',
            'class_field': 'IMP',
            'priority': 'routine',
        }
        
        encounter = EncounterService.create_encounter(encounter_data)
        
        # Assert: Encounter created
        self.assertIsNotNone(encounter)
        self.assertIsInstance(encounter, Encounter)
        
        # Assert: Identifier generated correctly
        self.assertTrue(encounter.identifier.startswith('ENC-'))
        
        # Assert: FK Resolution worked (string → internal integer PK)
        self.assertEqual(encounter.subject_patient_id, self.patient.id)
        
        # Assert: Default status applied
        self.assertEqual(encounter.status, 'arrived')
        
        # Assert: Data mapped correctly
        self.assertEqual(encounter.type, 'inpatient')
        self.assertEqual(encounter.class_field, 'IMP')
    
    def test_create_encounter_invalid_patient(self):
        """Test encounter creation with non-existent patient."""
        encounter_data = {
            'patient_id': 'P-NONEXISTENT-999',  # Invalid ID
            'type': 'outpatient',
        }
        
        # Assert: ValidationError raised
        with self.assertRaises(ValidationError) as context:
            EncounterService.create_encounter(encounter_data)
        
        self.assertIn('patient_id', str(context.exception))
    
    def test_create_encounter_missing_patient_id(self):
        """Test encounter creation without patient_id."""
        encounter_data = {
            'type': 'emergency',
        }
        
        with self.assertRaises(ValidationError) as context:
            EncounterService.create_encounter(encounter_data)
        
        self.assertIn('patient_id', str(context.exception))
    
    def test_discharge_encounter_success(self):
        """Test successful encounter discharge."""
        # Create an encounter first
        encounter_data = {
            'patient_id': 'P-TEST-001',
            'status': 'in-progress',
            'type': 'inpatient',
        }
        encounter = EncounterService.create_encounter(encounter_data)
        
        # Discharge the encounter
        discharged = EncounterService.discharge_encounter(
            encounter,
            disposition='Home with family',
            destination_id=None
        )
        
        # Assert: Status updated to finished
        self.assertEqual(discharged.status, 'finished')
        
        # Assert: period_end set
        self.assertIsNotNone(discharged.period_end)
        
        # Assert: Discharge details recorded
        self.assertEqual(discharged.discharge_disposition, 'Home with family')
    
    def test_discharge_already_finished_encounter(self):
        """Test discharging an already finished encounter."""
        encounter_data = {
            'patient_id': 'P-TEST-001',
            'status': 'finished',
        }
        encounter = EncounterService.create_encounter(encounter_data)
        
        with self.assertRaises(ValidationError) as context:
            EncounterService.discharge_encounter(
                encounter,
                disposition='Already discharged'
            )
        
        self.assertIn('already finished', str(context.exception).lower())
    
    def test_discharge_cancelled_encounter(self):
        """Test discharging a cancelled encounter."""
        encounter_data = {
            'patient_id': 'P-TEST-001',
            'status': 'cancelled',
        }
        encounter = EncounterService.create_encounter(encounter_data)
        
        with self.assertRaises(ValidationError) as context:
            EncounterService.discharge_encounter(
                encounter,
                disposition='Test'
            )
        
        self.assertIn('cancelled', str(context.exception).lower())
    
    def test_get_active_encounters(self):
        """Test retrieving active encounters."""
        # Create multiple encounters
        EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'in-progress',
        })
        EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'arrived',
        })
        EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'finished',
        })
        
        active = EncounterService.get_active_encounters()
        
        # Assert: Only non-finished/cancelled encounters returned
        self.assertEqual(active.count(), 2)
    
    def test_get_active_encounters_by_patient(self):
        """Test retrieving active encounters filtered by patient."""
        # Create another patient
        other_patient = Patient.objects.create(
            patient_id='P-TEST-002',
            first_name='Jane',
            last_name='Doe',
            birthdate='1995-05-05',
            gender='F',
            mobile_number='09181234567',
            blood_type='A+',
            civil_status='Single',
            religion='Catholic',
            nationality='Filipino',
            occupation='Nurse',
            contact_first_name='John',
            contact_last_name='Doe',
            contact_relationship='Brother',
            contact_mobile_number='09187654321'
        )
        
        # Create encounters for both patients
        EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'in-progress',
        })
        EncounterService.create_encounter({
            'patient_id': 'P-TEST-002',
            'status': 'arrived',
        })
        
        # Filter by patient
        active = EncounterService.get_active_encounters(patient_id='P-TEST-001')
        
        self.assertEqual(active.count(), 1)
        self.assertEqual(active.first().subject_patient_id, self.patient.id)
    
    def test_identifier_uniqueness(self):
        """Test that generated identifiers are unique."""
        encounter1 = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
        })
        encounter2 = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
        })
        
        self.assertNotEqual(encounter1.identifier, encounter2.identifier)


class ProcedureServiceTests(TestCase):
    """
    Test suite for ProcedureService business logic.
    Focus: Auto-linkage of patient from encounter.
    """
    
    def setUp(self):
        """Create test fixtures."""
        # Create practitioner (required for User FK)
        self.practitioner = Practitioner.objects.create(
            identifier='TEST-DOC-002',
            first_name='Test',
            last_name='Surgeon'
        )
        
        # Create user linked to practitioner
        self.user = User.objects.create_user(
            username='doctor',
            password='doctorpass123',
            practitioner=self.practitioner,
            first_name='Test',
            last_name='Doctor',
            status='active'
        )
        
        # Create patient
        self.patient = Patient.objects.create(
            patient_id='P-TEST-001',
            first_name='John',
            last_name='Smith',
            birthdate='1990-01-01',
            gender='M',
            mobile_number='09171234567',
            blood_type='O+',
            civil_status='Single',
            religion='Catholic',
            nationality='Filipino',
            occupation='Engineer',
            contact_first_name='Jane',
            contact_last_name='Smith',
            contact_relationship='Sister',
            contact_mobile_number='09179876543'
        )
        
        # Create encounter
        self.encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'in-progress',
            'type': 'inpatient',
        })
    
    def test_record_procedure_success_with_linkage(self):
        """Test procedure recording with automatic patient linkage."""
        procedure_data = {
            'encounter_identifier': self.encounter.identifier,  # External string ID
            'code_code': '80146002',
            'code_display': 'Appendectomy',
            'status': 'completed',
        }
        
        procedure = ProcedureService.record_procedure(procedure_data, self.user)
        
        # Assert: Procedure created
        self.assertIsNotNone(procedure)
        self.assertIsInstance(procedure, Procedure)
        
        # Assert: Identifier generated
        self.assertTrue(procedure.identifier.startswith('PROC-'))
        
        # Assert: FK Resolution - encounter_identifier → encounter_id (internal PK)
        self.assertEqual(procedure.encounter_id, self.encounter.encounter_id)
        
        # Assert: Auto-linkage - subject_id copied from encounter
        self.assertEqual(procedure.subject_id, self.patient.id)
        
        # Assert: Recorder set from user
        self.assertEqual(procedure.recorder_id, self.user.id)
        
        # Assert: Data mapped correctly
        self.assertEqual(procedure.code_code, '80146002')
        self.assertEqual(procedure.code_display, 'Appendectomy')
        self.assertEqual(procedure.status, 'completed')
    
    def test_record_procedure_invalid_encounter(self):
        """Test procedure recording with non-existent encounter."""
        procedure_data = {
            'encounter_identifier': 'ENC-INVALID-999',
            'code_code': '12345',
            'code_display': 'Test Procedure',
        }
        
        with self.assertRaises(ValidationError) as context:
            ProcedureService.record_procedure(procedure_data, self.user)
        
        self.assertIn('encounter_identifier', str(context.exception))
    
    def test_record_procedure_missing_encounter(self):
        """Test procedure recording without encounter identifier."""
        procedure_data = {
            'code_code': '12345',
            'code_display': 'Test Procedure',
        }
        
        with self.assertRaises(ValidationError):
            ProcedureService.record_procedure(procedure_data, self.user)
    
    def test_update_procedure_status(self):
        """Test procedure status update."""
        # Create procedure
        procedure = ProcedureService.record_procedure({
            'encounter_identifier': self.encounter.identifier,
            'code_code': '12345',
            'code_display': 'Test',
            'status': 'in-progress',
        }, self.user)
        
        # Update status
        updated = ProcedureService.update_procedure_status(
            procedure,
            new_status='completed',
            status_reason_code='SUCCESS',
            status_reason_display='Completed successfully'
        )
        
        self.assertEqual(updated.status, 'completed')
        self.assertEqual(updated.status_reason_code, 'SUCCESS')
    
    def test_update_procedure_invalid_status(self):
        """Test procedure status update with invalid status."""
        procedure = ProcedureService.record_procedure({
            'encounter_identifier': self.encounter.identifier,
            'code_code': '12345',
            'code_display': 'Test',
        }, self.user)
        
        with self.assertRaises(ValidationError):
            ProcedureService.update_procedure_status(
                procedure,
                new_status='invalid-status'
            )
    
    def test_get_procedures_by_encounter(self):
        """Test retrieving procedures by encounter."""
        # Create multiple procedures
        ProcedureService.record_procedure({
            'encounter_identifier': self.encounter.identifier,
            'code_code': '111',
            'code_display': 'Procedure 1',
        }, self.user)
        ProcedureService.record_procedure({
            'encounter_identifier': self.encounter.identifier,
            'code_code': '222',
            'code_display': 'Procedure 2',
        }, self.user)
        
        procedures = ProcedureService.get_procedures_by_encounter(
            self.encounter.identifier
        )
        
        self.assertEqual(procedures.count(), 2)
    
    def test_get_procedures_by_patient(self):
        """Test retrieving procedures by patient."""
        # Create procedures
        ProcedureService.record_procedure({
            'encounter_identifier': self.encounter.identifier,
            'code_code': '111',
            'code_display': 'Procedure 1',
        }, self.user)
        
        procedures = ProcedureService.get_procedures_by_patient('P-TEST-001')
        
        self.assertEqual(procedures.count(), 1)
        self.assertEqual(procedures.first().subject_id, self.patient.id)


# ==================== API LAYER TESTS ====================

class AdmissionAPITests(APITestCase):
    """
    Test suite for Admission API endpoints.
    Focus: CQRS serializers, authentication, and string-based routing.
    """
    
    def setUp(self):
        """Create test fixtures and authenticate."""
        # Create practitioner (required for User FK)
        self.practitioner = Practitioner.objects.create(
            identifier='TEST-DOC-003',
            first_name='API',
            last_name='User'
        )
        
        # Create user linked to practitioner
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='apipass123',
            practitioner=self.practitioner,
            first_name='API',
            last_name='User',
            status='active'
        )
        
        # Authenticate client
        self.client.force_authenticate(user=self.user)
        
        # Create patient
        self.patient = Patient.objects.create(
            patient_id='P-TEST-001',
            first_name='John',
            last_name='Smith',
            birthdate='1990-01-01',
            gender='M',
            mobile_number='09171234567',
            blood_type='O+',
            civil_status='Single',
            religion='Catholic',
            nationality='Filipino',
            occupation='Engineer',
            contact_first_name='Jane',
            contact_last_name='Smith',
            contact_relationship='Sister',
            contact_mobile_number='09179876543'
        )
    
    def test_create_encounter_api(self):
        """Test encounter creation via API."""
        url = reverse('encounter-list')
        data = {
            'patient_id': 'P-TEST-001',
            'class_field': 'IMP',
            'type': 'inpatient',
            'priority': 'routine',
        }
        
        response = self.client.post(url, data, format='json')
        
        # Assert: HTTP 201 Created
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Assert: Response contains enriched data
        self.assertIn('identifier', response.data)
        self.assertTrue(response.data['identifier'].startswith('ENC-'))
        
        # Assert: Patient name resolved
        self.assertIn('patient_name', response.data)
        self.assertIn('Smith', response.data['patient_name'])
        
        # Assert: Data saved correctly
        encounter = Encounter.objects.get(identifier=response.data['identifier'])
        self.assertEqual(encounter.subject_patient_id, self.patient.id)
    
    def test_create_encounter_invalid_patient(self):
        """Test encounter creation with invalid patient."""
        url = reverse('encounter-list')
        data = {
            'patient_id': 'P-INVALID-999',
            'type': 'outpatient',
        }
        
        response = self.client.post(url, data, format='json')
        
        # Assert: HTTP 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_lookup_encounter_by_string_identifier(self):
        """Test retrieving encounter using string identifier (not PK)."""
        # Create encounter
        encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'type': 'emergency',
        })
        
        # GET using string identifier
        url = reverse('encounter-detail', kwargs={'identifier': encounter.identifier})
        response = self.client.get(url)
        
        # Assert: HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Assert: Correct encounter returned
        self.assertEqual(response.data['identifier'], encounter.identifier)
        self.assertIn('patient_name', response.data)
    
    def test_discharge_encounter_action(self):
        """Test discharge encounter custom action."""
        # Create encounter
        encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'in-progress',
        })
        
        # POST to discharge action
        url = reverse('encounter-discharge', kwargs={'identifier': encounter.identifier})
        data = {
            'discharge_disposition': 'Home with family support',
            'discharge_destination_id': None,
        }
        
        response = self.client.post(url, data, format='json')
        
        # Assert: HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Assert: Status updated
        self.assertEqual(response.data['status'], 'finished')
        self.assertIsNotNone(response.data['period_end'])
        self.assertEqual(
            response.data['discharge_disposition'],
            'Home with family support'
        )
    
    def test_get_active_encounters_action(self):
        """Test active encounters custom action."""
        # Create encounters with different statuses
        EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'in-progress',
        })
        EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'finished',
        })
        
        # GET active encounters
        url = reverse('encounter-active')
        response = self.client.get(url)
        
        # Assert: HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Assert: Only active encounters returned
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'in-progress')
    
    def test_create_procedure_api(self):
        """Test procedure creation via API."""
        # Create encounter first
        encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
            'status': 'in-progress',
        })
        
        url = reverse('procedure-list')
        data = {
            'encounter_identifier': encounter.identifier,
            'code_code': '80146002',
            'code_display': 'Appendectomy',
            'status': 'completed',
            'category_code': 'SURG',
            'category_display': 'Surgical Procedure',
        }
        
        response = self.client.post(url, data, format='json')
        
        # Assert: HTTP 201 Created
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Assert: Response contains enriched data
        self.assertIn('identifier', response.data)
        self.assertTrue(response.data['identifier'].startswith('PROC-'))
        
        # Assert: Auto-linkage worked
        self.assertEqual(response.data['encounter_id'], encounter.encounter_id)
        self.assertEqual(response.data['subject_id'], self.patient.id)
        self.assertEqual(response.data['recorder_id'], self.user.id)
        
        # Assert: Patient name resolved
        self.assertIn('patient_name', response.data)
        self.assertIn('Smith', response.data['patient_name'])
    
    def test_lookup_procedure_by_string_identifier(self):
        """Test retrieving procedure using string identifier."""
        # Create encounter and procedure
        encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
        })
        procedure = ProcedureService.record_procedure({
            'encounter_identifier': encounter.identifier,
            'code_code': '12345',
            'code_display': 'Test Procedure',
        }, self.user)
        
        # GET using string identifier
        url = reverse('procedure-detail', kwargs={'identifier': procedure.identifier})
        response = self.client.get(url)
        
        # Assert: HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['identifier'], procedure.identifier)
    
    def test_update_procedure_status_action(self):
        """Test update procedure status custom action."""
        # Create procedure
        encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
        })
        procedure = ProcedureService.record_procedure({
            'encounter_identifier': encounter.identifier,
            'code_code': '12345',
            'code_display': 'Test',
            'status': 'in-progress',
        }, self.user)
        
        # PATCH to update status
        url = reverse('procedure-update-status', kwargs={'identifier': procedure.identifier})
        data = {
            'status': 'completed',
            'status_reason_display': 'Successfully completed',
        }
        
        response = self.client.patch(url, data, format='json')
        
        # Assert: HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'completed')
    
    def test_get_procedures_by_encounter_action(self):
        """Test get procedures by encounter custom action."""
        # Create encounter and procedures
        encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
        })
        ProcedureService.record_procedure({
            'encounter_identifier': encounter.identifier,
            'code_code': '111',
            'code_display': 'Procedure 1',
        }, self.user)
        ProcedureService.record_procedure({
            'encounter_identifier': encounter.identifier,
            'code_code': '222',
            'code_display': 'Procedure 2',
        }, self.user)
        
        # GET procedures by encounter
        url = reverse('procedure-by-encounter')
        response = self.client.get(url, {'encounter_identifier': encounter.identifier})
        
        # Assert: HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_get_procedures_by_patient_action(self):
        """Test get procedures by patient custom action."""
        # Create encounter and procedure
        encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
        })
        ProcedureService.record_procedure({
            'encounter_identifier': encounter.identifier,
            'code_code': '111',
            'code_display': 'Procedure 1',
        }, self.user)
        
        # GET procedures by patient
        url = reverse('procedure-by-patient')
        response = self.client.get(url, {'patient_id': 'P-TEST-001'})
        
        # Assert: HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['subject_id'], self.patient.id)
    
    def test_unauthenticated_procedure_access(self):
        """Test that procedure endpoints require authentication."""
        # Logout
        self.client.force_authenticate(user=None)
        
        url = reverse('procedure-list')
        response = self.client.get(url)
        
        # Assert: HTTP 401 or 403 (depending on DRF settings)
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )


# ==================== SERIALIZER TESTS ====================

class SerializerTests(TestCase):
    """
    Test suite for CQRS serializers.
    Focus: Input validation and output enrichment.
    """
    
    def setUp(self):
        """Create test fixtures."""
        # Create practitioner (required for User FK)
        self.practitioner = Practitioner.objects.create(
            identifier='TEST-DOC-004',
            first_name='Test',
            last_name='Serializer'
        )
        
        # Create user linked to practitioner
        self.user = User.objects.create_user(
            username='serializeruser',
            password='serializerpass123',
            practitioner=self.practitioner,
            first_name='Test',
            last_name='User',
            status='active'
        )
        
        # Create patient
        self.patient = Patient.objects.create(
            patient_id='P-TEST-001',
            first_name='John',
            middle_name='Doe',
            last_name='Smith',
            birthdate='1990-01-01',
            gender='M',
            mobile_number='09171234567',
            blood_type='O+',
            civil_status='Single',
            religion='Catholic',
            nationality='Filipino',
            occupation='Engineer',
            contact_first_name='Jane',
            contact_last_name='Smith',
            contact_relationship='Sister',
            contact_mobile_number='09179876543'
        )
        self.encounter = EncounterService.create_encounter({
            'patient_id': 'P-TEST-001',
        })
    
    def test_encounter_input_serializer_validation(self):
        """Test EncounterInputSerializer validates patient existence."""
        serializer = EncounterInputSerializer(data={
            'patient_id': 'P-TEST-001',
            'type': 'inpatient',
        })
        
        self.assertTrue(serializer.is_valid())
    
    def test_encounter_input_serializer_invalid_patient(self):
        """Test EncounterInputSerializer rejects invalid patient."""
        serializer = EncounterInputSerializer(data={
            'patient_id': 'P-INVALID-999',
            'type': 'inpatient',
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('patient_id', serializer.errors)
    
    def test_encounter_output_serializer_enrichment(self):
        """Test EncounterOutputSerializer enriches data with patient name."""
        serializer = EncounterOutputSerializer(self.encounter)
        
        # Assert: Patient name resolved
        self.assertIn('patient_name', serializer.data)
        self.assertIn('Smith', serializer.data['patient_name'])
        
        # Assert: Patient identifier resolved
        self.assertIn('patient_identifier', serializer.data)
        self.assertEqual(serializer.data['patient_identifier'], 'P-TEST-001')
    
    def test_procedure_input_serializer_validation(self):
        """Test ProcedureInputSerializer validates encounter existence."""
        serializer = ProcedureInputSerializer(data={
            'encounter_identifier': self.encounter.identifier,
            'code_code': '12345',
            'code_display': 'Test Procedure',
        })
        
        self.assertTrue(serializer.is_valid())
    
    def test_procedure_input_serializer_invalid_encounter(self):
        """Test ProcedureInputSerializer rejects invalid encounter."""
        serializer = ProcedureInputSerializer(data={
            'encounter_identifier': 'ENC-INVALID-999',
            'code_code': '12345',
            'code_display': 'Test Procedure',
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('encounter_identifier', serializer.errors)

