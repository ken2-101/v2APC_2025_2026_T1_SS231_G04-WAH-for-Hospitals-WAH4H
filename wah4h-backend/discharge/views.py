from rest_framework import viewsets
from .models import Discharge
from .serializers import DischargeSerializer

class DischargeViewSet(viewsets.ModelViewSet):
    queryset = Discharge.objects.all()
    serializer_class = DischargeSerializer