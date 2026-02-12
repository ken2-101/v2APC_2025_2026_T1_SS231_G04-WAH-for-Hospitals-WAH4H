from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DiagnosticReport
from .serializers import DiagnosticReportSerializer


class DiagnosticReportViewSet(viewsets.ModelViewSet):
    """Thin viewset - delegate validation and business logic to the serializer.

    Exposes a `finalize` action to run serializer-level state transitions
    (for example, issuing the report).
    """
    queryset = DiagnosticReport.objects.all()
    serializer_class = DiagnosticReportSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """Run serializer-level finalization/state transition for the report."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        # delegate finalization to serializer (keeps view thin)
        serializer.finalize(instance)
        return Response(self.get_serializer(instance).data)