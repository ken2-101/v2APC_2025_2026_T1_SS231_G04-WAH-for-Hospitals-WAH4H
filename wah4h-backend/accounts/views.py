"""
accounts/views.py

State Machine for 2-Step OTP Authentication.
Follows "Thin Views" pattern - delegates logic to Serializers.

Architecture:
- Uses APIView (class-based views)
- Standard JSON envelope for all responses
- django.core.mail for OTP delivery (Console Backend)
- django.core.cache (LocMemCache) for OTP storage

Response Format:
{
    "status": "success" | "error",
    "message": "Human-readable message",
    "data": { ... }
}
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.core.cache import cache
from django.conf import settings
import json
from datetime import date

from .serializers import (
    PractitionerSignupSerializer,
    VerifyAccountSerializer,
    LoginStepOneSerializer,
    LoginStepTwoSerializer,
    PasswordResetInitiateSerializer,
    PasswordResetConfirmSerializer,
    generate_otp
)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_jwt_tokens(user):
    """Generate JWT access and refresh tokens for user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh)
    }


def send_otp_email(email, otp, purpose='verification'):
    """
    Send OTP via email (Console Backend for development).
    
    Args:
        email: Recipient email
        otp: 6-digit OTP code
        purpose: 'verification', 'login', or 'reset'
    """
    subject_map = {
        'verification': 'WAH4H - Verify Your Account',
        'login': 'WAH4H - Login Verification Code',
        'reset': 'WAH4H - Password Reset Code'
    }
    
    message = f"""
    Your WAH4H verification code is: {otp}
    
    This code will expire in 5 minutes.
    
    If you did not request this code, please ignore this email.
    
    ---
    WAH4H - Wireless Access for Health
    Philippine LGU Hospital Management System
    """
    
    send_mail(
        subject=subject_map.get(purpose, 'WAH4H - Verification Code'),
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False
    )


def success_response(message, data=None, http_status=status.HTTP_200_OK):
    """Standard success response envelope."""
    return Response({
        'status': 'success',
        'message': message,
        'data': data or {}
    }, status=http_status)


def error_response(message, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    """Standard error response envelope."""
    return Response({
        'status': 'error',
        'message': message,
        'errors': errors or {}
    }, status=http_status)


# ============================================================================
# REGISTRATION FLOW
# ============================================================================

class RegisterInitiateAPIView(APIView):
    """
    POST /api/accounts/register/initiate/
    
    Step 1: Validate Data + Cache + Send OTP (NO DB WRITES).
    
    Cache-First Strategy:
    - Validates registration data (no database writes)
    - Generates OTP
    - Caches validated_data + OTP for 5 minutes
    - Sends OTP via email
    
    Request Body:
    {
        "identifier": "PRC-12345",
        "first_name": "Juan",
        "last_name": "Dela Cruz",
        "email": "juan@example.com",
        "password": "SecurePass123",
        "confirm_password": "SecurePass123",
        "role": "doctor"
    }
    
    Response:
    {
        "status": "success",
        "message": "Registration initiated. Please check your email for OTP.",
        "data": {
            "email": "juan@example.com",
            "otp_sent": true
        }
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PractitionerSignupSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            
            # Generate OTP
            otp = generate_otp()
            
            # Prepare data for caching (handle date serialization)
            cache_data = serializer.validated_data.copy()
            
            # Convert date to string for JSON serialization
            if cache_data.get('birth_date'):
                cache_data['birth_date'] = cache_data['birth_date'].isoformat()
            
            # Add OTP to cached data
            cache_data['otp'] = otp
            
            # Cache the registration data with OTP (5 minutes)
            cache_key = f"registration_{cache_data['email']}"
            cache.set(cache_key, cache_data, timeout=300)
            
            # Send OTP via email
            send_otp_email(cache_data['email'], otp, purpose='verification')
            
            return success_response(
                message='Registration initiated. Please check your email for the verification code.',
                data={
                    'email': cache_data['email'],
                    'otp_sent': True,
                    'expires_in': '5 minutes'
                },
                http_status=status.HTTP_200_OK
            )
        
        except Exception as e:
            return error_response(
                message='Registration failed.',
                errors=serializer.errors if hasattr(serializer, 'errors') else {'detail': str(e)},
                http_status=status.HTTP_400_BAD_REQUEST
            )


class RegisterVerifyAPIView(APIView):
    """
    POST /api/accounts/register/verify/
    
    Step 2: Verify OTP + Create Account from Cache (Cache-First Strategy).
    
    - Retrieves cached registration data
    - Validates OTP
    - Creates Practitioner + User records (both ACTIVE)
    - Deletes cache after successful creation
    
    Request Body:
    {
        "email": "juan@example.com",
        "otp": "123456"
    }
    
    Response:
    {
        "status": "success",
        "message": "Account created successfully. You can now login.",
        "data": {
            "email": "juan@example.com",
            "is_active": true
        }
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            email = request.data.get('email')
            otp = request.data.get('otp')
            
            # Validate input
            if not email or not otp:
                return error_response(
                    message='Email and OTP are required.',
                    errors={'detail': 'Missing required fields'}
                )
            
            # Retrieve cached registration data
            cache_key = f"registration_{email}"
            cached_data = cache.get(cache_key)
            
            if not cached_data:
                return error_response(
                    message='Registration expired or not found. Please start registration again.',
                    errors={'detail': 'No registration data found for this email'},
                    http_status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate OTP
            cached_otp = cached_data.get('otp')
            if not cached_otp or cached_otp != otp:
                return error_response(
                    message='Invalid OTP.',
                    errors={'otp': 'The OTP you entered is incorrect'},
                    http_status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert birth_date back from string to date object if present
            if cached_data.get('birth_date') and isinstance(cached_data['birth_date'], str):
                from datetime import datetime
                cached_data['birth_date'] = datetime.fromisoformat(cached_data['birth_date']).date()
            
            # Remove OTP from cached data before creating account
            cached_data.pop('otp', None)
            cached_data.pop('confirm_password', None)  # Remove confirm_password too
            
            # Create account using VerifyAccountSerializer
            serializer = VerifyAccountSerializer()
            user = serializer.create_account(cached_data)
            
            # Delete cache after successful creation (prevent replay)
            cache.delete(cache_key)
            
            return success_response(
                message='Account created successfully. You can now login.',
                data={
                    'email': user.email,
                    'username': user.username,
                    'is_active': user.is_active
                },
                http_status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return error_response(
                message='Account creation failed.',
                errors={'detail': str(e)},
                http_status=status.HTTP_400_BAD_REQUEST
            )


# ============================================================================
# LOGIN FLOW
# ============================================================================

class LoginInitiateAPIView(APIView):
    """
    POST /api/accounts/login/initiate/
    
    Step 1: Validate Credentials + Send OTP.
    
    Request Body:
    {
        "email": "juan@example.com",
        "password": "SecurePass123"
    }
    
    Response:
    {
        "status": "success",
        "message": "Credentials verified. OTP sent to your email.",
        "data": {
            "email": "juan@example.com",
            "otp_sent": true
        }
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginStepOneSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Send OTP via email
            send_otp_email(user.email, user.otp, purpose='login')
            
            return success_response(
                message='Credentials verified. Please check your email for the login code.',
                data={
                    'email': user.email,
                    'otp_sent': True,
                    'expires_in': '5 minutes'
                }
            )
        
        except Exception as e:
            # Check if it's a lockout error
            if 'locked' in str(e).lower():
                return error_response(
                    message='Account temporarily locked.',
                    errors=serializer.errors if hasattr(serializer, 'errors') else {'detail': str(e)},
                    http_status=status.HTTP_403_FORBIDDEN
                )
            
            return error_response(
                message='Login failed.',
                errors=serializer.errors if hasattr(serializer, 'errors') else {'detail': str(e)},
                http_status=status.HTTP_401_UNAUTHORIZED
            )


class LoginVerifyAPIView(APIView):
    """
    POST /api/accounts/login/verify/
    
    Step 2: Verify OTP + Return JWT Tokens.
    
    Request Body:
    {
        "email": "juan@example.com",
        "otp": "123456"
    }
    
    Response:
    {
        "status": "success",
        "message": "Login successful.",
        "data": {
            "user": {
                "id": 1,
                "username": "juan",
                "email": "juan@example.com",
                "first_name": "Juan",
                "last_name": "Dela Cruz",
                "role": "doctor"
            },
            "tokens": {
                "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
            }
        }
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginStepTwoSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Generate JWT tokens
            tokens = get_jwt_tokens(user)
            
            return success_response(
                message='Login successful.',
                data={
                    'user': {
                        'id': user.practitioner.practitioner_id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role
                    },
                    'tokens': tokens
                }
            )
        
        except Exception as e:
            return error_response(
                message='OTP verification failed.',
                errors=serializer.errors if hasattr(serializer, 'errors') else {'detail': str(e)},
                http_status=status.HTTP_401_UNAUTHORIZED
            )


# ============================================================================
# PASSWORD RESET FLOW
# ============================================================================

class PasswordResetInitiateAPIView(APIView):
    """
    POST /api/accounts/password-reset/initiate/
    
    Step 1: Validate Email + Send OTP.
    
    Request Body:
    {
        "email": "juan@example.com"
    }
    
    Response:
    {
        "status": "success",
        "message": "Password reset code sent to your email.",
        "data": {
            "email": "juan@example.com",
            "otp_sent": true
        }
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetInitiateSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Send OTP via email
            send_otp_email(user.email, user.otp, purpose='reset')
            
            return success_response(
                message='Password reset code sent to your email.',
                data={
                    'email': user.email,
                    'otp_sent': True,
                    'expires_in': '5 minutes'
                }
            )
        
        except Exception as e:
            return error_response(
                message='Password reset request failed.',
                errors=serializer.errors if hasattr(serializer, 'errors') else {'detail': str(e)}
            )


class PasswordResetConfirmAPIView(APIView):
    """
    POST /api/accounts/password-reset/confirm/
    
    Step 2: Verify OTP + Set New Password.
    
    Request Body:
    {
        "email": "juan@example.com",
        "otp": "123456",
        "new_password": "NewSecurePass123",
        "confirm_password": "NewSecurePass123"
    }
    
    Response:
    {
        "status": "success",
        "message": "Password reset successful. You can now login with your new password.",
        "data": {
            "email": "juan@example.com",
            "password_changed": true
        }
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            return success_response(
                message='Password reset successful. You can now login with your new password.',
                data={
                    'email': user.email,
                    'password_changed': True
                }
            )
        
        except Exception as e:
            return error_response(
                message='Password reset confirmation failed.',
                errors=serializer.errors if hasattr(serializer, 'errors') else {'detail': str(e)}
            )
