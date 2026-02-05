"""
patients/urls.py

URL Configuration for Patients Module.
Registers ViewSets for Patient registration, clinical conditions, allergies, and immunizations.

Routes:
- /api/patients/
- /api/patients/conditions/
- /api/patients/allergies/
- /api/patients/immunizations/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from patients.api.views import (
    PatientViewSet,
    ConditionViewSet,
    AllergyViewSet,
    ImmunizationViewSet,
)

# Initialize router
router = DefaultRouter()

# Register ViewSets with specific route prefixes
router.register(r'', PatientViewSet, basename='patient')
router.register(r'conditions', ConditionViewSet, basename='condition')
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'immunizations', ImmunizationViewSet, basename='immunization')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]