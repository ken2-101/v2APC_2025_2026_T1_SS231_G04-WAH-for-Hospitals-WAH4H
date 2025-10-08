from django.urls import path
from .views import patient_list  # import the function, not PatientViewSet

urlpatterns = [
    path('', patient_list, name='patient-list'),  # matches /api/patients/
]
