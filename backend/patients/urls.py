# patients/urls.py
from django.urls import path
from .views import patient_list

urlpatterns = [
    path('', patient_list, name='patient-list'),  # Handles GET and POST at /api/patients/
]
