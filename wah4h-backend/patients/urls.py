from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet
from .api import TriggerDataAPIView

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patients')

urlpatterns = [
    # Custom path must be defined BEFORE router.urls to prevent the router 
    # from interpreting 'trigger-data' as a patient PK (id).
    path('patients/trigger-data/', TriggerDataAPIView.as_view(), name='trigger-data'),
    
    path('', include(router.urls)),
]
