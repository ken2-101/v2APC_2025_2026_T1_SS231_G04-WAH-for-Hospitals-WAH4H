from django.db import models
from patients.models import Patient

class Admission(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Discharged", "Discharged"),
        ("Transferred", "Transferred"),
    ]

    CATEGORY_CHOICES = [
        ("Regular", "Regular"),
        ("Emergency", "Emergency"),
    ]

    MODE_CHOICES = [
        ("Walk-in", "Walk-in"),
        ("Ambulance", "Ambulance"),
        ("Referral", "Referral"),
    ]

    admission_id = models.CharField(
        max_length=10,
        unique=True,
        editable=False,   # 🔒 frontend & admin cannot edit
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="admissions"
    )

    admission_date = models.DateTimeField()
    encounter_type = models.CharField(max_length=50, default="Inpatient")
    admitting_diagnosis = models.CharField(max_length=255)
    reason_for_admission = models.TextField()

    ward = models.CharField(max_length=50)
    room = models.CharField(max_length=20)
    bed = models.CharField(max_length=10)

    attending_physician = models.CharField(max_length=100)
    assigned_nurse = models.CharField(max_length=100, blank=True)

    admission_category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="Regular"
    )

    mode_of_arrival = models.CharField(
        max_length=20,
        choices=MODE_CHOICES,
        default="Walk-in"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Active"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.admission_id:
            last_admission = Admission.objects.order_by("-id").first()

            if last_admission and last_admission.admission_id:
                last_number = int(last_admission.admission_id[1:])
                new_number = last_number + 1
            else:
                new_number = 1

            self.admission_id = f"A{new_number:03d}"  # A001, A002, ...

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.admission_id} - {self.patient}"
