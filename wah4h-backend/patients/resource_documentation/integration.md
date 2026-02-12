"use client";

import {
  Server,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  Shield,
  Lightbulb,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { DiagramContainer } from "@/components/ui/diagram-container";
import { DocsHeader } from "@/components/ui/docs-header";
import { StepSection } from "@/components/ui/step-section";
import { JsonViewer } from "@/components/ui/json-viewer";
import { AlertBlock } from "@/components/ui/alert-block";
import { FeatureCard } from "@/components/ui/feature-card";
import { RequestHeaders } from "@/components/ui/request-headers";
import { config } from "@/lib/config";
import { PrerequisiteItem, ChecklistItem } from "@/components/ui/checklist";
import { MethodBadge } from "@/components/ui/method-badge";
import { WebhookCard } from "@/components/integration/webhook-card";
import { ImplementationTabs } from "@/components/integration/implementation-tabs";
import { LastUpdated } from "@/components/ui/last-updated";
import {
  integrationFlowDiagram,
  webhookHandlerDiagram,
  nodeJsExample,
  goExample,
  pythonExample,
  dartExample,
  checklistItems,
  prerequisites,
  securityFeatures,
  bestPractices,
  commonPitfalls,
  fhirRequestHeaders,
} from "./data";

export default function IntegrationPage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="Integration Guide"
        badgeColor="green"
        title="Provider Integration"
        description="Complete guide to connect your healthcare system with the WAH4PC Gateway. Learn what endpoints you need to implement, how to handle patient identifiers, and best practices for seamless integration."
      />

      {/* Prerequisites */}
      <section id="prerequisites" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Prerequisites</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <ul className="space-y-4">
            {prerequisites.map((item) => (
              <PrerequisiteItem
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* Integration Flow Overview */}
      <section id="flow" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Integration Flow Overview</h2>
        <p className="mb-6 text-slate-600">
          The diagram below shows the complete integration flow, including registration,
          requesting data, and providing data to other providers.
        </p>
        <DiagramContainer 
          chart={integrationFlowDiagram} 
          title="End-to-End Integration Flow"
          filename="integration_flow.mmd"
        />
      </section>

      {/* Step 1: Registration */}
      <StepSection
        id="registration"
        stepNumber={1}
        title="Register Your Organization"
        description="Before exchanging data, you must register your organization with the system administrator. This process establishes your identity in the network."
      >
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Registration Process</h3>
          </div>

          <AlertBlock type="info" className="mb-6">
            <strong>Note:</strong> Provider registration is currently an administrative process. Please contact the system administrator to register your organization.
          </AlertBlock>
          
          <div className="space-y-4 text-slate-600">
             <p>You will need to provide the following information:</p>
             <ul className="list-disc pl-5 space-y-2">
                <li>Organization Name</li>
                <li>Provider Type (e.g., hospital, clinic)</li>
                <li>Base URL (publicly accessible webhook endpoint)</li>
             </ul>
             <p>Once registered, you will receive:</p>
             <ul className="list-disc pl-5 space-y-2">
                <li><strong>Provider ID:</strong> Your unique identifier (UUID)</li>
                <li><strong>API Key:</strong> Secret key for authenticating your requests</li>
             </ul>
          </div>
        </div>
      </StepSection>

      {/* Step 2: Implement Webhooks */}
      <StepSection
        id="webhooks"
        stepNumber={2}
        title="Implement Webhook Endpoints"
        description="The gateway communicates with your system via webhooks. You must implement two endpoints on your backend that the gateway will call."
      >
        <DiagramContainer 
          chart={webhookHandlerDiagram} 
          title="Webhook Interaction Pattern"
          filename="webhooks.mmd"
          className="mb-8"
        />

        {/* Webhook 1: Process Query */}
        <WebhookCard
          icon={<ArrowDownToLine className="h-6 w-6 text-blue-700" />}
          iconBg="bg-blue-100"
          borderColor="border-blue-200"
          bgColor="bg-blue-50/30"
          title="Webhook 1: Process Query"
          subtitle="Called when another provider requests data from you"
          method="POST"
          endpoint="{your_base_url}/fhir/process-query"
          requestCode={`{
  "transactionId": "txn-uuid-from-gateway",
  "requesterId": "requesting-provider-uuid",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    },
    {
      "system": "http://your-hospital.com/mrn",
      "value": "MRN-12345"
    }
  ],
  "resourceType": "Patient",
  "gatewayReturnUrl": "${config.gatewayUrl}/api/v1/fhir/receive/Patient",
  "reason": "Referral consultation",
  "notes": "Patient requires urgent cardiac evaluation"
}`}
          requestTitle="Incoming Request from Gateway"
          steps={[
            { num: "1.", color: "text-blue-600", text: <>Acknowledge the request immediately with <code className="bg-slate-100 px-1 rounded border border-slate-200">200 OK</code></> },
            { num: "2.", color: "text-blue-600", text: <>Match patient using the <code className="bg-slate-100 px-1 rounded border border-slate-200">identifiers</code> array (PhilHealth ID, MRN, etc.)</> },
            { num: "3.", color: "text-blue-600", text: "Format the data as a FHIR resource" },
            { num: "4.", color: "text-blue-600", text: <>POST the data to the <code className="bg-slate-100 px-1 rounded border border-slate-200">gatewayReturnUrl</code></> },
          ]}
          responseHttpMeta={{
            method: "POST",
            url: "{gatewayReturnUrl}",
            headers: {
              "Content-Type": "application/json",
              "X-Provider-ID": "your-provider-uuid",
              "X-API-Key": "your-api-key",
            },
          }}
          responseCode={`{
  "transactionId": "txn-uuid-from-gateway",
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
}`}
          responseTitle="Your Response to Gateway (send to gatewayReturnUrl)"
        />

        {/* Webhook 2: Receive Results */}
        <WebhookCard
          icon={<ArrowUpFromLine className="h-6 w-6 text-purple-700" />}
          iconBg="bg-purple-100"
          borderColor="border-purple-200"
          bgColor="bg-purple-50/30"
          title="Webhook 2: Receive Results"
          subtitle="Called when you requested data and it's now available"
          method="POST"
          endpoint="{your_base_url}/fhir/receive-results"
          requestCode={`{
  "transactionId": "your-original-transaction-id",
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
}`}
          requestTitle="Incoming Data from Gateway"
          steps={[
            { num: "1.", color: "text-purple-600", text: <>Validate the <code className="bg-slate-100 px-1 rounded border border-slate-200">transactionId</code> matches a pending request</> },
            { num: "2.", color: "text-purple-600", text: "Store or process the received FHIR data" },
            { num: "3.", color: "text-purple-600", text: <>Respond with <code className="bg-slate-100 px-1 rounded border border-slate-200">200 OK</code> to confirm receipt</> },
          ]}
          responseCode={`{
  "message": "Data received successfully"
}`}
          responseTitle="Your Response"
          className="mt-8"
        />

        {/* Webhook 3: Receive Push */}
        <WebhookCard
          icon={<ArrowDownToLine className="h-6 w-6 text-amber-700" />}
          iconBg="bg-amber-100"
          borderColor="border-amber-200"
          bgColor="bg-amber-50/30"
          title="Webhook 3: Receive Push"
          subtitle="Called when another provider pushes unsolicited data to you"
          method="POST"
          endpoint="{your_base_url}/fhir/receive-push"
          requestCode={`{
  "transactionId": "txn-uuid-from-gateway",
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
}`}
          requestTitle="Incoming Push from Gateway"
          steps={[
            { num: "1.", color: "text-amber-600", text: <>Validate the <code className="bg-slate-100 px-1 rounded border border-slate-200">X-Gateway-Auth</code> header</> },
            { num: "2.", color: "text-amber-600", text: "Store the received unsolicited data" },
            { num: "3.", color: "text-amber-600", text: <>Respond with <code className="bg-slate-100 px-1 rounded border border-slate-200">200 OK</code> to confirm receipt</> },
          ]}
          responseCode={`{
  "message": "Data received successfully"
}`}
          responseTitle="Your Response"
          className="mt-8"
        />
      </StepSection>

      {/* Understanding Identifiers */}
      <section id="identifiers" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Understanding Patient Identifiers</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <p className="text-slate-600 mb-6 leading-relaxed">
            The gateway uses FHIR-compliant identifiers to match patients across different healthcare systems. 
            Each identifier has a <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-sm font-mono">system</code> (the namespace/authority) 
            and a <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-sm font-mono">value</code> (the actual ID).
          </p>
          
          <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wide">Common Identifier Systems</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">System URI</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Example Value</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">http://philhealth.gov.ph</td>
                  <td className="py-3 px-4">PhilHealth Member ID</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50/50">12-345678901-2</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">http://psa.gov.ph/birth-certificate</td>
                  <td className="py-3 px-4">PSA Birth Certificate Number</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50/50">1234-5678-9012-3456</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">http://your-hospital.com/mrn</td>
                  <td className="py-3 px-4">Your Hospital's MRN</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50/50">MRN-12345</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">http://hl7.org/fhir/sid/passport</td>
                  <td className="py-3 px-4">Passport Number</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50/50">P123456789</td>
                </tr>
              </tbody>
            </table>
          </div>

          <AlertBlock type="info" className="mt-6">
            <strong>Matching Logic:</strong> When you receive a query, try to match patients using ANY of the provided identifiers. 
            A patient may have multiple IDs - match on whichever one exists in your system.
          </AlertBlock>
        </div>
      </section>

      {/* Step 3: Making Requests */}
      <StepSection
        id="requests"
        stepNumber={3}
        title="Request Data from Other Providers"
        description="Once registered, you can request FHIR resources from any other registered provider."
      >
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Server className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Initiate a Query</h3>
          </div>

          <div className="mb-4 flex flex-wrap items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <MethodBadge method="POST" className="shrink-0" />
            <code className="text-sm font-mono text-slate-700 font-medium break-all min-w-0">{config.gatewayUrl}/api/v1/fhir/request/Patient</code>
          </div>

          <RequestHeaders headers={fhirRequestHeaders} />

          <JsonViewer
            title="Request Body"
            data={`{
  "requesterId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    }
  ],
  "reason": "Referral consultation",
  "notes": "Need latest lab results"
}`}
          />

          <JsonViewer
            title="Response (202 Accepted)"
            data={`{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "requesterId": "your-provider-uuid",
    "targetId": "target-provider-uuid",
    "identifiers": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
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
}`}
            className="mt-6"
          />

          <AlertBlock type="info" className="mt-6">
            <strong>What happens next:</strong> The gateway forwards your request to
            the target provider. When they respond, the gateway will call your{" "}
            <code className="bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono text-sm">/fhir/receive-results</code>{" "}
            endpoint with the data.
          </AlertBlock>
        </div>
      </StepSection>

      {/* Step 4: Push Data */}
      <StepSection
        id="push"
        stepNumber={4}
        title="Push Data to Other Providers"
        description="Send resources directly to another provider without a prior request. Useful for sending referrals, appointments, or unsolicited results."
      >
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ArrowUpFromLine className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Initiate a Push</h3>
          </div>

          <div className="mb-4 flex flex-wrap items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <MethodBadge method="POST" className="shrink-0" />
            <code className="text-sm font-mono text-slate-700 font-medium break-all min-w-0">{config.gatewayUrl}/api/v1/fhir/push/Appointment</code>
          </div>

          <RequestHeaders headers={fhirRequestHeaders} />

          <JsonViewer
            title="Request Body"
            data={`{
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
}`}
          />

          <JsonViewer
            title="Response (200 OK)"
            data={`{
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
}`}
            className="mt-6"
          />

          <AlertBlock type="success" className="mt-6">
            <strong>Immediate Delivery:</strong> Unlike queries, push requests are delivered immediately. 
            If the target provider accepts the data (returns 200 OK), the transaction is marked as COMPLETED instantly.
          </AlertBlock>
        </div>
      </StepSection>

      {/* Best Practices */}
      <section id="best-practices" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Best Practices</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {bestPractices.map((practice) => (
            <FeatureCard
              key={practice.title}
              icon={
                practice.icon === "Clock" ? <Clock className="h-5 w-5" /> :
                practice.icon === "CheckCircle2" ? <CheckCircle2 className="h-5 w-5" /> :
                <Lightbulb className="h-5 w-5" />
              }
              title={practice.title}
              description={practice.description}
              iconBgColor="bg-green-50 text-green-600"
            />
          ))}
        </div>
      </section>

      {/* Common Pitfalls */}
      <section id="pitfalls" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Common Pitfalls to Avoid</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {commonPitfalls.map((pitfall) => (
            <FeatureCard
              key={pitfall.title}
              icon={<AlertTriangle className="h-5 w-5" />}
              title={pitfall.title}
              description={pitfall.description}
              iconBgColor="bg-amber-50 text-amber-600"
            />
          ))}
        </div>
      </section>

      {/* Security Considerations */}
      <section id="security" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Security Considerations</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {securityFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={<Shield className="h-5 w-5" />}
              title={feature.title}
              description={feature.description}
              iconBgColor="bg-red-50 text-red-600"
            />
          ))}
        </div>
      </section>

      {/* Example Implementation with Tabs */}
      <section id="examples" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Complete Webhook Implementation</h2>
        <p className="mb-6 text-slate-600">
          Production-ready examples with validation, error handling, logging, and proper async patterns.
        </p>
        <ImplementationTabs
          nodeJsCode={nodeJsExample}
          goCode={goExample}
          pythonCode={pythonExample}
          dartCode={dartExample}
        />
      </section>

      {/* Checklist */}
      <section id="checklist" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Integration Checklist</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-8">
          <ul className="space-y-4">
            {checklistItems.map((item) => (
              <ChecklistItem key={item} text={item} />
            ))}
          </ul>
        </div>
      </section>

      <LastUpdated className="mt-12 pt-8 border-t border-slate-200" />
    </article>
  );
}

// Mermaid diagrams for Integration Guide
import { config } from "@/lib/config";

// ============================================================================
// REQUIRED HEADERS
// ============================================================================

export const registrationHeaders = {
  "X-API-Key": "wah_your-api-key",
  "Idempotency-Key": "uuid-v4-for-safe-retries",
} as const;

export const fhirRequestHeaders = {
  "X-API-Key": "wah_your-api-key",
  "X-Provider-ID": "your-provider-id",
  "Idempotency-Key": "uuid-v4-for-safe-retries",
} as const;

export const integrationFlowDiagram = `
sequenceDiagram
    participant YS as Your System
    participant GW as WAH4PC Gateway
    participant OP as Other Provider

    rect rgb(240, 249, 255)
        Note over YS,OP: Step 1 - Registration
        YS->>GW: (Admin Process) Register Organization
        GW-->>YS: Credentials Received
    end

    rect rgb(240, 253, 244)
        Note over YS,OP: Step 2 - Requesting Data (You are Requester)
        YS->>GW: POST /api/v1/fhir/request/Patient
        GW->>OP: POST /fhir/process-query
        OP-->>GW: 200 OK
        GW-->>YS: 202 Accepted (Transaction ID)
    end
    
    rect rgb(254, 252, 232)
        Note over YS,OP: Async - Other provider processes
        OP->>GW: POST /api/v1/fhir/receive/Patient
        GW->>YS: POST /fhir/receive-results
        YS-->>GW: 200 OK
    end

    rect rgb(254, 242, 242)
        Note over YS,OP: Step 3 - Providing Data (You are Target)
        OP->>GW: POST /api/v1/fhir/request/Patient
        GW->>YS: POST /fhir/process-query
        YS-->>GW: 200 OK
    end
    
    rect rgb(250, 245, 255)
        Note over YS,OP: You process and respond
        YS->>GW: POST /api/v1/fhir/receive/Patient
        GW->>OP: POST /fhir/receive-results
    end

    rect rgb(236, 253, 245)
        Note over YS,OP: Step 4 - Push Data (Unsolicited)
        YS->>GW: POST /api/v1/fhir/push/Appointment
        GW->>OP: POST /fhir/receive-push
        OP-->>GW: 200 OK
        GW-->>YS: 200 OK (Transaction Completed)
    end
`;

export const webhookHandlerDiagram = `
sequenceDiagram
    participant GW as Gateway
    participant PQ as /fhir/process-query
    participant DB as Your Database
    participant RR as /fhir/receive-results

    rect rgb(240, 249, 255)
        Note over GW,DB: Webhook 1 - Incoming Query
        GW->>PQ: POST request with transactionId, identifiers[]
        PQ->>DB: Match patient by identifiers
        DB-->>PQ: Patient record
        PQ-->>GW: 200 OK (Acknowledged)
        PQ->>GW: POST gatewayReturnUrl with data
    end

    rect rgb(250, 245, 255)
        Note over GW,DB: Webhook 2 - Receive Results
        GW->>RR: POST with transactionId and data
        RR->>DB: Store received data
        DB-->>RR: Saved
        RR-->>GW: 200 OK
    end

    rect rgb(255, 251, 235)
        Note over GW,DB: Webhook 3 - Receive Push
        GW->>RR: POST /fhir/receive-push with data
        RR->>DB: Store unsolicited data
        DB-->>RR: Saved
        RR-->>GW: 200 OK
    end
`;

// ============================================================================
// PRODUCTION-READY CODE EXAMPLES
// ============================================================================

export const nodeJsExample = `// ============================================================================
// WAH4PC Gateway Integration - Node.js/TypeScript
// Production-ready webhook handlers with validation and error handling
// ============================================================================

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface Identifier {
  system: string;
  value: string;
}

interface ProcessQueryPayload {
  transactionId: string;
  requesterId: string;
  identifiers: Identifier[];
  resourceType: string;
  gatewayReturnUrl: string;
  reason?: string;   // Optional: Purpose of the request
  notes?: string;    // Optional: Additional context for the target provider
}

interface ReceiveResultsPayload {
  transactionId: string;
  status: 'SUCCESS' | 'REJECTED' | 'ERROR';
  data: Record<string, unknown>;
}

interface ReceivePushPayload {
  transactionId: string;
  senderId: string;
  resourceType: string;
  data: Record<string, unknown>;
  reason?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas (using Zod)
// ─────────────────────────────────────────────────────────────────────────────

const IdentifierSchema = z.object({
  system: z.string().url(),
  value: z.string().min(1),
});

const ProcessQuerySchema = z.object({
  transactionId: z.string().uuid(),
  requesterId: z.string().uuid(),
  identifiers: z.array(IdentifierSchema).min(1),
  resourceType: z.string(),
  gatewayReturnUrl: z.string().url(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const ReceiveResultsSchema = z.object({
  transactionId: z.string().uuid(),
  status: z.enum(['SUCCESS', 'REJECTED', 'ERROR']),
  data: z.record(z.unknown()).optional(),
});

const ReceivePushSchema = z.object({
  transactionId: z.string().uuid(),
  senderId: z.string().uuid(),
  resourceType: z.string(),
  data: z.record(z.unknown()),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Request Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateSchema<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.error('[Validation Error]', result.error.flatten());
      return res.status(400).json({
        error: 'Invalid request payload',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Gateway Authentication
// ─────────────────────────────────────────────────────────────────────────────

function validateGatewayAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['x-gateway-auth'];
  const expectedKey = process.env.GATEWAY_AUTH_KEY;

  if (!expectedKey) {
    // No key configured - allow (backward compatibility)
    return next();
  }

  if (authHeader !== expectedKey) {
    console.error('[Auth Error] Invalid or missing X-Gateway-Auth header');
    return res.status(401).json({
      error: 'Unauthorized - Invalid gateway authentication',
    });
  }

  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Functions (implement these for your system)
// ─────────────────────────────────────────────────────────────────────────────

async function findPatientByIdentifiers(identifiers: Identifier[]) {
  // Try each identifier until we find a match
  for (const id of identifiers) {
    const patient = await db.patients.findFirst({
      where: {
        OR: [
          { philhealthId: id.system.includes('philhealth') ? id.value : undefined },
          { mrn: id.system.includes('/mrn') ? id.value : undefined },
          // Add more identifier types as needed
        ],
      },
    });
    if (patient) return patient;
  }
  return null;
}

async function storePendingTransaction(transactionId: string, data: unknown) {
  await db.pendingTransactions.create({
    data: { transactionId, status: 'PENDING', createdAt: new Date() },
  });
}

async function storeReceivedData(transactionId: string, data: unknown) {
  await db.receivedData.create({
    data: { transactionId, fhirData: JSON.stringify(data), receivedAt: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 1: Process Query (when another provider requests data from you)
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  '/fhir/process-query',
  validateGatewayAuth,
  validateSchema(ProcessQuerySchema),
  async (req: Request, res: Response) => {
    const { transactionId, identifiers, gatewayReturnUrl, reason, notes } = req.body as ProcessQueryPayload;

    console.log(\`[Process Query] Transaction: \${transactionId}\`);
    console.log(\`[Process Query] Identifiers: \${JSON.stringify(identifiers)}\`);
    if (reason) console.log(\`[Process Query] Reason: \${reason}\`);
    if (notes) console.log(\`[Process Query] Notes: \${notes}\`);

    // IMPORTANT: Acknowledge immediately (Gateway expects quick response)
    res.status(200).json({ message: 'Processing' });

    // Process asynchronously
    setImmediate(async () => {
      try {
        // 1. Find patient by any matching identifier
        const patient = await findPatientByIdentifiers(identifiers);

        let responsePayload;
        if (!patient) {
          // Patient not found - send REJECTED status
          responsePayload = {
            transactionId,
            status: 'REJECTED',
            data: {
              error: 'Patient not found',
              searchedIdentifiers: identifiers,
            },
          };
        } else {
          // Patient found - format as FHIR resource
          responsePayload = {
            transactionId,
            status: 'SUCCESS',
            data: {
              resourceType: 'Patient',
              id: patient.id,
              identifier: identifiers.filter(id => 
                patient.philhealthId === id.value || patient.mrn === id.value
              ),
              name: [{ family: patient.lastName, given: [patient.firstName] }],
              birthDate: patient.birthDate,
              gender: patient.gender,
            },
          };
        }

        // 2. Send response to gateway (with Idempotency-Key for safe retries)
        const idempotencyKey = crypto.randomUUID();
        const response = await fetch(gatewayReturnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.WAH4PC_API_KEY!,
            'X-Provider-ID': process.env.WAH4PC_PROVIDER_ID!,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(responsePayload),
        });

        if (!response.ok) {
          console.error(\`[Process Query] Gateway callback failed: \${response.status}\`);
        } else {
          console.log(\`[Process Query] Successfully sent response for \${transactionId}\`);
        }
      } catch (error) {
        console.error(\`[Process Query] Error processing \${transactionId}:\`, error);
        // Optionally send error status to gateway
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 2: Receive Results (when data you requested is available)
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  '/fhir/receive-results',
  validateGatewayAuth,
  validateSchema(ReceiveResultsSchema),
  async (req: Request, res: Response) => {
    const { transactionId, status, data } = req.body as ReceiveResultsPayload;

    console.log(\`[Receive Results] Transaction: \${transactionId}, Status: \${status}\`);

    try {
      // 1. Verify this transaction was initiated by us
      const pending = await db.pendingTransactions.findUnique({
        where: { transactionId },
      });

      if (!pending) {
        console.warn(\`[Receive Results] Unknown transaction: \${transactionId}\`);
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // 2. Store the received data
      await storeReceivedData(transactionId, data);

      // 3. Update transaction status
      await db.pendingTransactions.update({
        where: { transactionId },
        data: { status: status, completedAt: new Date() },
      });

      console.log(\`[Receive Results] Stored data for \${transactionId}\`);
      res.status(200).json({ message: 'Data received successfully' });
    } catch (error) {
      console.error(\`[Receive Results] Error:\`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 3: Receive Push (Unsolicited Data)
// ─────────────────────────────────────────────────────────────────────────────

app.post(
  '/fhir/receive-push',
  validateGatewayAuth,
  validateSchema(ReceivePushSchema),
  async (req: Request, res: Response) => {
    const { transactionId, senderId, resourceType, data, reason } = req.body as ReceivePushPayload;

    console.log(\`[Receive Push] Transaction: \${transactionId}, From: \${senderId}, Type: \${resourceType}\`);
    if (reason) console.log(\`[Receive Push] Reason: \${reason}\`);

    try {
      // 1. Store the unsolicited data
      await storeReceivedData(transactionId, data);
      
      console.log(\`[Receive Push] Stored data for \${transactionId}\`);
      res.status(200).json({ message: 'Data received successfully' });
    } catch (error) {
      console.error(\`[Receive Push] Error:\`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Environment Variables Required
// ─────────────────────────────────────────────────────────────────────────────
// WAH4PC_API_KEY=wah_your-api-key-here
// WAH4PC_PROVIDER_ID=your-provider-uuid
// WAH4PC_GATEWAY_URL=${config.gatewayUrl}
// GATEWAY_AUTH_KEY=your-secret-gateway-auth-key (set when registering provider)

app.listen(3000, () => console.log('Webhook server running on port 3000'));`;

export const goExample = `// ============================================================================
// WAH4PC Gateway Integration - Go
// Production-ready webhook handlers with validation and error handling
// ============================================================================

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

type Identifier struct {
	System string \`json:"system" validate:"required,url"\`
	Value  string \`json:"value" validate:"required"\`
}

type ProcessQueryRequest struct {
	TransactionID    string       \`json:"transactionId" validate:"required,uuid"\`
	RequesterID      string       \`json:"requesterId" validate:"required,uuid"\`
	Identifiers      []Identifier \`json:"identifiers" validate:"required,min=1,dive"\`
	ResourceType     string       \`json:"resourceType" validate:"required"\`
	GatewayReturnURL string       \`json:"gatewayReturnUrl" validate:"required,url"\`
	Reason           string       \`json:"reason,omitempty"\`  // Optional: Purpose of the request
	Notes            string       \`json:"notes,omitempty"\`   // Optional: Additional context
}

type ReceiveResultsRequest struct {
	TransactionID string                 \`json:"transactionId" validate:"required,uuid"\`
	Status        string                 \`json:"status" validate:"required,oneof=SUCCESS REJECTED ERROR"\`
	Data          map[string]interface{} \`json:"data"\`
}

type ReceivePushRequest struct {
	TransactionID string                 \`json:"transactionId" validate:"required,uuid"\`
	SenderID      string                 \`json:"senderId" validate:"required,uuid"\`
	ResourceType  string                 \`json:"resourceType" validate:"required"\`
	Data          map[string]interface{} \`json:"data"\`
	Reason        string                 \`json:"reason,omitempty"\`
	Notes         string                 \`json:"notes,omitempty"\`
}

type GatewayResponse struct {
	TransactionID string      \`json:"transactionId"\`
	Status        string      \`json:"status"\`
	Data          interface{} \`json:"data,omitempty"\`
}

type FHIRPatient struct {
	ResourceType string       \`json:"resourceType"\`
	ID           string       \`json:"id"\`
	Identifier   []Identifier \`json:"identifier"\`
	Name         []HumanName  \`json:"name"\`
	BirthDate    string       \`json:"birthDate"\`
	Gender       string       \`json:"gender"\`
}

type HumanName struct {
	Family string   \`json:"family"\`
	Given  []string \`json:"given"\`
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

type Config struct {
	APIKey     string
	ProviderID string
	GatewayURL string
}

func loadConfig() Config {
	return Config{
		APIKey:     os.Getenv("WAH4PC_API_KEY"),
		ProviderID: os.Getenv("WAH4PC_PROVIDER_ID"),
		GatewayURL: os.Getenv("WAH4PC_GATEWAY_URL"),
	}
}

var config = loadConfig()

// ─────────────────────────────────────────────────────────────────────────────
// Database Functions (implement these for your system)
// ─────────────────────────────────────────────────────────────────────────────

func findPatientByIdentifiers(identifiers []Identifier) (*FHIRPatient, error) {
	// Try each identifier until we find a match
	for _, id := range identifiers {
		// Query your database here
		// patient, err := db.FindPatientByIdentifier(id.System, id.Value)
		// if err == nil && patient != nil {
		//     return convertToFHIR(patient), nil
		// }
	}
	return nil, nil // Not found
}

func storePendingTransaction(transactionID string) error {
	// Store in your database
	return nil
}

func storeReceivedData(transactionID string, data map[string]interface{}) error {
	// Store in your database
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Gateway Authentication
// ─────────────────────────────────────────────────────────────────────────────

func validateGatewayAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		expectedKey := os.Getenv("GATEWAY_AUTH_KEY")
		
		// If no key configured, allow (backward compatibility)
		if expectedKey == "" {
			next(w, r)
			return
		}

		authHeader := r.Header.Get("X-Gateway-Auth")
		if authHeader != expectedKey {
			log.Printf("[Auth Error] Invalid or missing X-Gateway-Auth header")
			http.Error(w, "Unauthorized - Invalid gateway authentication", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 1: Process Query Handler
// ─────────────────────────────────────────────────────────────────────────────

func handleProcessQuery(w http.ResponseWriter, r *http.Request) {
	var req ProcessQueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Process Query] Invalid JSON: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.TransactionID == "" || len(req.Identifiers) == 0 {
		log.Printf("[Process Query] Missing required fields")
		http.Error(w, "Missing transactionId or identifiers", http.StatusBadRequest)
		return
	}

	log.Printf("[Process Query] Transaction: %s, Identifiers: %d", 
		req.TransactionID, len(req.Identifiers))

	// IMPORTANT: Acknowledge immediately
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Processing"})

	// Process asynchronously
	go func() {
		// Find patient by identifiers
		patient, err := findPatientByIdentifiers(req.Identifiers)
		
		var response GatewayResponse
		response.TransactionID = req.TransactionID

		if err != nil {
			log.Printf("[Process Query] Database error: %v", err)
			response.Status = "ERROR"
			response.Data = map[string]string{"error": "Internal error"}
		} else if patient == nil {
			log.Printf("[Process Query] Patient not found for transaction %s", req.TransactionID)
			response.Status = "REJECTED"
			response.Data = map[string]interface{}{
				"error":               "Patient not found",
				"searchedIdentifiers": req.Identifiers,
			}
		} else {
			log.Printf("[Process Query] Found patient %s", patient.ID)
			response.Status = "SUCCESS"
			response.Data = patient
		}

		// Send response to gateway
		if err := sendToGateway(req.GatewayReturnURL, response); err != nil {
			log.Printf("[Process Query] Failed to send callback: %v", err)
		}
	}()
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 2: Receive Results Handler
// ─────────────────────────────────────────────────────────────────────────────

func handleReceiveResults(w http.ResponseWriter, r *http.Request) {
	var req ReceiveResultsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Receive Results] Invalid JSON: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[Receive Results] Transaction: %s, Status: %s", 
		req.TransactionID, req.Status)

	// Store the received data
	if err := storeReceivedData(req.TransactionID, req.Data); err != nil {
		log.Printf("[Receive Results] Failed to store data: %v", err)
		http.Error(w, "Failed to store data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Data received successfully"})
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 3: Receive Push Handler
// ─────────────────────────────────────────────────────────────────────────────

func handleReceivePush(w http.ResponseWriter, r *http.Request) {
	var req ReceivePushRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[Receive Push] Invalid JSON: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[Receive Push] Transaction: %s, From: %s, Type: %s", 
		req.TransactionID, req.SenderID, req.ResourceType)
	
	if req.Reason != "" {
		log.Printf("[Receive Push] Reason: %s", req.Reason)
	}

	// Store the unsolicited data
	if err := storeReceivedData(req.TransactionID, req.Data); err != nil {
		log.Printf("[Receive Push] Failed to store data: %v", err)
		http.Error(w, "Failed to store data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Data received successfully"})
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Send Response to Gateway
// ─────────────────────────────────────────────────────────────────────────────

func sendToGateway(url string, payload GatewayResponse) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("request creation error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", config.APIKey)
	req.Header.Set("X-Provider-ID", config.ProviderID)
	req.Header.Set("Idempotency-Key", generateUUID()) // Use google/uuid package

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("gateway returned status %d", resp.StatusCode)
	}

	log.Printf("[Gateway] Successfully sent response for %s", payload.TransactionID)
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

func main() {
	http.HandleFunc("/fhir/process-query", validateGatewayAuth(handleProcessQuery))
	http.HandleFunc("/fhir/receive-results", validateGatewayAuth(handleReceiveResults))
	http.HandleFunc("/fhir/receive-push", validateGatewayAuth(handleReceivePush))

	log.Println("Webhook server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}`;

export const pythonExample = `# ============================================================================
# WAH4PC Gateway Integration - Python (Flask)
# Production-ready webhook handlers with validation and error handling
# ============================================================================

from flask import Flask, request, jsonify
from pydantic import BaseModel, HttpUrl, validator
from typing import List, Optional, Dict, Any
from threading import Thread
import requests
import logging
import os

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

class Config:
    API_KEY = os.environ.get('WAH4PC_API_KEY', '')
    PROVIDER_ID = os.environ.get('WAH4PC_PROVIDER_ID', '')
    GATEWAY_URL = os.environ.get('WAH4PC_GATEWAY_URL', '')

config = Config()

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Models for Validation
# ─────────────────────────────────────────────────────────────────────────────

class Identifier(BaseModel):
    system: str
    value: str

class ProcessQueryPayload(BaseModel):
    transactionId: str
    requesterId: str
    identifiers: List[Identifier]
    resourceType: str
    gatewayReturnUrl: str
    reason: Optional[str] = None   # Optional: Purpose of the request
    notes: Optional[str] = None    # Optional: Additional context

    @validator('identifiers')
    def identifiers_not_empty(cls, v):
        if not v:
            raise ValueError('At least one identifier is required')
        return v

class ReceiveResultsPayload(BaseModel):
    transactionId: str
    status: str
    data: Optional[Dict[str, Any]] = None

    @validator('status')
    def status_valid(cls, v):
        if v not in ['SUCCESS', 'REJECTED', 'ERROR']:
            raise ValueError('Status must be SUCCESS, REJECTED, or ERROR')
        return v

# ─────────────────────────────────────────────────────────────────────────────
# Database Functions (implement these for your system)
# ─────────────────────────────────────────────────────────────────────────────

def find_patient_by_identifiers(identifiers: List[Identifier]) -> Optional[Dict]:
    """
    Try each identifier until we find a match in your database.
    Returns FHIR-formatted patient or None if not found.
    """
    for identifier in identifiers:
        # Query your database here
        # patient = db.patients.find_one({
        #     '$or': [
        #         {'philhealth_id': identifier.value if 'philhealth' in identifier.system else None},
        #         {'mrn': identifier.value if '/mrn' in identifier.system else None},
        #     ]
        # })
        # if patient:
        #     return format_as_fhir(patient)
        pass
    return None

def store_received_data(transaction_id: str, data: Dict) -> None:
    """Store received FHIR data in your database."""
    # db.received_data.insert_one({
    #     'transaction_id': transaction_id,
    #     'data': data,
    #     'received_at': datetime.utcnow()
    # })
    pass

def verify_pending_transaction(transaction_id: str) -> bool:
    """Verify this transaction was initiated by us."""
    # return db.pending_transactions.find_one({'transaction_id': transaction_id}) is not None
    return True

# ─────────────────────────────────────────────────────────────────────────────
# Webhook 1: Process Query (when another provider requests data from you)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/fhir/process-query', methods=['POST'])
def process_query():
    # Validate request body
    try:
        payload = ProcessQueryPayload(**request.json)
    except Exception as e:
        logger.error(f"[Process Query] Validation error: {e}")
        return jsonify({'error': 'Invalid request payload', 'details': str(e)}), 400

    logger.info(f"[Process Query] Transaction: {payload.transactionId}")
    logger.info(f"[Process Query] Identifiers: {[f'{i.system}:{i.value}' for i in payload.identifiers]}")

    # IMPORTANT: Acknowledge immediately (don't block)
    response = jsonify({'message': 'Processing'})

    # Process asynchronously
    def send_to_gateway():
        try:
            # 1. Find patient by identifiers
            patient = find_patient_by_identifiers(payload.identifiers)

            if patient is None:
                # Patient not found
                response_payload = {
                    'transactionId': payload.transactionId,
                    'status': 'REJECTED',
                    'data': {
                        'error': 'Patient not found',
                        'searchedIdentifiers': [i.dict() for i in payload.identifiers]
                    }
                }
                logger.info(f"[Process Query] Patient not found for {payload.transactionId}")
            else:
                # Patient found
                response_payload = {
                    'transactionId': payload.transactionId,
                    'status': 'SUCCESS',
                    'data': patient
                }
                logger.info(f"[Process Query] Found patient for {payload.transactionId}")

            # 2. Send response to gateway
            resp = requests.post(
                payload.gatewayReturnUrl,
                headers={
                    'Content-Type': 'application/json',
                    'X-API-Key': config.API_KEY,
                    'X-Provider-ID': config.PROVIDER_ID,
                },
                json=response_payload,
                timeout=30
            )
            
            if resp.status_code >= 400:
                logger.error(f"[Process Query] Gateway returned {resp.status_code}")
            else:
                logger.info(f"[Process Query] Successfully sent response for {payload.transactionId}")

        except Exception as e:
            logger.error(f"[Process Query] Error: {e}")

    Thread(target=send_to_gateway).start()
    return response, 200

# ─────────────────────────────────────────────────────────────────────────────
# Webhook 2: Receive Results (when data you requested is available)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/fhir/receive-results', methods=['POST'])
def receive_results():
    # Validate request body
    try:
        payload = ReceiveResultsPayload(**request.json)
    except Exception as e:
        logger.error(f"[Receive Results] Validation error: {e}")
        return jsonify({'error': 'Invalid request payload', 'details': str(e)}), 400

    logger.info(f"[Receive Results] Transaction: {payload.transactionId}, Status: {payload.status}")

    # Verify this transaction was initiated by us
    if not verify_pending_transaction(payload.transactionId):
        logger.warning(f"[Receive Results] Unknown transaction: {payload.transactionId}")
        return jsonify({'error': 'Transaction not found'}), 404

    try:
        # Store the received data
        if payload.data:
            store_received_data(payload.transactionId, payload.data)
        
        logger.info(f"[Receive Results] Stored data for {payload.transactionId}")
        return jsonify({'message': 'Data received successfully'}), 200

    except Exception as e:
        logger.error(f"[Receive Results] Error storing data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)`;

export const dartExample = `// ============================================================================
// WAH4PC Gateway Integration - Dart (Shelf)
// Production-ready webhook handlers with validation and error handling
// ============================================================================

import 'dart:convert';
import 'dart:io';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:http/http.dart' as http;

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

class Config {
  static String apiKey = Platform.environment['WAH4PC_API_KEY'] ?? '';
  static String providerId = Platform.environment['WAH4PC_PROVIDER_ID'] ?? '';
  static String gatewayAuthKey = Platform.environment['GATEWAY_AUTH_KEY'] ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Gateway Authentication
// ─────────────────────────────────────────────────────────────────────────────

Middleware validateGatewayAuth() {
  return (Handler innerHandler) {
    return (Request request) async {
      if (Config.gatewayAuthKey.isEmpty) return await innerHandler(request);

      final authHeader = request.headers['x-gateway-auth'];
      if (authHeader != Config.gatewayAuthKey) {
        return Response.forbidden('Unauthorized - Invalid gateway authentication');
      }

      return await innerHandler(request);
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 1: Process Query
// ─────────────────────────────────────────────────────────────────────────────

Future<Response> handleProcessQuery(Request request) async {
  try {
    final payload = jsonDecode(await request.readAsString());
    final String transactionId = payload['transactionId'];
    final String gatewayReturnUrl = payload['gatewayReturnUrl'];
    final List identifiers = payload['identifiers'];
    final String? reason = payload['reason'];  // Optional
    final String? notes = payload['notes'];    // Optional

    print('[Process Query] Transaction: $transactionId');
    if (reason != null) print('[Process Query] Reason: $reason');
    if (notes != null) print('[Process Query] Notes: $notes');

    // IMPORTANT: Acknowledge immediately
    // We start processing in background but return 200 OK now
    _processQueryInBackground(transactionId, gatewayReturnUrl, identifiers);

    return Response.ok(jsonEncode({'message': 'Processing'}),
        headers: {'content-type': 'application/json'});
  } catch (e) {
    print('[Process Query] Error: $e');
    return Response.badRequest(body: 'Invalid request payload');
  }
}

void _processQueryInBackground(
    String transactionId, String gatewayReturnUrl, List identifiers) async {
  try {
    // 1. Find patient (Mock database lookup)
    final patient = await _findPatientByIdentifiers(identifiers);

    Map<String, dynamic> responsePayload;

    if (patient == null) {
      responsePayload = {
        'transactionId': transactionId,
        'status': 'REJECTED',
        'data': {
          'error': 'Patient not found',
          'searchedIdentifiers': identifiers,
        }
      };
    } else {
      responsePayload = {
        'transactionId': transactionId,
        'status': 'SUCCESS',
        'data': patient,
      };
    }

    // 2. Send response to gateway
    final response = await http.post(
      Uri.parse(gatewayReturnUrl),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': Config.apiKey,
        'X-Provider-ID': Config.providerId,
      },
      body: jsonEncode(responsePayload),
    );

    if (response.statusCode >= 400) {
      print('[Process Query] Gateway returned \${response.statusCode}');
    } else {
      print('[Process Query] Successfully sent response for $transactionId');
    }
  } catch (e) {
    print('[Process Query] Background error: $e');
  }
}

Future<Map<String, dynamic>?> _findPatientByIdentifiers(List identifiers) async {
  // Simulate DB lookup
  await Future.delayed(Duration(milliseconds: 100));
  // Return mock patient
  return {
    'resourceType': 'Patient',
    'id': 'patient-123',
    'name': [
      {'family': 'Dela Cruz', 'given': ['Juan']}
    ],
    'birthDate': '1990-05-15',
    'gender': 'male',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 2: Receive Results
// ─────────────────────────────────────────────────────────────────────────────

Future<Response> handleReceiveResults(Request request) async {
  try {
    final payload = jsonDecode(await request.readAsString());
    final String transactionId = payload['transactionId'];
    final String status = payload['status'];
    final Map<String, dynamic>? data = payload['data'];

    print('[Receive Results] Transaction: $transactionId, Status: $status');

    if (data != null) {
      // Store data in database
      print('[Receive Results] Stored data for $transactionId');
    }

    return Response.ok(jsonEncode({'message': 'Data received successfully'}),
        headers: {'content-type': 'application/json'});
  } catch (e) {
    print('[Receive Results] Error: $e');
    return Response.internalServerError();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

void main() async {
  final handler = const Pipeline()
      .addMiddleware(logRequests())
      .addMiddleware(validateGatewayAuth())
      .addHandler((Request request) {
    if (request.url.path == 'fhir/process-query' && request.method == 'POST') {
      return handleProcessQuery(request);
    }
    if (request.url.path == 'fhir/receive-results' && request.method == 'POST') {
      return handleReceiveResults(request);
    }
    return Response.notFound('Not found');
  });

  final server = await shelf_io.serve(handler, '0.0.0.0', 8080);
  print('Server listening on port \${server.port}');
}
`;

// ============================================================================
// STATIC DATA
// ============================================================================

export const providerTypes = ["clinic", "hospital", "laboratory", "pharmacy"] as const;

export const checklistItems = [
  "Register your organization with the gateway",
  "Generate and save a Gateway Auth Key for mutual authentication",
  "Save your provider ID and API key securely",
  "Implement POST /fhir/process-query endpoint",
  "Implement POST /fhir/receive-results endpoint",
  "Add validation for X-Gateway-Auth header in your webhooks",
  "Add patient matching logic for FHIR identifiers",
  "Generate unique Idempotency-Key (UUID v4) for each request",
  "Handle 409 Conflict (retry after delay) and 429 errors (duplicate detected)",
  "Test with a sandbox/staging gateway first",
  "Ensure HTTPS is configured on your base URL",
  "Implement proper error handling and logging",
  "Set up monitoring for webhook endpoints",
  "Configure environment variables for production",
] as const;

export const prerequisites = [
  {
    title: "Publicly Accessible Base URL",
    description: "Your backend must be reachable from the internet (e.g., https://api.yourorganization.com)",
  },
  {
    title: "HTTPS Enabled",
    description: "All endpoints must use HTTPS for secure communication",
  },
  {
    title: "Gateway Auth Key",
    description: "Generate a secure secret key that the Gateway will use to authenticate when calling your webhooks",
  },
  {
    title: "Webhook Endpoints",
    description: "You must implement two webhook endpoints that the gateway will call",
  },
  {
    title: "FHIR-Compatible Data",
    description: "Your system should be able to produce and consume FHIR resources",
  },
  {
    title: "Patient Identifier Mapping",
    description: "Ability to match patients by PhilHealth ID, MRN, or other FHIR identifiers",
  },
] as const;

export const securityFeatures = [
  {
    title: "Validate X-Gateway-Auth Header",
    description: "Verify the X-Gateway-Auth header matches your Gateway Auth Key to ensure requests are from the legitimate gateway.",
  },
  {
    title: "Validate X-Provider-ID Header",
    description: "When receiving callbacks, check the X-Provider-ID header matches the expected sender.",
  },
  {
    title: "Verify Transaction IDs",
    description: "Only process results for transaction IDs you initiated. Reject unknown transactions.",
  },
  {
    title: "Use HTTPS Only",
    description: "All communication must use HTTPS. The gateway will reject HTTP base URLs.",
  },
  {
    title: "Implement Rate Limiting",
    description: "Protect your endpoints from abuse by implementing rate limiting on webhooks.",
  },
] as const;

export const bestPractices = [
  {
    title: "Respond Immediately (200 OK)",
    description: "Always acknowledge webhook requests within 5 seconds. Process data asynchronously to avoid timeouts.",
    icon: "Clock",
  },
  {
    title: "Use Idempotency Keys",
    description: "Generate a UUID v4 for each request and include it in the Idempotency-Key header. Reuse the same key when retrying failed requests. Keys are cached for 24 hours.",
    icon: "CheckCircle2",
  },
  {
    title: "Handle Duplicate Detection",
    description: "The gateway prevents identical requests (same requester, target, identifiers) within 5 minutes. Handle 429 errors gracefully and avoid immediate retries.",
    icon: "CheckCircle2",
  },
  {
    title: "Handle 409 Conflict",
    description: "If you receive 409, your previous request with the same Idempotency-Key is still processing. Wait and retry after a short delay.",
    icon: "Clock",
  },
  {
    title: "Log Everything",
    description: "Log all incoming requests and outgoing responses with transaction IDs for debugging and auditing.",
    icon: "Lightbulb",
  },
  {
    title: "Use a Job Queue",
    description: "For production, use Redis/RabbitMQ to queue processing jobs instead of spawning threads directly.",
    icon: "Lightbulb",
  },
] as const;

export const commonPitfalls = [
  {
    title: "Blocking the Webhook Response",
    description: "Don't fetch data from your database before responding 200 OK. The gateway has a timeout and will retry.",
  },
  {
    title: "Ignoring REJECTED Status",
    description: "When a provider can't find the patient, they should return status: 'REJECTED', not just fail silently.",
  },
  {
    title: "Hardcoding Identifiers",
    description: "Don't assume all patients have a PhilHealth ID. Match on ANY identifier in the array that exists in your system.",
  },
  {
    title: "Missing Error Handling",
    description: "If your database query fails, catch the error and send status: 'ERROR' to the gateway with details.",
  },
] as const;