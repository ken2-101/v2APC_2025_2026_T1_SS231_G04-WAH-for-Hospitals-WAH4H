from rest_framework.routers import DefaultRouter
from .views import PrescriptionViewSet, DispenseViewSet, InventoryViewSet, MedicationRequestViewSet

router = DefaultRouter()
router.register(r'prescriptions', PrescriptionViewSet, basename='prescriptions')
router.register(r'dispense', DispenseViewSet, basename='dispense')
router.register(r'inventory', InventoryViewSet, basename='inventory')

# MedicationRequest uses simple ViewSet
from django.urls import path
med_request_list = MedicationRequestViewSet.as_view({'get': 'list', 'post': 'create'})

urlpatterns = router.urls + [
    path('medication-requests/', med_request_list, name='medication-requests'),
]
