#!/usr/bin/env python
"""
WAH4PC Integration Readiness Test
==================================
Tests all prerequisites and connectivity for WAH4PC gateway integration.

Usage:
    python test_wah4pc_ready.py
"""

import os
import sys
import django
import requests
from typing import Dict, List, Tuple

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from django.test import Client
from patients.models import Patient

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_header(text: str):
    """Print a section header."""
    print(f"\n{BLUE}{'=' * 70}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'=' * 70}{RESET}\n")


def print_test(name: str, passed: bool, message: str = ""):
    """Print test result."""
    status = f"{GREEN}[PASS]{RESET}" if passed else f"{RED}[FAIL]{RESET}"
    print(f"{status} {name}")
    if message:
        print(f"      {message}")


def test_environment_variables() -> Tuple[bool, List[str]]:
    """Test if all required environment variables are set."""
    print_header("1. Environment Variables")

    required_vars = [
        'WAH4PC_API_KEY',
        'WAH4PC_PROVIDER_ID',
        'GATEWAY_AUTH_KEY',
    ]

    optional_vars = [
        'PUBLIC_BASE_URL',
    ]

    all_passed = True
    missing_vars = []

    for var in required_vars:
        value = os.getenv(var)
        if value and value not in ['your-api-key', 'your-provider-uuid', 'your-gateway-auth-key']:
            print_test(f"Environment variable: {var}", True, f"Set")
        else:
            print_test(f"Environment variable: {var}", False, f"Missing or not configured")
            all_passed = False
            missing_vars.append(var)

    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print_test(f"Optional variable: {var}", True, f"Set to: {value}")
        else:
            print_test(f"Optional variable: {var}", True, f"{YELLOW}Not set (optional for local testing){RESET}")

    return all_passed, missing_vars


def test_gateway_connectivity() -> bool:
    """Test connectivity to WAH4PC gateway."""
    print_header("2. Gateway Connectivity")

    gateway_url = os.getenv('WAH4PC_GATEWAY_URL', 'https://wah4pc.echosphere.cfd')

    try:
        # Test public providers endpoint (no auth required)
        response = requests.get(f"{gateway_url}/api/v1/providers", timeout=10)

        if response.status_code == 200:
            data = response.json()
            providers = data.get('data', data) if isinstance(data, dict) else data
            count = len(providers) if isinstance(providers, list) else 0
            print_test("Gateway reachable", True, f"Found {count} active providers")
            return True
        else:
            print_test("Gateway reachable", False, f"HTTP {response.status_code}")
            return False

    except requests.RequestException as e:
        print_test("Gateway reachable", False, f"Connection error: {str(e)}")
        return False


def test_database_connectivity() -> bool:
    """Test database connection and patient data."""
    print_header("3. Database & Patient Data")

    try:
        # Test database connection
        patient_count = Patient.objects.count()
        print_test("Database connection", True, f"Found {patient_count} patients")

        # Test active patients
        active_count = Patient.objects.filter(status='active').count()
        print_test("Active patients", active_count > 0,
                  f"{active_count} active patients" if active_count > 0 else "No active patients found")

        # Test patients with PhilHealth ID
        philhealth_count = Patient.objects.filter(philhealth_id__isnull=False).exclude(philhealth_id='').count()
        print_test("Patients with PhilHealth ID", philhealth_count > 0,
                  f"{philhealth_count} patients have PhilHealth ID" if philhealth_count > 0 else
                  f"{YELLOW}No patients with PhilHealth ID (queries will fail){RESET}")

        return True

    except Exception as e:
        print_test("Database connection", False, str(e))
        return False


def test_webhook_endpoints() -> bool:
    """Test webhook endpoint accessibility."""
    print_header("4. Webhook Endpoints")

    client = Client()
    all_passed = True

    endpoints = [
        ('POST', '/fhir/process-query', 'Process Query Webhook'),
        ('POST', '/fhir/receive-results', 'Receive Results Webhook'),
        ('POST', '/fhir/receive-push', 'Receive Push Webhook'),
    ]

    for method, path, name in endpoints:
        try:
            if method == 'POST':
                response = client.post(path, content_type='application/json')
            else:
                response = client.get(path)

            # Expecting 401 (unauthorized) or 400 (bad request), not 404
            if response.status_code in [401, 400]:
                print_test(f"{name} ({path})", True, f"Endpoint accessible (returns {response.status_code})")
            elif response.status_code == 404:
                print_test(f"{name} ({path})", False, "Endpoint not found (404)")
                all_passed = False
            else:
                print_test(f"{name} ({path})", True, f"Endpoint responds ({response.status_code})")

        except Exception as e:
            print_test(f"{name} ({path})", False, str(e))
            all_passed = False

    return all_passed


def test_api_endpoints() -> bool:
    """Test API endpoints for fetching and listing."""
    print_header("5. API Endpoints")

    client = Client()
    all_passed = True

    endpoints = [
        ('GET', '/api/patients/', 'List Patients'),
        ('GET', '/api/patients/wah4pc/providers/', 'List Providers'),
        ('GET', '/api/patients/wah4pc/transactions/', 'List Transactions'),
    ]

    for method, path, name in endpoints:
        try:
            response = client.get(path)

            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else 'N/A'
                print_test(f"{name} ({path})", True, f"Returns {count} items")
            else:
                print_test(f"{name} ({path})", False, f"HTTP {response.status_code}")
                all_passed = False

        except Exception as e:
            print_test(f"{name} ({path})", False, str(e))
            all_passed = False

    return all_passed


def test_fhir_conversion() -> bool:
    """Test FHIR conversion functions."""
    print_header("6. FHIR Conversion")

    try:
        from patients.wah4pc import patient_to_fhir, fhir_to_dict

        # Test with a sample patient
        patient = Patient.objects.filter(status='active').first()

        if not patient:
            print_test("FHIR patient_to_fhir", False, "No active patient found for testing")
            return False

        # Test patient_to_fhir
        try:
            fhir_data = patient_to_fhir(patient)
            has_resource_type = fhir_data.get('resourceType') == 'Patient'
            has_name = bool(fhir_data.get('name'))

            print_test("patient_to_fhir conversion", has_resource_type and has_name,
                      f"Converted patient {patient.id} to FHIR format")
        except Exception as e:
            print_test("patient_to_fhir conversion", False, str(e))
            return False

        # Test fhir_to_dict
        try:
            dict_data = fhir_to_dict(fhir_data)
            has_first_name = bool(dict_data.get('first_name'))
            has_last_name = bool(dict_data.get('last_name'))

            print_test("fhir_to_dict conversion", has_first_name or has_last_name,
                      "Converted FHIR back to dict format")
        except Exception as e:
            print_test("fhir_to_dict conversion", False, str(e))
            return False

        return True

    except Exception as e:
        print_test("FHIR module import", False, str(e))
        return False


def main():
    """Run all tests."""
    print(f"\n{BLUE}{'=' * 70}{RESET}")
    print(f"{BLUE}WAH4PC Integration Readiness Test{RESET}")
    print(f"{BLUE}{'=' * 70}{RESET}")

    results = {}

    # Run all tests
    results['env_vars'], missing_vars = test_environment_variables()
    results['gateway'] = test_gateway_connectivity()
    results['database'] = test_database_connectivity()
    results['webhooks'] = test_webhook_endpoints()
    results['api'] = test_api_endpoints()
    results['fhir'] = test_fhir_conversion()

    # Summary
    print_header("Summary")

    all_passed = all(results.values())
    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)

    print(f"Tests Passed: {passed_count}/{total_count}\n")

    if all_passed:
        print(f"{GREEN}✓ All tests passed! Your system is ready for WAH4PC integration.{RESET}\n")
        print("Next steps:")
        print("1. Register your provider with the gateway administrator")
        print("2. Update your .env file with actual credentials")
        print("3. Set up ngrok or deploy to a public URL with HTTPS")
        print("4. Test end-to-end with a partner provider")
        return 0
    else:
        print(f"{RED}✗ Some tests failed. Please fix the issues above.{RESET}\n")

        if not results['env_vars'] and missing_vars:
            print(f"{YELLOW}Missing environment variables:{RESET}")
            for var in missing_vars:
                print(f"  - {var}")
            print("\nCopy .env.example to .env and fill in your values.\n")

        return 1


if __name__ == '__main__':
    sys.exit(main())
