from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DischargeRecordViewSet

router = DefaultRouter()
router.register(r'discharge-records', DischargeRecordViewSet, basename='discharge-record')

urlpatterns = [
    path('', include(router.urls)),
]