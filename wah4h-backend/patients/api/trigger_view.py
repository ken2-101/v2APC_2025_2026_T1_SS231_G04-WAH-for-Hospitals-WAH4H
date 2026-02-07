"""
patients/api/trigger_view.py

Trigger API - External System Integration Endpoint
==================================================

Purpose:
    - Exposes an endpoint to trigger data synchronization to an external system.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError

# Import the new service
from patients.services.trigger_service import TriggerService

class TriggerDataAPIView(APIView):
    """
    API View to trigger pushing patient data to an external webhook.
    
    Endpoint: POST /api/patients/trigger-data/
    
    Request Body (JSON):
    {
        "callback_url": "https://external-system.com/webhook",
        "patient_ids": [1, 2, 3]  
    }
    
    - 'callback_url' is required.
    - 'patient_ids' is optional. If omitted or empty, sends all patients.
    """
    
    def post(self, request, *args, **kwargs):
        data = request.data
        
        callback_url = data.get('callback_url')
        patient_ids = data.get('patient_ids', [])

        # Validate callback_url
        if not callback_url:
            return Response(
                {"error": "'callback_url' field is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Validate patient_ids format (list of integers)
        if patient_ids:
            if not isinstance(patient_ids, list):
                return Response(
                     {"error": "'patient_ids' must be a list of integers."},
                     status=status.HTTP_400_BAD_REQUEST
                )
            # Ensure contents are integers
            try:
                patient_ids = [int(pid) for pid in patient_ids]
            except (ValueError, TypeError):
                 return Response(
                     {"error": "'patient_ids' must contain only integers."},
                     status=status.HTTP_400_BAD_REQUEST
                )

        # Call the Trigger Service
        result = TriggerService.send_patient_data(callback_url, patient_ids)

        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Determine appropriate status code
            if "No patients found" in result.get('message', ''):
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            
            # Use 502 Bad Gateway for external connection issues
            if "Failed to connect" in result.get('message', ''):
                 return Response(result, status=status.HTTP_502_BAD_GATEWAY)

            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request, *args, **kwargs):
        """
        Handle GET requests to provide usage instructions.
        """
        return Response({
            "message": "This is a Trigger API. Please send a POST request to trigger data synchronization.",
            "usage": {
                "method": "POST",
                "url": request.build_absolute_uri(),
                "body": {
                    "callback_url": "http://127.0.0.1:5000/webhook/receive-patients",
                    "patient_ids": [1, 2, 3]
                },
                "note": "patient_ids is optional. If omitted, sends all patients."
            }
        }, status=status.HTTP_200_OK)
