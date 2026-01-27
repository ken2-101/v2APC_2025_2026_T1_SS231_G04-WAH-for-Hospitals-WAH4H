from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiagnosticReportViewSet

router = DefaultRouter()
router.register(r'diagnostic-reports', DiagnosticReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]