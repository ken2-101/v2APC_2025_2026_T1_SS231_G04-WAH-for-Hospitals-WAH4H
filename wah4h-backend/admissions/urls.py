from rest_framework.routers import DefaultRouter
from .views import AdmissionViewSet

router = DefaultRouter()
router.register(r'', AdmissionViewSet, basename='admissions')  # '' means root of included path

urlpatterns = router.urls
