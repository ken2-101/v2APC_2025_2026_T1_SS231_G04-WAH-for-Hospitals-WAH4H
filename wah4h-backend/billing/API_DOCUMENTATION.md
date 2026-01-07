# Billing Module API Documentation

## Base URL
```
/api/billing/
```

## Models Overview

### BillingRecord
Main billing record for a patient admission containing all charges, discounts, and related items.

### MedicineItem
Individual medicine entries associated with a billing record.

### DiagnosticItem
Individual diagnostic/laboratory test entries associated with a billing record.

### Payment
Payment transactions made against a billing record.

---

## API Endpoints

### Billing Records

#### 1. List All Billing Records
```
GET /api/billing/billing-records/
```

**Response:**
```json
[
  {
    "id": 1,
    "patient": 1,
    "admission": 1,
    "patient_name": "Maria Santos",
    "hospital_id": "A00001",
    "admission_date": "2024-05-28",
    "discharge_date": "2024-06-10",
    "room_ward": "202B",
    "room_type": "Private",
    "number_of_days": 13,
    "rate_per_day": "2500.00",
    "attending_physician_fee": "5000.00",
    "specialist_fee": "3000.00",
    "surgeon_fee": "0.00",
    "other_professional_fees": "1000.00",
    "diet_type": "Regular",
    "meals_per_day": 3,
    "diet_duration": 13,
    "cost_per_meal": "150.00",
    "supplies_charge": "2000.00",
    "procedure_charge": "5000.00",
    "nursing_charge": "3000.00",
    "miscellaneous_charge": "1000.00",
    "discount": "5000.00",
    "philhealth_coverage": "10000.00",
    "is_senior": true,
    "is_pwd": false,
    "is_philhealth_member": true,
    "is_finalized": false,
    "finalized_date": null,
    "medicines": [
      {
        "id": 1,
        "name": "Paracetamol",
        "dosage": "500mg",
        "quantity": 20,
        "unit_price": "5.00",
        "total_cost": "100.00"
      }
    ],
    "diagnostics": [
      {
        "id": 1,
        "name": "CBC",
        "cost": "500.00"
      }
    ],
    "payments": [
      {
        "id": 1,
        "billing_record": 1,
        "amount": "10000.00",
        "payment_method": "Cash",
        "or_number": "OR-2024-001",
        "cashier": "John Doe",
        "payment_date": "2024-06-10",
        "created_at": "2024-06-10T10:30:00Z"
      }
    ],
    "total_room_charge": "32500.00",
    "total_professional_fees": "9000.00",
    "total_dietary_charge": "5850.00",
    "subtotal": "55950.00",
    "total_amount": "40950.00",
    "running_balance": "30950.00",
    "payment_status": "Partial",
    "created_at": "2024-06-10T09:00:00Z",
    "updated_at": "2024-06-10T10:30:00Z"
  }
]
```

#### 2. Get Billing Dashboard Data
```
GET /api/billing/billing-records/dashboard/
```

**Query Parameters:**
- `status` (optional): Filter by payment status (`pending`, `partial`, `paid`)

**Response:**
```json
[
  {
    "id": 1,
    "patient_name": "Maria Santos",
    "encounter_id": "A00001",
    "running_balance": "30950.00",
    "payment_status": "Partial",
    "last_or_date": "2024-06-10",
    "room": "202B"
  }
]
```

#### 3. Create Billing Record
```
POST /api/billing/billing-records/
```

**Request Body:**
```json
{
  "patient": 1,
  "admission": 1,
  "patient_name": "Maria Santos",
  "hospital_id": "A00001",
  "admission_date": "2024-05-28",
  "discharge_date": "2024-06-10",
  "room_ward": "202B",
  "room_type": "Private",
  "number_of_days": 13,
  "rate_per_day": "2500.00",
  "attending_physician_fee": "5000.00",
  "specialist_fee": "3000.00",
  "surgeon_fee": "0.00",
  "other_professional_fees": "1000.00",
  "diet_type": "Regular",
  "meals_per_day": 3,
  "diet_duration": 13,
  "cost_per_meal": "150.00",
  "supplies_charge": "2000.00",
  "procedure_charge": "5000.00",
  "nursing_charge": "3000.00",
  "miscellaneous_charge": "1000.00",
  "discount": "5000.00",
  "philhealth_coverage": "10000.00",
  "is_senior": true,
  "is_pwd": false,
  "is_philhealth_member": true,
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "quantity": 20,
      "unit_price": "5.00"
    }
  ],
  "diagnostics": [
    {
      "name": "CBC",
      "cost": "500.00"
    }
  ]
}
```

#### 4. Get Single Billing Record
```
GET /api/billing/billing-records/{id}/
```

#### 5. Update Billing Record
```
PUT /api/billing/billing-records/{id}/
PATCH /api/billing/billing-records/{id}/
```

**Request Body:** (Same as Create, can be partial for PATCH)

#### 6. Delete Billing Record
```
DELETE /api/billing/billing-records/{id}/
```

#### 7. Finalize Billing Record
```
POST /api/billing/billing-records/{id}/finalize/
```

**Response:**
```json
{
  "id": 1,
  "is_finalized": true,
  "finalized_date": "2024-06-10T11:00:00Z",
  ...
}
```

#### 8. Add Payment to Billing Record
```
POST /api/billing/billing-records/{id}/add_payment/
```

**Request Body:**
```json
{
  "amount": "10000.00",
  "payment_method": "Cash",
  "or_number": "OR-2024-001",
  "cashier": "John Doe",
  "payment_date": "2024-06-10"
}
```

**Response:** Returns updated billing record with new payment

**Validation:**
- OR Number must be unique
- Payment amount cannot exceed running balance

#### 9. Get Payments for Billing Record
```
GET /api/billing/billing-records/{id}/payments/
```

**Response:**
```json
[
  {
    "id": 1,
    "billing_record": 1,
    "amount": "10000.00",
    "payment_method": "Cash",
    "or_number": "OR-2024-001",
    "cashier": "John Doe",
    "payment_date": "2024-06-10",
    "created_at": "2024-06-10T10:30:00Z"
  }
]
```

#### 10. Get Billing Records by Patient
```
GET /api/billing/billing-records/by_patient/?patient_id={patient_id}
```

#### 11. Get Billing Records by Admission
```
GET /api/billing/billing-records/by_admission/?admission_id={admission_id}
```

---

### Medicine Items

#### List/Create/Update/Delete Medicine Items
```
GET    /api/billing/medicines/
POST   /api/billing/medicines/
GET    /api/billing/medicines/{id}/
PUT    /api/billing/medicines/{id}/
PATCH  /api/billing/medicines/{id}/
DELETE /api/billing/medicines/{id}/
```

**Medicine Item Schema:**
```json
{
  "id": 1,
  "name": "Paracetamol",
  "dosage": "500mg",
  "quantity": 20,
  "unit_price": "5.00",
  "total_cost": "100.00"
}
```

---

### Diagnostic Items

#### List/Create/Update/Delete Diagnostic Items
```
GET    /api/billing/diagnostics/
POST   /api/billing/diagnostics/
GET    /api/billing/diagnostics/{id}/
PUT    /api/billing/diagnostics/{id}/
PATCH  /api/billing/diagnostics/{id}/
DELETE /api/billing/diagnostics/{id}/
```

**Diagnostic Item Schema:**
```json
{
  "id": 1,
  "name": "Complete Blood Count",
  "cost": "500.00"
}
```

---

### Payments

#### List All Payments
```
GET /api/billing/payments/
```

#### Get Payments by Billing Record
```
GET /api/billing/payments/by_billing_record/?billing_record_id={billing_record_id}
```

#### Get Single Payment
```
GET /api/billing/payments/{id}/
```

**Payment Schema:**
```json
{
  "id": 1,
  "billing_record": 1,
  "amount": "10000.00",
  "payment_method": "Cash",
  "or_number": "OR-2024-001",
  "cashier": "John Doe",
  "payment_date": "2024-06-10",
  "created_at": "2024-06-10T10:30:00Z"
}
```

**Payment Methods:**
- Cash
- Credit Card
- Debit Card
- Bank Transfer
- Check
- PhilHealth
- HMO

---

## Calculated Fields

The following fields are automatically calculated by the backend:

- **total_room_charge**: `number_of_days * rate_per_day`
- **total_professional_fees**: Sum of all professional fees
- **total_dietary_charge**: `meals_per_day * diet_duration * cost_per_meal`
- **subtotal**: Sum of all charges before discounts
- **total_amount**: `subtotal - discount - philhealth_coverage`
- **running_balance**: `total_amount - sum(payments)`
- **payment_status**: 
  - `Paid` if running_balance <= 0
  - `Partial` if 0 < running_balance < total_amount
  - `Pending` if running_balance == total_amount

---

## Integration Notes

### Creating a New Billing Record

1. Gather all billing information from the frontend form
2. Include nested `medicines` and `diagnostics` arrays in the POST request
3. The backend will automatically create related items
4. Calculated fields will be returned in the response

### Updating a Billing Record

1. Send PUT/PATCH request with updated data
2. Include complete `medicines` and `diagnostics` arrays if updating them
3. The backend will replace existing items with new ones
4. Omit `medicines`/`diagnostics` to keep existing items unchanged

### Processing Payments

1. Use the `add_payment` endpoint instead of creating payments directly
2. The endpoint validates OR number uniqueness and payment amount
3. Returns updated billing record with new running balance

### Finalizing Bills

1. Once finalized, billing records should not be edited in the frontend
2. Use the `finalize` endpoint to mark a bill as final
3. Check `is_finalized` flag before allowing edits

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 404: Not Found
- 500: Internal Server Error

---

## Frontend Integration Checklist

- [ ] Update API base URL to point to Django backend
- [ ] Implement API calls for billing dashboard
- [ ] Implement CRUD operations for billing records
- [ ] Handle nested medicines and diagnostics in forms
- [ ] Implement payment processing flow
- [ ] Handle finalization logic
- [ ] Display calculated fields (read-only)
- [ ] Add error handling for API calls
- [ ] Test with real backend data
