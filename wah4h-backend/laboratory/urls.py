from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabRequestViewSet, LabResultViewSet, TestParameterViewSet

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'requests', LabRequestViewSet, basename='lab-request')
router.register(r'results', LabResultViewSet, basename='lab-result')
router.register(r'parameters', TestParameterViewSet, basename='test-parameter')

app_name = 'laboratory'

urlpatterns = [
    path('', include(router.urls)),
]