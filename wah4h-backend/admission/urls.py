from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EncounterViewSet, ProcedureViewSet, ProcedurePerformerViewSet

router = DefaultRouter()
router.register(r'encounters', EncounterViewSet)
router.register(r'procedures', ProcedureViewSet)
router.register(r'procedure-performers', ProcedurePerformerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]