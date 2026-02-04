from rest_framework.routers import DefaultRouter
from admission.api.views import (
    EncounterViewSet,
    ProcedureViewSet,
    ProcedurePerformerViewSet,
)

app_name = 'admission'

router = DefaultRouter()
router.register(r'encounters', EncounterViewSet, basename='encounter')
router.register(r'procedures', ProcedureViewSet, basename='procedure')
router.register(r'performers', ProcedurePerformerViewSet, basename='performer')

urlpatterns = router.urls
