from rest_framework.viewsets import ModelViewSet
from .models import (
    VitalSign,
    ClinicalNote,
    DietaryOrder,
    HistoryEvent
)
from .serializers import (
    VitalSignSerializer,
    ClinicalNoteSerializer,
    DietaryOrderSerializer,
    HistoryEventSerializer
)

class VitalSignViewSet(ModelViewSet):
    queryset = VitalSign.objects.all().order_by("-date_time")
    serializer_class = VitalSignSerializer


class ClinicalNoteViewSet(ModelViewSet):
    queryset = ClinicalNote.objects.all().order_by("-date_time")
    serializer_class = ClinicalNoteSerializer


class DietaryOrderViewSet(ModelViewSet):
    queryset = DietaryOrder.objects.all()
    serializer_class = DietaryOrderSerializer


class HistoryEventViewSet(ModelViewSet):
    queryset = HistoryEvent.objects.all().order_by("-date_time")
    serializer_class = HistoryEventSerializer
