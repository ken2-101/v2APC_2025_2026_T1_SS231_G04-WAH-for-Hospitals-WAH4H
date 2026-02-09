from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from admission.models import Encounter, Procedure
from .serializers import (
    EncounterSerializer,
    EncounterDischargeSerializer,
    ProcedureSerializer
)

class EncounterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Encounter (Admission) operations.
    """
    queryset = Encounter.objects.all().order_by('-period_start')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject_id', 'status', 'class_field']
    serializer_class = EncounterSerializer
    lookup_field = 'identifier'

    def get_serializer_class(self):
        if self.action == 'discharge':
            return EncounterDischargeSerializer
        return EncounterSerializer

    @action(detail=True, methods=['post'])
    def discharge(self, request, identifier=None):
        """
        Discharge patient.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EncounterSerializer(instance).data)

    @action(detail=False, methods=['get'])
    def locations(self, request):
        """
        Get Location Hierarchy with dynamic occupancy calculation.
        """
        active_encounters = Encounter.objects.filter(status='in-progress')
        occupancy = {}
        for enc in active_encounters:
            if enc.location_ids:
                for code in enc.location_ids:
                    if code:
                        occupancy[code] = occupancy.get(code, 0) + 1

        data = {
           "buildings": [
             { "code": "MAIN", "name": "Main Building" },
             { "code": "ANNEX", "name": "Annex Building" }
           ],
           "wings": {
             "MAIN": [
               { "code": "MAIN-EAST", "name": "East Wing" },
               { "code": "MAIN-WEST", "name": "West Wing" }
             ],
             "ANNEX": [
               { "code": "ANNEX-NORTH", "name": "North Wing" }
             ]
           },
           "wards": {
             "MAIN-EAST": [
                 { "code": "GEN-WARD", "name": "General Ward", "type": "wa", "capacity": 20, "occupied": occupancy.get("GEN-WARD", 0) },
                 { "code": "ICU", "name": "Intensive Care Unit", "type": "su", "capacity": 10, "occupied": occupancy.get("ICU", 0) }
             ],
             "MAIN-WEST": [
                 { "code": "PEDIA", "name": "Pediatrics Ward", "type": "su", "capacity": 15, "occupied": occupancy.get("PEDIA", 0) }
             ],
             "ANNEX-NORTH": [
                 { "code": "ISO", "name": "Isolation Ward", "type": "su", "capacity": 8, "occupied": occupancy.get("ISO", 0) },
                 { "code": "ID-WARD", "name": "Infectious Disease", "type": "su", "capacity": 10, "occupied": occupancy.get("ID-WARD", 0) }
             ]
           },
           "corridors": {
             "GEN-WARD": [{ "code": "GEN-HALL-A", "name": "Hallway A" }, { "code": "GEN-HALL-B", "name": "Hallway B" }],
             "ICU": [{ "code": "ICU-HALL", "name": "Central Station" }],
             "PEDIA": [{ "code": "PED-HALL", "name": "Play Area Corridor" }],
             "ISO": [{ "code": "ISO-HALL", "name": "Secure Corridor" }],
             "ID-WARD": [{ "code": "ID-HALL", "name": "Bio-Containment Hall" }]
           },
           "rooms": {
             "GEN-HALL-A": [
               { "code": "GEN-101", "name": "Room 101", "beds": 4, "occupied": occupancy.get("GEN-101", 0) },
               { "code": "GEN-102", "name": "Room 102", "beds": 4, "occupied": occupancy.get("GEN-102", 0) },
               { "code": "GEN-103", "name": "Room 103", "beds": 4, "occupied": occupancy.get("GEN-103", 0) }
             ],
             "GEN-HALL-B": [
               { "code": "GEN-104", "name": "Room 104", "beds": 4, "occupied": occupancy.get("GEN-104", 0) },
               { "code": "GEN-105", "name": "Room 105", "beds": 4, "occupied": occupancy.get("GEN-105", 0) }
             ],
             "ICU-HALL": [
               { "code": "ICU-01", "name": "ICU Bay 1", "beds": 1, "occupied": occupancy.get("ICU-01", 0) },
               { "code": "ICU-02", "name": "ICU Bay 2", "beds": 1, "occupied": occupancy.get("ICU-02", 0) },
               { "code": "ICU-03", "name": "ICU Bay 3", "beds": 1, "occupied": occupancy.get("ICU-03", 0) }
             ],
             "PED-HALL": [
               { "code": "PED-201", "name": "Room 201", "beds": 2, "occupied": occupancy.get("PED-201", 0) },
               { "code": "PED-202", "name": "Room 202", "beds": 2, "occupied": occupancy.get("PED-202", 0) }
             ],
             "ISO-HALL": [
               { "code": "ISO-01", "name": "Isolation 1", "beds": 1, "occupied": occupancy.get("ISO-01", 0) },
               { "code": "ISO-02", "name": "Isolation 2", "beds": 1, "occupied": occupancy.get("ISO-02", 0) }
             ],
             "ID-HALL": [
               { "code": "ID-01", "name": "Infect. Disease 01", "beds": 1, "occupied": occupancy.get("ID-01", 0) },
               { "code": "ID-02", "name": "Infect. Disease 02", "beds": 1, "occupied": occupancy.get("ID-02", 0) }
             ]
           }
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def search_patients(self, request):
        """
        Search for patients by name or ID.
        """
        query = request.query_params.get('q', '')
        from patients.models import Patient

        if not query:
            patients = Patient.objects.all().order_by('-id')[:10]
        else:
            patients = Patient.objects.filter(
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) | 
                Q(patient_id__icontains=query)
            )[:10]
        
        results = []
        for p in patients:
            results.append({
                'id': p.id,
                'patientId': p.patient_id,
                'name': f"{p.first_name} {p.last_name}",
                'dob': p.birthdate,
                'age': 0,
                'contact': p.mobile_number,
                'philhealth': p.philhealth_id
            })
            
        return Response(results)

class ProcedureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Procedure operations.
    """
    queryset = Procedure.objects.all().order_by('-performed_datetime')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['encounter', 'subject_id', 'status']
    serializer_class = ProcedureSerializer
    lookup_field = 'identifier'
