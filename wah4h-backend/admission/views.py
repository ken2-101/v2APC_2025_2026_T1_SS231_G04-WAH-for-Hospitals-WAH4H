from rest_framework import viewsets
from .models import Encounter, Procedure, ProcedurePerformer
from .serializers import EncounterSerializer, ProcedureSerializer, ProcedurePerformerSerializer

class EncounterViewSet(viewsets.ModelViewSet):
    queryset = Encounter.objects.all()
    serializer_class = EncounterSerializer

class ProcedureViewSet(viewsets.ModelViewSet):
    queryset = Procedure.objects.all()
    serializer_class = ProcedureSerializer

class ProcedurePerformerViewSet(viewsets.ModelViewSet):
    queryset = ProcedurePerformer.objects.all()
    serializer_class = ProcedurePerformerSerializer