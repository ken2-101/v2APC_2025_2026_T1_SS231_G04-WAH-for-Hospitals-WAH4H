
import os
import django

# Configure Django to use the project's settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wah4h.settings")
django.setup()

from django.conf import settings
# print(f"DEBUG: Database Engine: {settings.DATABASES['default']['ENGINE']}")
# print(f"DEBUG: Database Name: {settings.DATABASES['default']['NAME']}")

from django.contrib.auth import get_user_model, authenticate
from accounts.models import Practitioner, User, Organization
from accounts.serializers import LoginSerializer

User = get_user_model()

def test_auth_flow():
    email = "test_login_user@example.com"
    password = "SecurePassword123!"

    print(f"\n--- 1. CLEANUP: Deleting existing user {email} ---")
    User.objects.filter(email=email).delete()
    
    # Also delete associated practitioner if any?
    # Since User -> OneToOne -> Practitioner, deleting User might cascade or not depending on on_delete
    # User.practitioner on_delete=models.PROTECT, so we must delete User first? 
    # Actually Practitioner is PK. User is OneToOne to Practitioner.
    # We should delete User. 
    
    print(f"\n--- 2. REGISTRATION: Creating User {email} manually via UserManager ---")
    try:
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name="Test",
            last_name="User"
        )
        print(f"SUCCESS: User created. ID: {user.pk}, Email: {user.email}, Username: {user.username}")
        print(f"User Password Hash: {user.password_hash}")
        print(f"User Active: {user.is_active}")
    except Exception as e:
        print(f"ERROR: Creation failed: {e}")
        return

    print(f"\n--- 3. AUTHENTICATION: Testing authenticate(username={email}) ---")
    user_auth = authenticate(username=email, password=password)
    
    if user_auth:
        print(f"SUCCESS: authenticate() returned user: {user_auth}")
    else:
        print("FAILURE: authenticate() returned None")
        # specific debugging already in serializer, but let's check basics here
        from django.contrib.auth.hashers import check_password
        print(f"Manual password check: {check_password(password, user.password_hash)}")


    print(f"\n--- 4. SERIALIZER: Testing LoginSerializer ---")
    data = {
        "email": email,
        "password": password
    }
    serializer = LoginSerializer(data=data)
    if serializer.is_valid():
        print("SUCCESS: LoginSerializer is valid")
        print(serializer.validated_data)
    else:
        print("FAILURE: LoginSerializer errors:")
        print(serializer.errors)

if __name__ == "__main__":
    test_auth_flow()
