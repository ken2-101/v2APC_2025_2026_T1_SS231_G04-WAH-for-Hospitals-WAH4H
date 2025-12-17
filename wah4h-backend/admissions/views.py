from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Admission
from .serializers import AdmissionSerializer

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all().order_by('-admission_date')
    serializer_class = AdmissionSerializer
    lookup_field = "id"  # Default PK

    # Optional: filter by ward, status, physician
    def get_queryset(self):
        queryset = super().get_queryset()
        ward = self.request.query_params.get('ward')
        status_param = self.request.query_params.get('status')
        doctor = self.request.query_params.get('doctor')

        if ward:
            queryset = queryset.filter(ward=ward)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if doctor:
            queryset = queryset.filter(attending_physician=doctor)
        return queryset

    # Optional: endpoint to generate admission_id if frontend doesn't
    @action(detail=False, methods=['get'])
    def generate_admission_id(self, request):
        import datetime, random
        year = datetime.datetime.now().year
        rand = random.randint(1000, 9999)
        admission_id = f"ADM-{year}-{rand}"
        return Response({"admission_id": admission_id})
