from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Admission
from .serializers import AdmissionSerializer

@api_view(['GET', 'POST'])
def admission_list(request):
    if request.method == 'GET':
        admissions = Admission.objects.all().order_by('-admission_date')
        serializer = AdmissionSerializer(admissions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = AdmissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def admission_detail(request, pk):
    try:
        admission = Admission.objects.get(pk=pk)
    except Admission.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = AdmissionSerializer(admission)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = AdmissionSerializer(admission, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        admission.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
