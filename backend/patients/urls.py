# patients/urls.py
from django.urls import path
from .views import patient_list, patient_detail

urlpatterns = [
    path('', patient_list, name='patient-list'),
    path('<str:pk>', patient_detail, name='patient-detail')
        # Handles GET and POST at /api/patients/
]
