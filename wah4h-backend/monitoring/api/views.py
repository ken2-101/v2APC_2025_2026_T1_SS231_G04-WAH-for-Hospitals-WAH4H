"""
monitoring/api/views.py

Hybrid ViewSets for the Monitoring Module.
Fortress Pattern - API Layer.

Architecture Pattern: Hybrid ViewSets (CQRS-Lite)
- CREATE operations: Delegate to Service Layer (Write)
- READ operations: Use ACL Layer (Read)
- Separation of concerns between command and query operations

Context: Philippine LGU Hospital System
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError

from monitoring.api.serializers import (
    ObservationInputSerializer,
    ObservationOutputSerializer,
    ChargeItemInputSerializer,
    ChargeItemOutputSerializer,
)
from monitoring.services.monitoring_services import (
    ObservationService,
    ChargeItemService,
)
from monitoring.services.monitoring_acl import (
    ObservationACL,
    ChargeItemACL,
)


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination configuration for monitoring resources.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class ObservationViewSet(viewsets.ViewSet):
    """
    Hybrid ViewSet for Observation resources.
    
    Implements CQRS-Lite pattern:
    - CREATE: Uses ObservationService (Write Layer)
    - LIST/RETRIEVE: Uses ObservationACL (Read Layer)
    
    Endpoints:
        POST /observations/                 - Create observation
        GET /observations/                  - List observations (filtered)
        GET /observations/{id}/             - Retrieve observation details
        GET /observations/patient/{id}/     - Get patient observations
        GET /observations/encounter/{id}/   - Get encounter observations
        GET /observations/latest/           - Get latest observation by code
    """
    pagination_class = StandardResultsSetPagination
    
    def create(self, request):
        """
        Create a new observation record.
        
        Delegates to ObservationService for write operations.
        Supports nested components for multi-component observations.
        
        Request Body:
            {
                "subject_id": 123,
                "encounter_id": 456,
                "code": "blood-pressure",
                "status": "final",
                "category": "vital-signs",
                "effective_datetime": "2026-02-04T10:30:00Z",
                "components": [
                    {
                        "code": "systolic",
                        "value_quantity": 120.0,
                        "reference_range_low": "90",
                        "reference_range_high": "120"
                    },
                    {
                        "code": "diastolic",
                        "value_quantity": 80.0,
                        "reference_range_low": "60",
                        "reference_range_high": "80"
                    }
                ]
            }
        
        Returns:
            201 Created: Observation created successfully
            400 Bad Request: Validation error
        """
        # Validate input
        serializer = ObservationInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delegate to service layer
            result = ObservationService.record_observation(serializer.validated_data)
            
            return Response(
                result,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to create observation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list(self, request):
        """
        List observations with filtering.
        
        Uses ObservationACL for read operations.
        
        Query Parameters:
            - patient_id (int): Filter by patient ID
            - encounter_id (int): Filter by encounter ID
            - category (str): Filter by category (e.g., 'vital-signs', 'laboratory')
            - page (int): Page number (default: 1)
            - page_size (int): Results per page (default: 50)
        
        Returns:
            200 OK: Paginated list of observations
            400 Bad Request: Invalid parameters
        """
        try:
            patient_id = request.query_params.get('patient_id')
            encounter_id = request.query_params.get('encounter_id')
            category = request.query_params.get('category')
            
            # Determine which ACL method to use
            if patient_id:
                observations = ObservationACL.get_patient_observations(
                    patient_id=int(patient_id),
                    category=category,
                    encounter_id=int(encounter_id) if encounter_id else None
                )
            elif encounter_id:
                observations = ObservationACL.get_encounter_observations(
                    encounter_id=int(encounter_id),
                    category=category
                )
            else:
                return Response(
                    {'error': 'patient_id or encounter_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Serialize output
            serializer = ObservationOutputSerializer(observations, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve observations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Retrieve a single observation by ID.
        
        Uses ObservationACL for read operations.
        
        Returns:
            200 OK: Observation details
            404 Not Found: Observation not found
        """
        try:
            observation = ObservationACL.get_observation_details(int(pk))
            
            if not observation:
                return Response(
                    {'error': f'Observation {pk} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize output
            serializer = ObservationOutputSerializer(observation)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve observation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='latest')
    def latest(self, request):
        """
        Get the latest observation for a patient by code.
        
        Query Parameters:
            - patient_id (int): Patient ID (required)
            - code (str): Observation code (required)
            - encounter_id (int): Optional encounter ID filter
        
        Returns:
            200 OK: Latest observation
            400 Bad Request: Missing parameters
            404 Not Found: No observation found
        """
        try:
            patient_id = request.query_params.get('patient_id')
            code = request.query_params.get('code')
            encounter_id = request.query_params.get('encounter_id')
            
            if not patient_id or not code:
                return Response(
                    {'error': 'patient_id and code are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            observation = ObservationACL.get_latest_observation(
                patient_id=int(patient_id),
                code=code,
                encounter_id=int(encounter_id) if encounter_id else None
            )
            
            if not observation:
                return Response(
                    {'error': f'No observation found for patient {patient_id} with code {code}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize output
            serializer = ObservationOutputSerializer(observation)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve observation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChargeItemViewSet(viewsets.ViewSet):
    """
    Hybrid ViewSet for ChargeItem resources.
    
    Implements CQRS-Lite pattern:
    - CREATE: Uses ChargeItemService (Write Layer)
    - LIST/RETRIEVE: Uses ChargeItemACL (Read Layer)
    
    Endpoints:
        POST /charge-items/                 - Create charge item
        GET /charge-items/                  - List charge items (filtered)
        GET /charge-items/{id}/             - Retrieve charge item details
        GET /charge-items/encounter/{id}/   - Get encounter charges
        GET /charge-items/patient/{id}/     - Get patient charges
    """
    pagination_class = StandardResultsSetPagination
    
    def create(self, request):
        """
        Create a new charge item record.
        
        Delegates to ChargeItemService for write operations.
        
        Request Body:
            {
                "subject_id": 123,
                "context_id": 456,
                "code": "consultation-fee",
                "status": "billable",
                "quantity_value": 1.0,
                "quantity_unit": "visit",
                "price_override_value": 500.00,
                "price_override_currency": "PHP",
                "occurrence_datetime": "2026-02-04T10:30:00Z"
            }
        
        Returns:
            201 Created: ChargeItem created successfully
            400 Bad Request: Validation error
        """
        # Validate input
        serializer = ChargeItemInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delegate to service layer
            result = ChargeItemService.record_charge_item(serializer.validated_data)
            
            return Response(
                result,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to create charge item: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list(self, request):
        """
        List charge items with filtering.
        
        Uses ChargeItemACL for read operations.
        
        Query Parameters:
            - patient_id (int): Filter by patient ID
            - encounter_id (int): Filter by encounter ID
            - account_id (int): Filter by account ID
            - code (str): Filter by charge code
            - page (int): Page number (default: 1)
            - page_size (int): Results per page (default: 50)
        
        Returns:
            200 OK: Paginated list of charge items
            400 Bad Request: Invalid parameters
        """
        try:
            patient_id = request.query_params.get('patient_id')
            encounter_id = request.query_params.get('encounter_id')
            account_id = request.query_params.get('account_id')
            code = request.query_params.get('code')
            
            # Determine which ACL method to use
            if encounter_id:
                charge_items = ChargeItemACL.get_encounter_charges(
                    encounter_id=int(encounter_id)
                )
            elif patient_id:
                charge_items = ChargeItemACL.get_patient_charges(
                    patient_id=int(patient_id),
                    account_id=int(account_id) if account_id else None
                )
            elif code:
                charge_items = ChargeItemACL.get_charge_items_by_code(code=code)
            else:
                return Response(
                    {'error': 'patient_id, encounter_id, or code is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Serialize output
            serializer = ChargeItemOutputSerializer(charge_items, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve charge items: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Retrieve a single charge item by ID.
        
        Uses ChargeItemACL for read operations.
        
        Returns:
            200 OK: ChargeItem details
            404 Not Found: ChargeItem not found
        """
        try:
            charge_item = ChargeItemACL.get_charge_item_details(int(pk))
            
            if not charge_item:
                return Response(
                    {'error': f'ChargeItem {pk} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize output
            serializer = ChargeItemOutputSerializer(charge_item)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve charge item: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


__all__ = [
    'ObservationViewSet',
    'ChargeItemViewSet',
]
