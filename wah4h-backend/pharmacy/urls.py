from rest_framework.routers import DefaultRouter
from .views import PrescriptionViewSet, DispenseViewSet, InventoryViewSet

router = DefaultRouter()
router.register(r'prescriptions', PrescriptionViewSet, basename='prescriptions')
router.register(r'dispense', DispenseViewSet, basename='dispense')
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = router.urls
