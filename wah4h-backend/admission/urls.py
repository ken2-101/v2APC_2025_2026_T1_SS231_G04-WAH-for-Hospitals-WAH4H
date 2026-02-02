"""
Admission App URLs
==================
URL routing configuration for Admission module endpoints.

API Structure:
- /api/v1/admission/encounters/
- /api/v1/admission/procedures/
- /api/v1/admission/procedure-performers/

Author: WAH4H Backend Team
Date: February 2, 2026
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EncounterViewSet, ProcedureViewSet, ProcedurePerformerViewSet


# Initialize DRF Router
router = DefaultRouter()

# Register ViewSets with explicit basenames
router.register(
    r'encounters',
    EncounterViewSet,
    basename='encounter'
)

router.register(
    r'procedures',
    ProcedureViewSet,
    basename='procedure'
)

router.register(
    r'procedure-performers',
    ProcedurePerformerViewSet,
    basename='procedure-performer'
)

# URL Patterns
urlpatterns = [
    path('', include(router.urls)),
]