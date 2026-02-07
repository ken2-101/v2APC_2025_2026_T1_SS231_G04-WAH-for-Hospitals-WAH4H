import requests
import os

URL = "https://wah4pc.echosphere.cfd"
API_KEY = os.getenv("WAH4PC_API_KEY")
PROVIDER_ID = os.getenv("WAH4PC_PROVIDER_ID")


def request_patient(target_id, philhealth_id):
    return requests.post(
        f"{URL}/api/v1/fhir/request/Patient",
        headers={"X-API-Key": API_KEY, "X-Provider-ID": PROVIDER_ID},
        json={
            "requesterId": PROVIDER_ID,
            "targetId": target_id,
            "identifiers": [
                {"system": "http://philhealth.gov.ph", "value": philhealth_id}
            ],
        },
    ).json()


def fhir_to_dict(fhir):
    name = fhir.get("name", [{}])[0]
    ids = fhir.get("identifier", [])
    ph_id = next(
        (i["value"] for i in ids if "philhealth" in i.get("system", "")), None
    )
    return {
        "first_name": name.get("given", [""])[0],
        "last_name": name.get("family", ""),
        "gender": fhir.get("gender", "").capitalize(),
        "birthdate": fhir.get("birthDate"),
        "philhealth_id": ph_id,
    }
