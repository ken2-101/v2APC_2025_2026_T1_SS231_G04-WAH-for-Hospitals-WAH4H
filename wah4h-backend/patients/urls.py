"""
patients/urls.py

URL Configuration for Patients Module.
Registers ViewSets for Patient registration, clinical conditions, allergies, and immunizations.

Routes:
- /api/patients/
- /api/patients/conditions/
- /api/patients/allergies/
- /api/patients/immunizations/
- /api/patients/trigger-data/ (New)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from patients.api.views import (
    PatientViewSet,
    ConditionViewSet,
    AllergyViewSet,
    ImmunizationViewSet,
)
from patients.api.trigger_view import TriggerDataAPIView

# Initialize router
router = DefaultRouter()

# Register ViewSets with specific route prefixes
router.register(r'conditions', ConditionViewSet, basename='condition')
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'immunizations', ImmunizationViewSet, basename='immunization')
router.register(r'', PatientViewSet, basename='patient')

# URL patterns
urlpatterns = [
    # Custom path for Trigger API must be defined BEFORE router.urls 
    # to prevent router from catching it as a PK (e.g. patients/<pk>/)
    path('trigger-data/', TriggerDataAPIView.as_view(), name='trigger-data'),
    
    path('', include(router.urls)),
]