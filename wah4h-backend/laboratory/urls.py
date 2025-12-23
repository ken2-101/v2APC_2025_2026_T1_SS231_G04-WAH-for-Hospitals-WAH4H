from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabTestTypeViewSet, LabRequestViewSet

router = DefaultRouter()
router.register(r'tests', LabTestTypeViewSet)
router.register(r'requests', LabRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]