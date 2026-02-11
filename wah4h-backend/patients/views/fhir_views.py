from django.views import View
from django.http import JsonResponse

class FHIRRequestView(View):
    def post(self, request):
        import json
        from patients.middleware.transaction_middleware import get_transaction_id
        from patients.services.fhir_service import FHIRService
        patient_data = json.loads(request.body)
        transaction_id = get_transaction_id()
        response = FHIRService(api_key='dummy-key').send_outbound_request(patient_data, transaction_id)
        return JsonResponse(response)

class WebhookView(View):
    def post(self, request):
        from patients.services.webhook_service import WebhookService
        response = WebhookService(gateway_secret='dummy-secret').process_webhook(request)
        return JsonResponse(response)
