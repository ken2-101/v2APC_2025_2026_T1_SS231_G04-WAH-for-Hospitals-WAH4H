"""
patients/services/trigger_service.py

Trigger Service - Handles External Data Push
============================================

Purpose:
    - Fetches patient data based on request.
    - Serializes data using PatientOutputSerializer.
    - Pushes data to an external webhook (callback_url).
"""

import requests
import logging
from typing import List, Dict, Any, Optional
from rest_framework.renderers import JSONRenderer

from patients.models import Patient
from patients.api.serializers import PatientMobileSerializer
from patients.services import patient_acl

logger = logging.getLogger(__name__)

class TriggerService:
    """
    Service to handle pushing patient data to an external system.
    """

    @staticmethod
    def send_patient_data(callback_url: str, patient_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Prepares and sends patient data to an external webhook.

        Args:
            callback_url (str): The URL to send the data to.
            patient_ids (list, optional): List of patient IDs (primary key) to filter by. 
                                          If None or empty, sends all patients.

        Returns:
            dict: A dictionary containing success status and message/details.
        """
        try:
            # 1. Fetch Patients
            if patient_ids:
                # Use scalar filtering since we need model instances for the serializer
                # However, PatientOutputSerializer expects data from ACL or Model.
                # Let's check if ACL has bulk fetch. existing ACL suggests 'search' or 'details'.
                # For efficiency, we'll query models directly here OR use ACL loop.
                # Direct query is faster for bulk.
                patients = Patient.objects.filter(id__in=patient_ids)
            else:
                patients = Patient.objects.all()

            if not patients.exists():
                return {
                    "success": False,
                    "message": "No patients found matching the criteria."
                }

            # 2. Process Patients One by One
            success_count = 0
            fail_count = 0
            errors = []

            for patient in patients:
                try:
                    # Serialize single patient with mobile-optimized fields
                    serializer = PatientMobileSerializer(patient)
                    data = serializer.data

                    # Send Request for this specific patient
                    response = requests.post(callback_url, json=data, timeout=10)
                    response.raise_for_status()
                    
                    success_count += 1
                
                except Exception as e:
                    fail_count += 1
                    # Log error but continue processing others
                    logger.error(f"Failed to push patient ID {patient.id}: {str(e)}")
                    errors.append(f"ID {patient.id}: {str(e)}")

            # 3. Return Summary
            # Even if some or all failed, we return a successful response structure 
            # so the caller knows what happened.
            return {
                "success": True,  # The *trigger* was successful, even if delivery failed
                "message": f"Processed {patients.count()} records. Success: {success_count}, Failed: {fail_count}",
                "total_processed": patients.count(),
                "success_count": success_count,
                "fail_count": fail_count,
                "errors": errors[:10]  # Return up to 10 errors
            }

        except Exception as e:
            logger.exception("Unexpected error in TriggerService")
            # This is a true internal error (code crash), so we return success=False
            return {
                "success": False,
                "message": "Internal server error during data preparation.",
                "details": str(e)
            }
