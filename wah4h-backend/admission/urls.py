"""
admission/urls.py

URL Configuration for Admission Module.
Registers ViewSets for patient encounters (admissions).

Routes:
- /api/admission/encounters/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from admission.api.views import (
    EncounterViewSet,
)

# Initialize router
router = DefaultRouter()

# Register ViewSets with specific route prefixes
router.register(r'encounters', EncounterViewSet, basename='encounter')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]
