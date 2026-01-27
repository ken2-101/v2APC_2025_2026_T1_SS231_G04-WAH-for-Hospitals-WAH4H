from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InventoryViewSet, 
    MedicationViewSet, 
    MedicationRequestViewSet, 
    MedicationAdministrationViewSet
)

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet)
router.register(r'medications', MedicationViewSet)
router.register(r'medication-requests', MedicationRequestViewSet)
router.register(r'medication-administrations', MedicationAdministrationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]