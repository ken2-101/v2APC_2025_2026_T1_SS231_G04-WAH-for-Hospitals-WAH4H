# monitoring/urls.py
from rest_framework import routers
from django.urls import path, include
from .views import PatientViewSet, VitalSignViewSet, ClinicalNoteViewSet, DietaryOrderViewSet, HistoryEventViewSet

router = routers.DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'vitals', VitalSignViewSet)
router.register(r'notes', ClinicalNoteViewSet)
router.register(r'dietary', DietaryOrderViewSet)
router.register(r'history', HistoryEventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
