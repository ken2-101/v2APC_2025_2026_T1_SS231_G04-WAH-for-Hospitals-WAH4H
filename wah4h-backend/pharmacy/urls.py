from rest_framework.routers import DefaultRouter
from .views import PrescriptionViewSet, DispenseViewSet, InventoryViewSet, MedicationRequestViewSet

router = DefaultRouter()
router.register(r'prescriptions', PrescriptionViewSet, basename='prescriptions')
router.register(r'dispense', DispenseViewSet, basename='dispense')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'requests', MedicationRequestViewSet, basename='medication-requests')

urlpatterns = router.urls
