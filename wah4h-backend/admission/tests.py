"""
Admission App Tests
===================
Comprehensive test suite for Encounter and Procedure management.

Test Coverage:
- Serializer Layer: Input validation and output enrichment
- View Layer: RESTful API endpoints

Author: WAH4H Backend Team
Date: February 2, 2026
"""

from rest_framework import serializers
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Encounter, Procedure, ProcedurePerformer
from .serializers import (
    EncounterSerializer,
    EncounterDischargeSerializer,
    ProcedureSerializer,
)
from patients.models import Patient
from accounts.models import Practitioner


User = get_user_model()


# ==================== SERIALIZER LAYER TESTS ====================

class EncounterSerializerTests(TestCase):
    """
    Test suite for EncounterSerializer business logic.
    """
    
    def _create_encounter(self, data):
        """Helper to create encounter using serializer."""
        serializer = EncounterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def setUp(self):
        """Create test fixtures."""
        self.practitioner = Practitioner.objects.create(
            identifier='TEST-DOC-001',
            first_name='Test',
            last_name='Doctor'
        )
        
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            practitioner=self.practitioner,
            first_name='Test',
            last_name='User',
            status='active'
        )
        
        self.patient = Patient.objects.create(
            patient_id='P-TEST-001',
            first_name='John',
            last_name='Smith',
            birthdate='1990-01-01',
            gender='M'
        )
    
    def test_create_encounter_success(self):
        """Test successful encounter creation."""
        encounter_data = {
            'patient_id': 'P-TEST-001',
            'type': 'inpatient',
            'class_field': 'IMP',
            'priority': 'routine',
        }
        
        encounter = self._create_encounter(encounter_data)
        
        self.assertIsNotNone(encounter)
        self.assertTrue(encounter.identifier.startswith('ENC-'))
        self.assertEqual(encounter.subject_id, self.patient.id)
        self.assertEqual(encounter.status, 'in-progress')
    
    def test_create_encounter_invalid_patient(self):
        """Test encounter creation with non-existent patient."""
        encounter_data = {
            'patient_id': 'P-NONEXISTENT-999',
            'type': 'outpatient',
        }
        
        with self.assertRaises(serializers.ValidationError) as context:
            self._create_encounter(encounter_data)
        
        self.assertIn('patient_id', str(context.exception))
    
    def test_discharge_encounter_success(self):
        """Test successful encounter discharge."""
        encounter = self._create_encounter({'patient_id': 'P-TEST-001'})
        
        serializer = EncounterDischargeSerializer(encounter, data={
            'discharge_disposition': 'Home',
        }, partial=True)
        serializer.is_valid(raise_exception=True)
        discharged = serializer.save()
        
        self.assertEqual(discharged.status, 'finished')
        self.assertIsNotNone(discharged.period_end)


class ProcedureSerializerTests(TestCase):
    """
    Test suite for ProcedureSerializer business logic.
    """
    
    def _create_encounter(self, data):
        serializer = EncounterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def _record_procedure(self, data, user=None):
        context = {}
        if user:
            from unittest.mock import MagicMock
            request = MagicMock()
            request.user = user
            context['request'] = request
        serializer = ProcedureSerializer(data=data, context=context)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def setUp(self):
        self.practitioner = Practitioner.objects.create(identifier='DOC-02', first_name='Doc')
        self.user = User.objects.create_user(username='doc', practitioner=self.practitioner)
        self.patient = Patient.objects.create(patient_id='P-02', first_name='Pat')
        self.encounter = self._create_encounter({'patient_id': 'P-02'})

    def test_record_procedure_success(self):
        data = {
            'encounter': self.encounter.encounter_id,
            'subject_id': self.patient.id,
            'code_code': 'PROC-01',
            'code_display': 'Test Procedure',
        }
        procedure = self._record_procedure(data, self.user)
        self.assertIsNotNone(procedure.identifier)
        self.assertEqual(procedure.recorder_id, self.user.id)


# ==================== API LAYER TESTS ====================

class AdmissionAPITests(APITestCase):
    """
    Test suite for Admission API endpoints.
    """
    
    def setUp(self):
        self.practitioner = Practitioner.objects.create(identifier='API-DOC', first_name='API')
        self.user = User.objects.create_user(username='apiuser', practitioner=self.practitioner)
        self.client.force_authenticate(user=self.user)
        self.patient = Patient.objects.create(patient_id='P-API', first_name='API', last_name='Smith')
    
    def _create_encounter(self, data):
        serializer = EncounterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def test_create_encounter_api(self):
        url = reverse('encounter-list')
        data = {
            'patient_id': 'P-API',
            'type': 'inpatient',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('identifier', response.data)

    def test_lookup_encounter_by_identifier(self):
        encounter = self._create_encounter({'patient_id': 'P-API'})
        url = reverse('encounter-detail', kwargs={'identifier': encounter.identifier})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['identifier'], encounter.identifier)

    def test_discharge_action(self):
        encounter = self._create_encounter({'patient_id': 'P-API'})
        url = reverse('encounter-discharge', kwargs={'identifier': encounter.identifier})
        data = {'discharge_disposition': 'Home'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'finished')
