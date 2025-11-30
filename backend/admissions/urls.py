from django.urls import path
from . import views

urlpatterns = [
    path('admissions/', views.admission_list, name='admission-list'),
    path('admissions/<str:pk>/', views.admission_detail, name='admission-detail'),
]
