from django.http import JsonResponse

def get_patients(request):
    return JsonResponse({"message": "Patient API working!"})
