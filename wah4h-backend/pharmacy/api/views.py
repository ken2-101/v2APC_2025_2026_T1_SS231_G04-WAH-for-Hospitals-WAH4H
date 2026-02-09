"""
pharmacy/api/views.py

Hybrid ViewSets for Pharmacy Module (CQRS-Lite Pattern)
Architecture Pattern: Command-Query Responsibility Segregation (Lite)

Context: Philippine LGU Hospital System
- Commands (Write): Delegate to service layer (pharmacy_services.py)
- Queries (Read): Direct queryset retrieval with output serializers
- Fortress Pattern: All external validations via ACL layers
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from pharmacy.models import (
    Inventory,
    MedicationRequest,
    MedicationAdministration
)
from pharmacy.api.serializers import (
    InventoryInputSerializer,
    InventoryOutputSerializer,
    MedicationRequestInputSerializer,
    MedicationRequestOutputSerializer,
    MedicationAdministrationInputSerializer,
    MedicationAdministrationOutputSerializer,
    StockUpdateInputSerializer
)
from pharmacy.services.pharmacy_services import (
    InventoryService,
    MedicationService,
    AdministrationService
)


class InventoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Inventory management.
    
    Endpoints:
        - GET /api/pharmacy/inventory/ - List all inventory items
        - POST /api/pharmacy/inventory/ - Create new inventory item
        - GET /api/pharmacy/inventory/{id}/ - Retrieve inventory details
        - PUT /api/pharmacy/inventory/{id}/ - Update inventory item
        - PATCH /api/pharmacy/inventory/{id}/ - Partial update
        - DELETE /api/pharmacy/inventory/{id}/ - Delete inventory item
        - POST /api/pharmacy/inventory/update-stock/ - Update stock levels
    """
    queryset = Inventory.objects.all().order_by('-created_at')
    lookup_field = 'inventory_id'
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['create', 'update', 'partial_update']:
            return InventoryInputSerializer
        return InventoryOutputSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new inventory item.
        Delegates to InventoryService.create_item.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to service layer
            inventory = InventoryService.create_item(serializer.validated_data)
            
            # Return output serializer
            output_serializer = InventoryOutputSerializer(inventory)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='update-stock')
    def update_stock(self, request):
        """
        Update stock levels for an inventory item.
        
        Request Body:
            {
                "item_code": "MED-001",
                "quantity": 50,
                "operation": "add" | "subtract"
            }
        """
        serializer = StockUpdateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to service layer
            inventory = InventoryService.update_stock(
                item_code=serializer.validated_data['item_code'],
                quantity=serializer.validated_data['quantity'],
                operation=serializer.validated_data['operation']
            )
            
            # Return output serializer
            output_serializer = InventoryOutputSerializer(inventory)
            return Response(output_serializer.data)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class MedicationRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MedicationRequest (Prescriptions).
    
    Endpoints:
        - GET /api/pharmacy/medication-requests/ - List all medication requests
        - POST /api/pharmacy/medication-requests/ - Create new prescription
        - GET /api/pharmacy/medication-requests/{id}/ - Retrieve request details
        - PUT /api/pharmacy/medication-requests/{id}/ - Update request
        - PATCH /api/pharmacy/medication-requests/{id}/ - Partial update
        - DELETE /api/pharmacy/medication-requests/{id}/ - Delete request
        - GET /api/pharmacy/medication-requests/by-encounter/?encounter_id={id}
        - GET /api/pharmacy/medication-requests/by-patient/?patient_id={id}
    """
    queryset = MedicationRequest.objects.prefetch_related('dosages').all().order_by('-authored_on')
    lookup_field = 'medication_request_id'
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['create', 'update', 'partial_update']:
            return MedicationRequestInputSerializer
        return MedicationRequestOutputSerializer

    def get_queryset(self):
        """
        Get queryset with optional filtering.
        """
        queryset = MedicationRequest.objects.prefetch_related('dosages').all().order_by('-authored_on')
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create a new medication prescription with dosages.
        Delegates to MedicationService.prescribe_medication.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to service layer
            medication_request = MedicationService.prescribe_medication(
                serializer.validated_data
            )
            
            # Reload with prefetch to get dosages
            medication_request = MedicationRequest.objects.prefetch_related('dosages').get(
                medication_request_id=medication_request.medication_request_id
            )
            
            # Return output serializer
            output_serializer = MedicationRequestOutputSerializer(medication_request)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='by-encounter')
    def by_encounter(self, request):
        """
        Get all medication requests for a specific encounter.
        
        Query Params:
            encounter_id (int): Encounter ID
        """
        encounter_id = request.query_params.get('encounter_id')
        
        if not encounter_id:
            return Response(
                {'error': 'encounter_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            encounter_id = int(encounter_id)
        except ValueError:
            return Response(
                {'error': 'encounter_id must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(encounter_id=encounter_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-patient')
    def by_patient(self, request):
        """
        Get all medication requests for a specific patient.
        
        Query Params:
            patient_id (int): Patient ID
            status (str, optional): Filter by status
        """
        patient_id = request.query_params.get('patient_id')
        
        if not patient_id:
            return Response(
                {'error': 'patient_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            patient_id = int(patient_id)
        except ValueError:
            return Response(
                {'error': 'patient_id must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(subject_id=patient_id)
        
        # Optional status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, medication_request_id=None):
        """
        Update the status of a medication request.
        
        Body:
            status (str): New status value
            note (str, optional): Additional note
        """
        try:
            medication_request = self.get_object()
            new_status = request.data.get('status')
            note = request.data.get('note')
            
            if not new_status:
                return Response(
                    {'error': 'status field is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            quantity = request.data.get('quantity')
            
            # Update the status via service (handles inventory)
            medication_request = MedicationService.update_status(
                medication_request_id=medication_request.medication_request_id,
                status=new_status,
                note=note,
                quantity=int(float(quantity)) if quantity is not None else None
            )
            
            # Return updated data
            output_serializer = MedicationRequestOutputSerializer(medication_request)
            return Response(output_serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class MedicationAdministrationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MedicationAdministration (Dispensing/Usage).
    
    Endpoints:
        - GET /api/pharmacy/medication-administrations/ - List all administrations
        - POST /api/pharmacy/medication-administrations/ - Record administration
        - GET /api/pharmacy/medication-administrations/{id}/ - Retrieve details
        - PUT /api/pharmacy/medication-administrations/{id}/ - Update
        - PATCH /api/pharmacy/medication-administrations/{id}/ - Partial update
        - DELETE /api/pharmacy/medication-administrations/{id}/ - Delete
        - GET /api/pharmacy/medication-administrations/by-encounter/?encounter_id={id}
        - GET /api/pharmacy/medication-administrations/by-patient/?patient_id={id}
    """
    queryset = MedicationAdministration.objects.select_related('dosage').all().order_by('-effective_datetime')
    lookup_field = 'medication_administration_id'
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['create', 'update', 'partial_update']:
            return MedicationAdministrationInputSerializer
        return MedicationAdministrationOutputSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Record medication administration with dosage.
        CRITICAL: Automatically deducts inventory if item_code and quantity provided.
        Delegates to AdministrationService.administer_medication.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to service layer (includes inventory deduction)
            medication_admin = AdministrationService.administer_medication(
                serializer.validated_data
            )
            
            # Reload with select_related to get dosage
            medication_admin = MedicationAdministration.objects.select_related('dosage').get(
                medication_administration_id=medication_admin.medication_administration_id
            )
            
            # Return output serializer
            output_serializer = MedicationAdministrationOutputSerializer(medication_admin)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='by-encounter')
    def by_encounter(self, request):
        """
        Get all medication administrations for a specific encounter.
        
        Query Params:
            encounter_id (int): Encounter ID (context_id)
        """
        encounter_id = request.query_params.get('encounter_id')
        
        if not encounter_id:
            return Response(
                {'error': 'encounter_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            encounter_id = int(encounter_id)
        except ValueError:
            return Response(
                {'error': 'encounter_id must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(context_id=encounter_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-patient')
    def by_patient(self, request):
        """
        Get all medication administrations for a specific patient.
        
        Query Params:
            patient_id (int): Patient ID (subject_id)
        """
        patient_id = request.query_params.get('patient_id')
        
        if not patient_id:
            return Response(
                {'error': 'patient_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            patient_id = int(patient_id)
        except ValueError:
            return Response(
                {'error': 'patient_id must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(subject_id=patient_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
