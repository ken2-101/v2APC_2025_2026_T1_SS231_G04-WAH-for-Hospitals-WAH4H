import requests
import logging
from .models import Patient
from .serializers import PatientSerializer

logger = logging.getLogger(__name__)

def send_patient_data(callback_url, patient_ids=None):
    """
    Prepares and sends patient data to an external webhook.

    Args:
        callback_url (str): The URL to send the data to.
        patient_ids (list, optional): List of patient IDs to filter by. 
                                      If None, sends all active patients.

    Returns:
        dict: A dictionary containing success status and message/details.
    """
    try:
        if patient_ids:
            patients = Patient.objects.filter(patient_id__in=patient_ids)
        else:
            # Default to all patients, or all active patients if you prefer
            patients = Patient.objects.all()

        if not patients.exists():
            return {
                "success": False,
                "message": "No patients found matching the criteria."
            }

        serializer = PatientSerializer(patients, many=True)
        data = serializer.data

        # Send data to external system
        response = requests.post(callback_url, json=data, timeout=10)
        
        # Check if the request was successful
        # 2xx status codes are considered successful
        if 200 <= response.status_code < 300:
            logger.info(f"Successfully sent {len(data)} patient records to {callback_url}")
            return {
                "success": True,
                "message": f"Successfully sent {len(data)} patient records.",
                "external_status": response.status_code
            }
        else:
            logger.error(f"Failed to send data. Status: {response.status_code}, Response: {response.text}")
            return {
                "success": False,
                "message": f"External system returned error: {response.status_code}",
                "details": response.text
            }

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error sending data to {callback_url}: {str(e)}")
        return {
            "success": False,
            "message": "Network error occurred while contacting external system.",
            "details": str(e)
        }
    except Exception as e:
        logger.exception("Unexpected error in send_patient_data")
        return {
            "success": False,
            "message": "An internal error occurred.",
            "details": str(e)
        }
