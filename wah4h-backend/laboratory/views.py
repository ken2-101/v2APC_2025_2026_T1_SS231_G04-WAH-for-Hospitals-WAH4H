from rest_framework import viewsets
from .models import DiagnosticReport
from .serializers import DiagnosticReportSerializer

class DiagnosticReportViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticReport.objects.all()
    serializer_class = DiagnosticReportSerializer