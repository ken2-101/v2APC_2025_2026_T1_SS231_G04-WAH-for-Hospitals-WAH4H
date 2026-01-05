# Billing Module

## Overview
The Billing Module manages hospital billing records, including room charges, professional fees, medicines, diagnostics, and payments for patient admissions.

## Features

### Core Functionality
- ✅ Create and manage billing records for patient admissions
- ✅ Track room charges with daily rates
- ✅ Manage professional fees (attending physician, specialist, surgeon, etc.)
- ✅ Add medicine items with dosage, quantity, and unit price
- ✅ Add diagnostic/laboratory items with costs
- ✅ Track dietary charges
- ✅ Apply discounts for senior citizens and PWDs
- ✅ Track PhilHealth coverage
- ✅ Process payments with multiple payment methods
- ✅ Automatic calculation of totals and running balances
- ✅ Payment status tracking (Pending, Partial, Paid)
- ✅ Bill finalization to prevent further edits

## Models

### BillingRecord
Main model containing all billing information for a patient admission.

**Key Fields:**
- Patient information (name, hospital ID, admission/discharge dates, room)
- Room charges (type, number of days, rate per day)
- Professional fees (physician, specialist, surgeon, others)
- Dietary charges (diet type, meals per day, duration, cost per meal)
- Other charges (supplies, procedures, nursing, miscellaneous)
- Discounts and coverage (senior, PWD, PhilHealth)
- Status (finalized flag and date)

**Computed Properties:**
- `total_room_charge`: Automatically calculated from days × rate
- `total_professional_fees`: Sum of all professional fees
- `total_dietary_charge`: Calculated from meals × duration × cost
- `subtotal`: Sum of all charges before discounts
- `total_amount`: Subtotal minus discounts and coverage
- `running_balance`: Total amount minus payments received
- `payment_status`: Dynamic status based on payments (Pending/Partial/Paid)

### MedicineItem
Individual medicine entries linked to a billing record.

**Fields:**
- name, dosage, quantity, unit_price
- `total_cost` (computed): quantity × unit_price

### DiagnosticItem
Individual diagnostic/laboratory test entries.

**Fields:**
- name, cost

### Payment
Payment transactions against a billing record.

**Fields:**
- amount, payment_method, or_number (unique), cashier, payment_date

**Payment Methods:**
- Cash
- Credit Card
- Debit Card
- Bank Transfer
- Check
- PhilHealth
- HMO

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

**Main Endpoints:**
- `GET /api/billing/billing-records/` - List all billing records
- `POST /api/billing/billing-records/` - Create new billing record
- `GET /api/billing/billing-records/{id}/` - Get specific billing record
- `PUT/PATCH /api/billing/billing-records/{id}/` - Update billing record
- `DELETE /api/billing/billing-records/{id}/` - Delete billing record
- `GET /api/billing/billing-records/dashboard/` - Get dashboard data
- `POST /api/billing/billing-records/{id}/finalize/` - Finalize a bill
- `POST /api/billing/billing-records/{id}/add_payment/` - Add payment

## Setup Instructions

### 1. Install Dependencies
The billing module uses Django REST Framework which should already be installed in your project.

### 2. Add to INSTALLED_APPS
The billing app is already added to `settings.py`:
```python
INSTALLED_APPS = [
    ...
    'billing',
    ...
]
```

### 3. Add URL Configuration
The billing URLs are already configured in `wah4h/urls.py`:
```python
path('api/billing/', include('billing.urls')),
```

### 4. Run Migrations
```bash
python manage.py makemigrations billing
python manage.py migrate billing
```

### 5. Create Superuser (if needed)
```bash
python manage.py createsuperuser
```

### 6. Access Admin Panel
Navigate to `/admin/` and log in to manage billing records through the Django admin interface.

## Usage Examples

### Creating a Billing Record via API

```bash
curl -X POST http://localhost:8000/api/billing/billing-records/ \
  -H "Content-Type: application/json" \
  -d '{
    "patient": 1,
    "patient_name": "Juan Dela Cruz",
    "hospital_id": "A00001",
    "admission_date": "2024-01-01",
    "discharge_date": "2024-01-10",
    "room_ward": "101A",
    "room_type": "Private",
    "number_of_days": 9,
    "rate_per_day": "2000.00",
    "attending_physician_fee": "5000.00",
    "medicines": [
      {
        "name": "Paracetamol",
        "dosage": "500mg",
        "quantity": 10,
        "unit_price": "5.00"
      }
    ],
    "diagnostics": [
      {
        "name": "Complete Blood Count",
        "cost": "500.00"
      }
    ]
  }'
```

### Adding a Payment

```bash
curl -X POST http://localhost:8000/api/billing/billing-records/1/add_payment/ \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10000.00",
    "payment_method": "Cash",
    "or_number": "OR-2024-001",
    "cashier": "Jane Smith",
    "payment_date": "2024-01-10"
  }'
```

### Getting Dashboard Data

```bash
curl http://localhost:8000/api/billing/billing-records/dashboard/
```

### Filtering by Payment Status

```bash
curl http://localhost:8000/api/billing/billing-records/dashboard/?status=pending
```

## Admin Interface

The Django admin interface provides a comprehensive view of billing records:

- **List View**: Shows key information and computed totals
- **Detail View**: Organized into logical sections with inline editors for medicines, diagnostics, and payments
- **Filters**: By finalization status, discount flags, and admission date
- **Search**: By patient name and hospital ID
- **Read-only Fields**: Computed totals are displayed but not editable

### Admin Features
- Inline editing of medicines and diagnostics
- View payment history (read-only)
- See calculated totals in real-time
- Collapsible sections for better organization

## Testing

Run the test suite:

```bash
python manage.py test billing
```

**Test Coverage:**
- Model property calculations
- Payment status determination
- API endpoint functionality
- Create/Read operations with nested items

## Integration with Frontend

The billing module is designed to work seamlessly with the React frontend in `/Frontend/wah4hospitals-clinic-hub-79-main/`.

**Frontend Components:**
- `BillingDashboard.tsx` - Main dashboard view
- `Billing.tsx` - Billing form and management page
- `PaymentModal.tsx` - Payment processing modal
- `PatientBillPrint.tsx` - Print-ready bill view

**Integration Steps:**
1. Update frontend API base URL to point to Django backend
2. Replace mock data with actual API calls
3. Handle API responses and errors
4. Test with real backend data

See frontend integration guide in `API_DOCUMENTATION.md`.

## Database Schema

```
BillingRecord
├── patient (FK → Patient)
├── admission (FK → Admission)
├── Patient Info Fields
├── Room Charge Fields
├── Professional Fee Fields
├── Dietary Charge Fields
├── Other Charge Fields
├── Discount Fields
├── Status Fields
└── Related Items:
    ├── medicines (1-to-many → MedicineItem)
    ├── diagnostics (1-to-many → DiagnosticItem)
    └── payments (1-to-many → Payment)
```

## Business Logic

### Discount Calculation
- Senior Citizen: 20% discount on room and professional fees
- PWD: 20% discount on medicines and diagnostics
- PhilHealth: Fixed coverage amount entered manually

### Payment Status Logic
- **Pending**: No payments made (running_balance == total_amount)
- **Partial**: Some payments made (0 < running_balance < total_amount)
- **Paid**: Fully paid (running_balance <= 0)

### Bill Finalization
- Once finalized, the bill should not be editable
- Frontend should check `is_finalized` flag
- Backend does not enforce this restriction (allows corrections if needed)

## Future Enhancements

Potential improvements for future versions:
- [ ] Automatic discount calculation based on patient info
- [ ] Integration with admission module for auto-population
- [ ] PDF generation for bills
- [ ] Email notification when bill is ready
- [ ] Payment installment tracking
- [ ] Insurance claims integration
- [ ] Audit trail for bill changes
- [ ] Batch billing operations
- [ ] Analytics and reporting
- [ ] Export to Excel/CSV

## Troubleshooting

### Common Issues

**Issue**: Migrations fail with foreign key error
**Solution**: Ensure patient and admission apps are migrated first

**Issue**: OR Number duplicate error
**Solution**: OR Numbers must be unique across all payments

**Issue**: Payment exceeds balance error
**Solution**: Payment amount cannot be greater than running balance

**Issue**: Calculated totals not updating
**Solution**: These are computed properties, not database fields. They calculate on-the-fly.

## Support

For issues or questions:
1. Check the API documentation
2. Review test cases for usage examples
3. Inspect Django admin for data verification
4. Check backend logs for errors

## License

Part of the WAH4H (Wellness Advanced Hospital for Hospitals) system.
