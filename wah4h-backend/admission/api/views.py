from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from admission.models import Encounter, Procedure, ProcedurePerformer
from admission.api.serializers import (
    EncounterSerializer,
    ProcedureSerializer,
    ProcedurePerformerSerializer,
)


class EncounterViewSet(viewsets.ModelViewSet):
    queryset = Encounter.objects.all().order_by('-period_start')
    serializer_class = EncounterSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject_id', 'status', 'class_field']


class ProcedureViewSet(viewsets.ModelViewSet):
    queryset = Procedure.objects.all().order_by('-performed_datetime')
    serializer_class = ProcedureSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['encounter_id', 'subject_id']


class ProcedurePerformerViewSet(viewsets.ModelViewSet):
    queryset = ProcedurePerformer.objects.all()
    serializer_class = ProcedurePerformerSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['procedure_id']
