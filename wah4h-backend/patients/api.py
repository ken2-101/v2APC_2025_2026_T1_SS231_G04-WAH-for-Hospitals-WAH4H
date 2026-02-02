from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import send_patient_data

class TriggerDataAPIView(APIView):
    """
    API View to trigger sending patient data to an external system.
    
    POST Parameters:
    - callback_url (str): The external webhook URL (Required).
    - patient_ids (list[int]): Optional list of patient IDs to send.
    """
    
    def post(self, request, *args, **kwargs):
        callback_url = request.data.get('callback_url')
        patient_ids = request.data.get('patient_ids', [])

        if not callback_url:
            return Response(
                {"error": "callback_url is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # distinct validation for patient_ids if provided, should be a list
        if patient_ids and not isinstance(patient_ids, list):
             return Response(
                {"error": "patient_ids must be a list of integers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Call the service function
        result = send_patient_data(callback_url, patient_ids)

        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Determine appropriate error status
            if "No patients found" in result['message']:
                return Response(result, status=status.HTTP_404_NOT_FOUND)
                
            return Response(result, status=status.HTTP_502_BAD_GATEWAY)
