from rest_framework.routers import DefaultRouter
from .views import (
    VitalSignViewSet,
    ClinicalNoteViewSet,
    DietaryOrderViewSet,
    HistoryEventViewSet
)

router = DefaultRouter()
router.register("vitals", VitalSignViewSet)
router.register("notes", ClinicalNoteViewSet)
router.register("dietary-orders", DietaryOrderViewSet)
router.register("history", HistoryEventViewSet)

urlpatterns = router.urls
