"""
laboratory/urls.py

URL Configuration for Laboratory Module.
Registers ViewSets for laboratory test definitions (catalog) and diagnostic reports (results).

Routes:
- /api/laboratory/tests/
- /api/laboratory/reports/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from laboratory.api.views import (
    LabTestDefinitionViewSet,
    DiagnosticReportViewSet,
)

# Initialize router
router = DefaultRouter()

# Register ViewSets with specific route prefixes
router.register(r'tests', LabTestDefinitionViewSet, basename='lab-test-definition')
router.register(r'reports', DiagnosticReportViewSet, basename='diagnostic-report')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]