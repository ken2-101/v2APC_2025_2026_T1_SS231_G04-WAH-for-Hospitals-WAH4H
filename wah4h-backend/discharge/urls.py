from rest_framework.routers import DefaultRouter
from .views import DischargeRecordViewSet, DischargeRequirementsViewSet

router = DefaultRouter()
router.register(r'records', DischargeRecordViewSet, basename='discharge-records')
router.register(r'requirements', DischargeRequirementsViewSet, basename='discharge-requirements')

urlpatterns = router.urls
