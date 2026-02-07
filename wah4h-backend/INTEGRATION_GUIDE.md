# WAH4H Patient Data Integration Guide

This guide explains how external systems can integrate with the **WAH for Hospitals (WAH4H)** backend to receive patient data.

## 🏗️ Architecture Overview

The integration works on a **Push-on-Demand** model:

1. **You (The External System)** expose a Webhook URL (an API endpoint) to receive data.
2. **We (or You)** call our Trigger API to start the process.
3. **Our System** gathers the patient data and sends **one POST request per patient** to your Webhook URL.

### Backend Components (For WAH4H Devs)

- **Controller**: `patients/api/trigger_view.py`
- **Service Logic**: `patients/services/trigger_service.py`
- **Routing**: `patients/urls.py` (Endpoint: `/trigger-data/`)

---

## Step 1: Requirements for the External System

You need to build an API endpoint (Webhook) that:

1. Accepts `POST` requests.
2. Expects a JSON body containing a **single patient record**.
3. Returns a `200 OK` status to confirm receipt.

### Expected JSON Payload (Per Request)

This payload is optimized for mobile apps, containing only essential identity, contact, and medical summary data.

```json
{
  "patient_id": "WAH-2026-00001",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "middle_name": "Santos",
  "suffix_name": null,
  "birthdate": "1990-05-15",
  "gender": "male",
  "image_url": "https://example.com/profile.jpg",

  "mobile_number": "09171234567",
  "address_line": "123 Mabini St",
  "address_city": "Quezon City",
  "address_district": "Barangay 1",
  "address_state": "Metro Manila",

  "blood_type": "O+",
  "philhealth_id": "12-345678901-2",
  "pwd_type": null,
  "civil_status": "single",

  "contact_first_name": "Maria",
  "contact_last_name": "Dela Cruz",
  "contact_mobile_number": "09181234567",
  "contact_relationship": "Mother",

  "conditions": [
    {
      "code": "Hypertension",
      "clinical_status": "active",
      "onset": "2025-01-01",
      "severity": "moderate"
    }
  ],
  "allergies": [
    {
      "code": "Penicillin",
      "criticality": "high",
      "reaction": "Skin rash"
    }
  ],
  "immunizations": [
    {
      "vaccine": "COVID-19",
      "date": "2024-06-15",
      "status": "completed"
    }
  ]
}
```

---

## Step 2: Requesting Data (The Trigger)

To tell WAH4H to send you the data, send a `POST` request to our trigger endpoint.

**Endpoint:** `POST /api/patients/trigger-data/`  
**Host:** `http://localhost:8000` (Local) or `http://<SERVER_IP>:8000`

### Request Body

```json
{
  "callback_url": "https://your-external-system.com/api/receive-patient/",
  "patient_ids": [1, 2]
}
```

- `callback_url` (Required): The URL on _your_ server where we should send the data.
- `patient_ids` (Optional): A list of specific IDs (integers) you want. If omitted, we send **all** patients sequentially.

---

## Step 3: Developer Resources (AI Prompt)

If you are the developer building the "External System" side, copy and paste the prompt below into an AI coding assistant (like ChatGPT, Claude, or DeepSeek) to generate your starter code.

### 🤖 AI Prompt for External Developers

> I am building an external backend system (using Python/FastAPI, Node.js/Express, or Flask - pick one) that needs to integrate with a Hospital Management System (WAH4H).
>
> I need you to write two things for me:
>
> 1.  **A Webhook Listener API**:
>     - Create an endpoint (e.g., `/webhook/receive-patient`) that accepts a POST request.
>     - It should receive a **single JSON object** (representing one patient data package).
>     - The payload will include nested arrays for `conditions`, `allergies`, and `immunizations`.
>     - For now, just log the patient's name and ID to the console.
>     - Return a standard HTTP 200 JSON success response.
> 2.  **A Trigger Script**:
>     - Create a script that makes a POST request to the WAH4H system to request data.
>     - Target URL: `http://localhost:8000/api/patients/trigger-data/`
>     - Payload:
>       ```json
>       {
>         "callback_url": "http://<MY_LOCAL_IP>:5000/webhook/receive-patient",
>         "patient_ids": []
>       }
>       ```
>     - (Note: The callback_url must be reachable by the WAH4H server).
>
> Please provide the code for both the Listener and the Trigger script.
