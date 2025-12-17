from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Admission
from .serializers import AdmissionSerializer

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = (
            Admission.objects
            .select_related("patient")
            .order_by("-admission_date")
        )

        ward = self.request.query_params.get("ward")
        status_param = self.request.query_params.get("status")
        doctor = self.request.query_params.get("doctor")

        if ward:
            queryset = queryset.filter(ward=ward)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if doctor:
            queryset = queryset.filter(attending_physician__icontains=doctor)

        return queryset

    def create(self, request, *args, **kwargs):
        patient_id = request.data.get("patient")

        # Prevent multiple ACTIVE admissions
        if Admission.objects.filter(patient_id=patient_id, status="Active").exists():
            return Response(
                {"detail": "Patient already has an active admission."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Auto-generate admission_id in AXXX format
        last_adm = Admission.objects.order_by('-id').first()
        next_id = 1
        if last_adm and last_adm.admission_id:
            try:
                next_id = int(last_adm.admission_id[1:]) + 1
            except ValueError:
                next_id = last_adm.id + 1

        request.data["admission_id"] = f"A{str(next_id).zfill(3)}"

        return super().create(request, *args, **kwargs)

    # ✅ Discharge patient
    @action(detail=True, methods=["post"])
    def discharge(self, request, id=None):
        admission = self.get_object()
        if admission.status != "Active":
            return Response(
                {"detail": "Only active admissions can be discharged."},
                status=status.HTTP_400_BAD_REQUEST
            )
        admission.status = "Discharged"
        admission.save()
        serializer = self.get_serializer(admission)
        return Response(serializer.data)

    # ✅ Transfer patient
    @action(detail=True, methods=["post"])
    def transfer(self, request, id=None):
        admission = self.get_object()
        if admission.status != "Active":
            return Response(
                {"detail": "Only active admissions can be transferred."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ward = request.data.get("ward")
        room = request.data.get("room")
        bed = request.data.get("bed")

        if not all([ward, room, bed]):
            return Response(
                {"detail": "Ward, room, and bed are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        admission.ward = ward
        admission.room = room
        admission.bed = bed
        admission.status = "Transferred"
        admission.save()

        serializer = self.get_serializer(admission)
        return Response(serializer.data)
