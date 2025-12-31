from rest_framework.viewsets import ModelViewSet
from .models import VitalSign, ClinicalNote, DietaryOrder, HistoryEvent
from .serializers import VitalSignSerializer, ClinicalNoteSerializer, DietaryOrderSerializer, HistoryEventSerializer

class VitalSignViewSet(ModelViewSet):
    serializer_class = VitalSignSerializer
    queryset = VitalSign.objects.all()  # <-- add this
    # Optional: filter by admission
    def get_queryset(self):
        qs = super().get_queryset()
        admission_id = self.request.query_params.get("admission")
        if admission_id:
            qs = qs.filter(admission_id=admission_id)
        return qs.order_by("-date_time")


class ClinicalNoteViewSet(ModelViewSet):
    serializer_class = ClinicalNoteSerializer
    queryset = ClinicalNote.objects.all()  # <-- add this

    def get_queryset(self):
        qs = super().get_queryset()
        admission_id = self.request.query_params.get("admission")
        if admission_id:
            qs = qs.filter(admission_id=admission_id)
        return qs.order_by("-date_time")


class DietaryOrderViewSet(ModelViewSet):
    serializer_class = DietaryOrderSerializer
    queryset = DietaryOrder.objects.all()  # <-- add this

    def get_queryset(self):
        qs = super().get_queryset()
        admission_id = self.request.query_params.get("admission")
        if admission_id:
            qs = qs.filter(admission_id=admission_id)
        return qs


class HistoryEventViewSet(ModelViewSet):
    serializer_class = HistoryEventSerializer
    queryset = HistoryEvent.objects.all()  # <-- add this

    def get_queryset(self):
        qs = super().get_queryset()
        admission_id = self.request.query_params.get("admission")
        if admission_id:
            qs = qs.filter(admission_id=admission_id)
        return qs.order_by("-date_time")
