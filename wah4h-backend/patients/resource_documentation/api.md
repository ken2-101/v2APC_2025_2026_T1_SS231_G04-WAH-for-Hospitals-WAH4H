"use client";

import { Server, Users, FileText, Activity, Key, Webhook } from "lucide-react";
import { DocsHeader } from "@/components/ui/docs-header";
import { AlertBlock } from "@/components/ui/alert-block";
import { JsonViewer } from "@/components/ui/json-viewer";
import { EndpointCard } from "@/components/ui/endpoint-card";
import { ErrorTable } from "@/components/ui/data-table";
import { LastUpdated } from "@/components/ui/last-updated";
import { endpoints, errorData, rateLimitingGuidelines, authenticationInfo } from "./data";
import { config } from "@/lib/config";

const iconMap = {
  Activity: <Activity className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Server: <Server className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Key: <Key className="h-5 w-5" />,
  Webhook: <Webhook className="h-5 w-5" />,
};

export default function ApiReferencePage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="API Reference"
        badgeColor="orange"
        title="API Reference"
        description="Complete documentation of all WAH4PC Gateway API endpoints. Use these endpoints to discover providers, initiate FHIR transfers, and track transactions."
      />

      {/* Base URL */}
      <section id="base-url" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Base URL</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <code className="text-base text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
            {config.gatewayUrl}
          </code>
          <p className="mt-4 text-sm text-slate-600">
            Replace with your gateway instance URL in production.
          </p>
        </div>
      </section>

      {/* Authentication Note */}
      <section id="auth" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Authentication</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-lg">API Key Required</p>
              <p className="text-slate-600 mt-2 leading-relaxed">
                {authenticationInfo.description}
              </p>
            </div>
          </div>
          
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-5 space-y-3">
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Header Format</p>
            <code className="block text-sm bg-slate-900 text-slate-100 p-3 rounded-lg font-mono border border-slate-800 shadow-sm">
              {authenticationInfo.header}: YOUR_API_KEY_HERE
            </code>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Alternative:</span>
              <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">
                {authenticationInfo.alternativeHeader}
              </code>
            </p>
          </div>

          <AlertBlock type="info" title="Getting Started">
            Contact your system administrator to obtain an API key for accessing the gateway.
          </AlertBlock>
        </div>
      </section>

      {/* Endpoints by Category */}
      <section id="endpoints" className="mb-16">
        {endpoints.map((category) => (
          <div key={category.category} className="mb-12 last:mb-0">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600 shadow-sm">
                {iconMap[category.iconName]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{category.category}</h2>
                <p className="text-sm text-slate-500 font-medium">{category.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              {category.items.map((endpoint, idx) => (
                <EndpointCard key={idx} {...endpoint} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Error Responses */}
      <section id="errors" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Error Responses</h2>
        <p className="mb-6 text-slate-600">
          All endpoints return consistent error responses in the following format:
        </p>

        <JsonViewer
          title="Standard Error Format"
          data={`{
  "error": "Error message describing what went wrong"
}`}
          className="mb-8 shadow-sm"
        />

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <ErrorTable data={errorData} />
        </div>
      </section>

      {/* Rate Limiting */}
      <section id="rate-limiting" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Rate Limiting</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <p className="text-slate-600 mb-6 leading-relaxed">
            The gateway enforces per-API-key rate limiting to ensure fair usage and system stability.
            Each API key has a configurable rate limit set during creation.
          </p>
          <ul className="space-y-3 text-sm text-slate-600">
            {rateLimitingGuidelines.map((guideline) => (
              <li key={guideline} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">i</span>
                {guideline}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <LastUpdated className="mt-12 pt-8 border-t border-slate-200" />
    </article>
  );
}

import type { EndpointCardProps } from "@/components/ui/endpoint-card";

// Import endpoint modules
import { healthEndpoints } from "./endpoints/health";
import { providersEndpoints } from "./endpoints/providers";
import { fhirEndpoints } from "./endpoints/fhir";
import { transactionsEndpoints } from "./endpoints/transactions";
import { webhookEndpoints } from "./endpoints/webhooks";

// Endpoint categories with their items
export interface EndpointCategory {
  category: string;
  iconName: "Activity" | "Users" | "Server" | "FileText" | "Webhook";
  description: string;
  items: EndpointCardProps[];
}

export const endpoints: EndpointCategory[] = [
  {
    category: "Health",
    iconName: "Activity",
    description: "System health and status (public endpoint)",
    items: healthEndpoints,
  },
  {
    category: "Providers",
    iconName: "Users",
    description: "List registered healthcare providers (public endpoint)",
    items: providersEndpoints,
  },
  {
    category: "FHIR Gateway",
    iconName: "Server",
    description: "FHIR resource transfer endpoints using standard identifiers",
    items: fhirEndpoints,
  },
  {
    category: "Transactions",
    iconName: "FileText",
    description: "View and track FHIR transfer transactions (access controlled by API key role)",
    items: transactionsEndpoints,
  },
  {
    category: "Provider Webhooks",
    iconName: "Webhook",
    description: "Endpoints you must implement to receive gateway events",
    items: webhookEndpoints,
  },
];

// Authentication information
export const authenticationInfo = {
  description: "Most endpoints require authentication via API key. Include your API key in the request header to access protected resources.",
  header: "X-API-Key",
  alternativeHeader: "Authorization: Bearer YOUR_API_KEY"
};

// Idempotency information
export const idempotencyInfo = {
  description: "For safe retries on mutating requests (POST, PUT, PATCH, DELETE), include an Idempotency-Key header. The gateway caches responses for 24 hours, preventing duplicate processing.",
  header: "Idempotency-Key",
  valueFormat: "UUID v4 (e.g., 550e8400-e29b-41d4-a716-446655440000)",
  responseHeaders: {
    replayed: "Idempotency-Replayed",
    originalDate: "Idempotency-Original-Date"
  },
  notes: [
    "Generate a unique UUID for each logical operation",
    "Reuse the same key when retrying a failed request",
    "Keys are valid for 24 hours after first use",
    "If the original request is still processing, you'll receive a 409 Conflict"
  ]
};

// Error response data
export const errorData = [
  {
    code: 400,
    meaning: "Bad Request",
    causes: "Invalid request parameters or malformed request body"
  },
  {
    code: 401,
    meaning: "Unauthorized",
    causes: "Missing or invalid API key"
  },
  {
    code: 403,
    meaning: "Forbidden",
    causes: "Valid API key but insufficient permissions for this resource"
  },
  {
    code: 404,
    meaning: "Not Found",
    causes: "The requested resource does not exist"
  },
  {
    code: 409,
    meaning: "Conflict",
    causes: "Idempotency key is currently being processed. Retry after a short delay."
  },
  {
    code: 429,
    meaning: "Too Many Requests",
    causes: "Rate limit exceeded OR duplicate request detected within 5-minute window"
  },
  {
    code: 500,
    meaning: "Internal Server Error",
    causes: "An unexpected error occurred on the server"
  },
  {
    code: 503,
    meaning: "Service Unavailable",
    causes: "The gateway or target provider system is temporarily unavailable"
  }
];

// Rate limiting guidelines
export const rateLimitingGuidelines = [
  "Rate limits are enforced per API key and configured during key creation",
  "Default limit is typically 100 requests per minute (subject to configuration)",
  "When rate limit is exceeded, the gateway returns HTTP 429 with retry-after information",
  "Implement exponential backoff in your client when receiving 429 responses",
  "Contact your administrator to increase rate limits if needed for your use case"
];

import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const fhirEndpoints: EndpointCardProps[] = [
  {
    method: "POST",
    path: "/api/v1/fhir/request/{resourceType}",
    description: "Initiate a FHIR resource request to another provider. Uses FHIR-compliant identifiers (system + value) to identify the patient across different healthcare systems.",
    pathParams: [
      {
        name: "resourceType",
        type: "string",
        description: "FHIR resource type (e.g., Patient, Observation)",
      },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
      {
        name: "Idempotency-Key",
        value: "550e8400-e29b-41d4-a716-446655440000",
        required: true,
        description: "UUID for safe retries. Required for mutating requests.",
      },
    ],
    requestBody: `{
  "requesterId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    },
    {
      "system": "http://hospital-b.com/mrn",
      "value": "MRN-12345"
    }
  ],
  "reason": "Referral consultation",
  "notes": "Need latest lab results"
}`,
    responseStatus: 202,
    responseBody: `{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "requesterId": "your-provider-uuid",
    "targetId": "target-provider-uuid",
    "identifiers": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      },
      {
        "system": "http://hospital-b.com/mrn",
        "value": "MRN-12345"
      }
    ],
    "resourceType": "Patient",
    "status": "PENDING",
    "metadata": {
      "reason": "Referral consultation",
      "notes": "Need latest lab results"
    },
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}`,
    notes: [
      "Both requesterId and targetId must be registered providers",
      "identifiers is an array of FHIR-compliant identifiers (system + value pairs)",
      "At least one identifier is required",
      "Common systems: http://philhealth.gov.ph, http://psa.gov.ph/birth-certificate, or your hospital's MRN system",
      "The gateway forwards the request to the target's /fhir/process-query endpoint",
      "Results will be delivered to your /fhir/receive-results endpoint asynchronously",
      "**Idempotency**: Use `Idempotency-Key` header for safe retries. Keys are cached for 24 hours.",
      "**Duplicate Detection**: Identical requests (same requester, target, identifiers) within 5 minutes return 429.",
      "**Response Headers**: `Idempotency-Replayed: true` and `Idempotency-Original-Date` indicate cached responses.",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/fhir/receive/{resourceType}",
    description: "Endpoint for target providers to send data back to the gateway",
    pathParams: [
      {
        name: "resourceType",
        type: "string",
        description: "FHIR resource type matching the original request",
      },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
      {
        name: "X-Provider-ID",
        value: "your-provider-uuid",
        required: false,
      },
      {
        name: "Idempotency-Key",
        value: "550e8400-e29b-41d4-a716-446655440000",
        required: true,
        description: "UUID for safe retries when sending results back.",
      },
    ],
    requestBody: `{
  "transactionId": "transaction-uuid-from-request",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Patient",
    "id": "patient-123",
    "identifier": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      }
    ],
    "name": [{ "family": "Dela Cruz", "given": ["Juan"] }],
    "birthDate": "1990-05-15",
    "gender": "male"
  }
}`,
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "message": "result received and forwarded"
  }
}`,
    notes: [
      "The transactionId must match a PENDING transaction",
      "X-Provider-ID header is optional but recommended for security validation",
      "Valid status values: SUCCESS, REJECTED, ERROR",
      "The gateway forwards the data to the requester's /fhir/receive-results endpoint",
    ],
  },
  {
    method: "POST",
    path: "/api/v1/fhir/push/{resourceType}",
    description: "Push a FHIR resource directly to another provider without a prior request. Useful for sending referrals, appointments, or unsolicited results.",
    pathParams: [
      {
        name: "resourceType",
        type: "string",
        description: "FHIR resource type (e.g., Appointment, DocumentReference)",
      },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
      {
        name: "Idempotency-Key",
        value: "550e8400-e29b-41d4-a716-446655440000",
        required: true,
        description: "UUID for safe retries. Required for mutating requests.",
      },
    ],
    requestBody: `{
  "senderId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "resourceType": "Appointment",
  "data": {
    "resourceType": "Appointment",
    "status": "proposed",
    "description": "Consultation",
    "participant": [
      {
        "actor": {
          "type": "Patient",
          "identifier": {
            "system": "http://philhealth.gov.ph",
            "value": "12-345678901-2"
          }
        },
        "status": "accepted"
      }
    ]
  },
  "reason": "New Appointment Request",
  "notes": "Please confirm availability"
}`,
    responseStatus: 200,
    responseBody: `{
  "id": "transaction-uuid",
  "requesterId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "resourceType": "Appointment",
  "status": "COMPLETED",
  "metadata": {
    "reason": "New Appointment Request",
    "notes": "Please confirm availability"
  },
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}`,
    notes: [
      "Target provider must support receiving unsolicited pushes via /fhir/receive-push",
      "Transaction status is immediately updated to COMPLETED upon successful delivery",
      "Data must be a valid FHIR resource matching the resourceType",
      "The senderId becomes the requesterId in the transaction record",
    ],
  },
];

import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const healthEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/health",
    description: "Check if the gateway is running and healthy. This endpoint does not require authentication.",
    responseStatus: 200,
    responseBody: `{
  "status": "healthy",
  "service": "wah4pc-gateway"
}`,
  },
];

import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const providersEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/api/v1/providers",
    description: "List all registered healthcare providers",
    headers: [],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Example Hospital",
      "type": "hospital",
      "baseUrl": "https://your-api.example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}`,
  },
];

import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const transactionsEndpoints: EndpointCardProps[] = [
  {
    method: "GET",
    path: "/api/v1/transactions",
    description: "List transactions. Admin keys see all transactions. User keys only see transactions where their linked provider is the requester or target.",
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
    ],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": [
    {
      "id": "transaction-uuid",
      "requesterId": "provider-uuid-1",
      "targetId": "provider-uuid-2",
      "identifiers": [
        {
          "system": "http://philhealth.gov.ph",
          "value": "12-345678901-2"
        }
      ],
      "resourceType": "Patient",
      "status": "COMPLETED",
      "metadata": {
        "reason": "Referral",
        "notes": ""
      },
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:05:00Z"
    }
  ]
}`,
    notes: [
      "Admin API keys: Returns ALL transactions in the system",
      "User API keys: Returns only transactions where the linked provider is requester or target",
      "Access control is automatic based on the providerId linked to your API key",
    ],
  },
  {
    method: "GET",
    path: "/api/v1/transactions/{id}",
    description: "Get details of a specific transaction. User keys can only access transactions where their linked provider is involved.",
    pathParams: [
      { name: "id", type: "string", description: "Transaction UUID" },
    ],
    headers: [
      {
        name: "X-API-Key",
        value: "wah_your-api-key",
        required: true,
      },
    ],
    responseStatus: 200,
    responseBody: `{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "requesterId": "provider-uuid-1",
    "targetId": "provider-uuid-2",
    "identifiers": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      },
      {
        "system": "http://hospital-metro.com/mrn",
        "value": "MRN-12345"
      }
    ],
    "resourceType": "Patient",
    "status": "COMPLETED",
    "metadata": {
      "reason": "Referral consultation",
      "notes": "Urgent request for patient records"
    },
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:05:00Z"
  }
}`,
    notes: [
      "Admin API keys can access any transaction",
      "User API keys can only access transactions where their provider is requester or target",
      "Returns 403 Forbidden if user attempts to access unauthorized transaction",
    ],
  },
];

import type { EndpointCardProps } from "@/components/ui/endpoint-card";

export const webhookEndpoints: EndpointCardProps[] = [
  {
    method: "POST",
    path: "/fhir/process-query",
    description:
      "Endpoint you must implement to receive data requests from the gateway. When another provider requests patient data, the gateway will call this endpoint on your system.",
    headers: [
      {
        name: "X-Gateway-Auth",
        value: "your-gateway-auth-key",
        required: true,
        description:
          "Secret key you provided during provider registration. Validate this to ensure the request is from the gateway.",
      },
    ],
    requestBody: `{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "requesterId": "requester-provider-uuid",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    },
    {
      "system": "http://hospital-b.com/mrn",
      "value": "MRN-12345"
    }
  ],
  "resourceType": "Patient",
  "gatewayReturnUrl": "https://gateway.wah4pc.com/api/v1/fhir/receive/Patient",
  "reason": "Referral consultation",
  "notes": "Patient transferring for specialized care"
}`,
    responseStatus: 200,
    responseBody: `{
  "message": "Processing"
}`,
    notes: [
      "**You must implement this endpoint** on your server at the baseUrl you registered",
      "Respond with 200 OK immediately to acknowledge receipt",
      "Process the request asynchronously and send results to the gatewayReturnUrl",
      "Use the transactionId when sending results back to correlate the response",
      "Validate the X-Gateway-Auth header matches your registered gatewayAuthKey",
      "Search your database using the provided identifiers array",
      "The reason and notes fields provide context about why data is being requested",
    ],
  },
  {
    method: "POST",
    path: "/fhir/receive-results",
    description:
      "Endpoint you must implement to receive requested data. When data you requested is ready, the gateway will deliver it to this endpoint on your system.",
    headers: [
      {
        name: "X-Gateway-Auth",
        value: "your-gateway-auth-key",
        required: true,
        description:
          "Secret key you provided during provider registration. Validate this to ensure the request is from the gateway.",
      },
    ],
    requestBody: `{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Patient",
    "id": "patient-123",
    "identifier": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      }
    ],
    "name": [{ "family": "Dela Cruz", "given": ["Juan"] }],
    "birthDate": "1990-05-15",
    "gender": "male"
  }
}`,
    responseStatus: 200,
    responseBody: `{
  "message": "Data received successfully"
}`,
    notes: [
      "**You must implement this endpoint** on your server at the baseUrl you registered",
      "The transactionId corresponds to a request you previously initiated",
      "Status values: SUCCESS (data found), REJECTED (patient not found), ERROR (processing failed)",
      "When status is SUCCESS, the data field contains the FHIR resource",
      "When status is REJECTED or ERROR, the data field contains error details",
      "Store the received data and update your pending transaction status",
      "Validate the X-Gateway-Auth header matches your registered gatewayAuthKey",
    ],
  },
  {
    method: "POST",
    path: "/fhir/receive-push",
    description: "Endpoint you must implement to receive unsolicited data pushes from other providers (e.g., incoming referrals or appointments).",
    headers: [
      {
        name: "X-Gateway-Auth",
        value: "your-gateway-auth-key",
        required: true,
        description:
          "Secret key you provided during provider registration. Validate this to ensure the request is from the gateway.",
      },
    ],
    requestBody: `{
  "transactionId": "transaction-uuid",
  "senderId": "sender-provider-uuid",
  "resourceType": "Appointment",
  "data": {
    "resourceType": "Appointment",
    "status": "proposed",
    "description": "Consultation",
    "participant": [
      {
        "actor": {
          "type": "Patient",
          "identifier": {
            "system": "http://philhealth.gov.ph",
            "value": "12-345678901-2"
          }
        },
        "status": "accepted"
      }
    ]
  },
  "reason": "New Appointment Request",
  "notes": "Please confirm availability"
}`,
    responseStatus: 200,
    responseBody: `{
  "message": "Data received successfully"
}`,
    notes: [
      "**Implement this to support receiving data you didn't explicitly request**",
      "This is critical for receiving referrals, appointments, or unsolicited lab results",
      "Validate the X-Gateway-Auth header",
      "Process and store the received resource immediately",
      "Return 200 OK to acknowledge receipt",
    ],
  },
];