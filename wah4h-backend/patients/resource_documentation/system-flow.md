"use client";

import Link from "next/link";
import {
  UserPlus,
  Search,
  Shield,
  ArrowLeftRight,
  Activity,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { DiagramContainer } from "@/components/ui/diagram-container";
import { DocsHeader } from "@/components/ui/docs-header";
import { AlertBlock } from "@/components/ui/alert-block";
import { LastUpdated } from "@/components/ui/last-updated";
import {
  systemLifecycleDiagram,
  onboardingFlowDiagram,
  discoveryFlowDiagram,
  securityFlowDiagram,
  exchangeFlowDiagram,
  monitoringFlowDiagram,
  lifecyclePhases,
  flowComparison,
  keyConcepts,
  quickStartSteps,
} from "./data";

const phaseIcons: Record<string, React.ReactNode> = {
  UserPlus: <UserPlus className="h-6 w-6" />,
  Search: <Search className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  ArrowLeftRight: <ArrowLeftRight className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
};

const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  pink: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
};

const phaseDiagrams: Record<number, string> = {
  1: onboardingFlowDiagram,
  2: discoveryFlowDiagram,
  3: securityFlowDiagram,
  4: exchangeFlowDiagram,
  5: monitoringFlowDiagram,
};

const phaseFilenames: Record<number, string> = {
  1: "phase_1_onboarding.mmd",
  2: "phase_2_discovery.mmd",
  3: "phase_3_security.mmd",
  4: "phase_4_exchange.mmd",
  5: "phase_5_monitoring.mmd",
};

export default function SystemFlowPage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="System Flow"
        badgeColor="blue"
        title="System Flow Overview"
        description="Understand the complete lifecycle of participating in the WAH4PC Gateway—from initial registration to ongoing monitoring. This is the 'big picture' of how providers operate in the network."
      />

      {/* Introduction */}
      <section id="intro" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Introduction</h2>
        <p className="text-slate-600 leading-relaxed mb-6 text-lg">
          The WAH4PC Gateway enables healthcare providers to exchange FHIR data securely. 
          Before diving into individual API calls, it's important to understand the{" "}
          <strong className="text-slate-900">overall system flow</strong>—the lifecycle every provider goes through 
          to participate in the network.
        </p>

        <AlertBlock type="info" title="System Flow vs. Transaction Flow">
          <p className="mb-2">
            <strong>System Flow</strong> (this page) describes the <em>macro-level</em> lifecycle: 
            how you join the network, discover other providers, and maintain ongoing participation.
          </p>
          <p>
            <strong>Transaction Flow</strong> (see{" "}
            <Link href="/docs/flow" className="text-blue-600 underline hover:text-blue-800 font-medium">
              Transaction Flow
            </Link>
            ) describes the <em>micro-level</em> detail: what happens when you send a single 
            data request through the gateway.
          </p>
        </AlertBlock>
      </section>

      {/* System Lifecycle Overview */}
      <section id="lifecycle" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">The Provider Lifecycle</h2>
        <p className="mb-6 text-slate-600">
          Every provider goes through five phases. After initial onboarding, you continuously 
          cycle through discovery, authentication, exchange, and monitoring.
        </p>
        <DiagramContainer 
          chart={systemLifecycleDiagram} 
          title="Lifecycle Overview"
          filename="system_lifecycle.mmd"
        />
      </section>

      {/* Phase Breakdown */}
      <section id="phases" className="mb-16">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">Phase-by-Phase Breakdown</h2>
        
        <div className="space-y-12">
          {lifecyclePhases.map((phase) => {
            const colors = phaseColors[phase.color];
            return (
              <div
                key={phase.phase}
                className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden"
              >
                {/* Phase Header */}
                <div className="px-6 py-5 border-b border-slate-200/50 bg-white/80">
                  <div className="flex items-center gap-5">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.bg} ${colors.text} shadow-sm`}>
                      {phaseIcons[phase.icon]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>Phase {phase.phase}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{phase.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">{phase.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Phase Content */}
                <div className="p-6 sm:p-8">
                  <p className="text-slate-600 mb-6 text-lg">{phase.description}</p>
                  
                  {/* Steps */}
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">What Happens</h4>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {phase.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 bg-white/50 p-3 rounded-lg border border-slate-100">
                          <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${colors.text}`} />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Insight */}
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50/50 border border-amber-100 p-4 mb-8">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-amber-700 uppercase mb-1">Key Insight</span>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {phase.keyInsight}
                      </p>
                    </div>
                  </div>

                  {/* Phase Diagram */}
                  <div className="mt-6">
                    <DiagramContainer 
                      chart={phaseDiagrams[phase.phase]} 
                      filename={phaseFilenames[phase.phase]}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">System Flow vs. Transaction Flow</h2>
        <p className="mb-6 text-slate-600">
          Understanding the difference between these two concepts is crucial for proper integration:
        </p>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left font-bold text-slate-900 w-1/4">Aspect</th>
                <th className="px-6 py-4 text-left font-bold text-blue-700 bg-blue-50/50 w-1/3 border-l border-slate-200">System Flow</th>
                <th className="px-6 py-4 text-left font-bold text-orange-700 bg-orange-50/50 w-1/3 border-l border-slate-200">Transaction Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flowComparison.map((row) => (
                <tr key={row.aspect} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{row.aspect}</td>
                  <td className="px-6 py-4 text-slate-600 border-l border-slate-100">{row.systemFlow}</td>
                  <td className="px-6 py-4 text-slate-600 border-l border-slate-100">{row.transactionFlow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Key Concepts */}
      <section id="concepts" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Key Concepts</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {keyConcepts.map((concept) => (
            <div key={concept.term} className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-2">{concept.term}</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{concept.definition}</p>
              <div className="inline-block rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5">
                <code className="text-xs font-mono text-slate-700 font-medium">
                  {concept.example}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Quick Start Path</h2>
        <p className="mb-6 text-slate-600">
          Follow these steps to go from zero to your first data exchange:
        </p>

        <div className="space-y-4">
          {quickStartSteps.map((item, idx) => (
            <div key={item.step} className="group flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-200">
                {item.step}
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">{item.action}</span>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono border border-slate-200">
                    {item.endpoint}
                  </code>
                </div>
                <span className="text-sm font-medium text-slate-500">{item.result}</span>
              </div>
              {idx < quickStartSteps.length - 1 && (
                <div className="hidden lg:block px-2">
                  <ArrowRight className="h-5 w-5 text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section id="next-steps">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Ready to dive deeper?</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <Link
              href="/docs/integration"
              className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-green-300 hover:shadow-md transition-all"
            >
              <h3 className="font-bold text-slate-900 group-hover:text-green-700 transition-colors mb-2">
                Provider Integration →
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Step-by-step guide to implement the webhook endpoints your system needs.
              </p>
            </Link>
            <Link
              href="/docs/flow"
              className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <h3 className="font-bold text-slate-900 group-hover:text-orange-700 transition-colors mb-2">
                Transaction Flow →
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Deep dive into how individual requests move through the gateway.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <LastUpdated className="mt-12 pt-8 border-t border-slate-200" />
    </article>
  );
}

// System Flow Data - High-level ecosystem lifecycle documentation

// ============================================================================
// MERMAID DIAGRAMS
// ============================================================================

export const systemLifecycleDiagram = `
flowchart TB
    subgraph ONBOARD["Phase 1: Onboarding"]
        direction LR
        R1[New Provider] --> R2[Register with Gateway]
        R2 --> R3[Receive Provider ID]
        R3 --> R4[Generate API Key]
    end

    subgraph DISCOVER["Phase 2: Discovery"]
        direction LR
        D1[Query Provider Registry] --> D2[Find Target Provider]
        D2 --> D3[Get Target's baseUrl]
    end

    subgraph SECURE["Phase 3: Security"]
        direction LR
        S1[Include API Key] --> S2[Gateway Validates]
        S2 --> S3[Rate Limit Check]
        S3 --> S4[Request Authorized]
    end

    subgraph EXCHANGE["Phase 4: Data Exchange"]
        direction LR
        E1[Initiate Transaction] --> E2[Gateway Orchestrates]
        E2 --> E3[Target Processes]
        E3 --> E4[Data Delivered]
    end

    subgraph MONITOR["Phase 5: Monitoring"]
        direction LR
        M1[Track Transaction Status] --> M2[View Audit Logs]
        M2 --> M3[Monitor Health]
    end

    ONBOARD --> DISCOVER
    DISCOVER --> SECURE
    SECURE --> EXCHANGE
    EXCHANGE --> MONITOR
    MONITOR -.->|Continuous Operation| DISCOVER

    style ONBOARD fill:#dbeafe,stroke:#3b82f6
    style DISCOVER fill:#dcfce7,stroke:#22c55e
    style SECURE fill:#fef3c7,stroke:#f59e0b
    style EXCHANGE fill:#e0e7ff,stroke:#6366f1
    style MONITOR fill:#fce7f3,stroke:#ec4899
`;

export const onboardingFlowDiagram = `
sequenceDiagram
    participant P as New Provider
    participant A as System Admin
    participant GW as WAH4PC Gateway
    participant DB as Provider Registry

    rect rgb(219, 234, 254)
        Note over P,DB: Registration Process
        P->>A: Request Registration
        Note right of P: Provide details (name, url)
        A->>GW: Register Provider (Admin Tool)
        GW->>DB: Store Provider Record
        DB-->>GW: Provider ID Generated
        A-->>P: Provide Credentials
        Note left of P: Receive Provider ID & API Key
    end
`;

export const discoveryFlowDiagram = `
sequenceDiagram
    participant A as Provider A (Requester)
    participant GW as WAH4PC Gateway
    participant REG as Provider Registry

    rect rgb(220, 252, 231)
        Note over A,REG: Finding Other Providers
        A->>GW: GET /api/v1/providers
        GW->>REG: Query All Providers
        REG-->>GW: Provider List
        GW-->>A: 200 OK
        Note left of GW: [{id, name, type, baseUrl}, ...]
    end

    rect rgb(224, 231, 255)
        Note over A,REG: Getting Specific Provider
        A->>GW: GET /api/v1/providers/{targetId}
        GW->>REG: Lookup by ID
        REG-->>GW: Provider Details
        GW-->>A: 200 OK
        Note left of GW: {id, name, type, baseUrl}
    end
`;

export const securityFlowDiagram = `
sequenceDiagram
    participant C as Client Request
    participant MW as Auth Middleware
    participant RL as Rate Limiter
    participant H as Handler

    rect rgb(254, 243, 199)
        Note over C,H: Every Request Goes Through Security
        C->>MW: Request + X-API-Key Header
        MW->>MW: Validate API Key Format
        MW->>MW: Lookup Key in Database
        alt Key Invalid
            MW-->>C: 401 Unauthorized
        else Key Valid
            MW->>RL: Check Rate Limit
            alt Rate Exceeded
                RL-->>C: 429 Too Many Requests
            else Within Limit
                RL->>H: Forward Request
                H-->>C: Process & Respond
            end
        end
    end
`;

export const exchangeFlowDiagram = `
sequenceDiagram
    participant A as Provider A (Requester)
    participant GW as WAH4PC Gateway
    participant V as FHIR Validator
    participant B as Provider B (Target)

    rect rgb(224, 231, 255)
        Note over A,B: Data Exchange Orchestration
        A->>GW: POST /api/v1/fhir/request/{type}
        GW->>GW: Create Transaction (PENDING)
        GW->>B: POST /fhir/process-query
        B-->>GW: 200 OK (Acknowledged)
        GW-->>A: 202 Accepted (txn_id)
    end

    rect rgb(254, 252, 232)
        Note over A,B: Async Processing
        B->>B: Fetch & Prepare Data
    end

    rect rgb(220, 252, 231)
        Note over A,B: Data Delivery & Validation
        B->>GW: POST /api/v1/fhir/receive/{type}
        GW->>V: Validate FHIR Resource
        V-->>GW: Validation Result
        GW->>A: POST /fhir/receive-results
        A-->>GW: 200 OK
        GW-->>B: 200 OK
        GW->>GW: Transaction COMPLETED
    end
`;

export const monitoringFlowDiagram = `
sequenceDiagram
    participant P as Provider
    participant GW as WAH4PC Gateway
    participant TX as Transaction Store

    rect rgb(252, 231, 243)
        Note over P,TX: Status Tracking
        P->>GW: GET /api/v1/transactions/{id}
        GW->>TX: Lookup Transaction
        TX-->>GW: Transaction Data
        GW-->>P: 200 OK
        Note left of GW: {id, status, timestamps}
    end

    rect rgb(252, 231, 243)
        Note over P,TX: Listing All Transactions
        P->>GW: GET /api/v1/transactions
        GW->>TX: Query Transactions
        TX-->>GW: Transaction List
        GW-->>P: 200 OK
        Note left of GW: Filtered by requester/target
    end
`;

// ============================================================================
// PHASE DESCRIPTIONS
// ============================================================================

export const lifecyclePhases = [
  {
    phase: 1,
    title: "Onboarding",
    subtitle: "Join the Network",
    description: "Register your organization with the gateway and obtain credentials to participate in the healthcare data exchange network.",
    icon: "UserPlus",
    color: "blue",
    steps: [
      "Contact Administrator to register your organization",
      "Receive your unique Provider ID (UUID)",
      "Obtain your API Key for authentication",
      "Configure your webhook endpoints (baseUrl)",
    ],
    keyInsight: "Your Provider ID is your identity in the network. Your API Key proves you are who you claim to be.",
  },
  {
    phase: 2,
    title: "Discovery",
    subtitle: "Find Other Providers",
    description: "Query the provider registry to discover other healthcare organizations you can exchange data with.",
    icon: "Search",
    color: "green",
    steps: [
      "List all registered providers via GET /api/v1/providers",
      "Search by provider type (hospital, clinic, laboratory)",
      "Get specific provider details by ID",
      "Save target provider IDs for future requests",
    ],
    keyInsight: "The gateway acts as a directory. You don't need to know other providers' internal systems—just their ID.",
  },
  {
    phase: 3,
    title: "Security",
    subtitle: "Authenticate Every Request",
    description: "Every API call requires authentication. The gateway validates your API key and enforces rate limits to ensure fair usage.",
    icon: "Shield",
    color: "amber",
    steps: [
      "Include X-API-Key header in all requests",
      "Gateway validates key format and existence",
      "Rate limiter checks request frequency",
      "Authorized requests proceed to handlers",
    ],
    keyInsight: "Security is not optional. Requests without valid API keys are rejected immediately (401 Unauthorized).",
  },
  {
    phase: 4,
    title: "Data Exchange",
    subtitle: "Request & Receive FHIR Data",
    description: "The core functionality: request patient data from other providers and receive validated, compliant FHIR data via webhooks.",
    icon: "ArrowLeftRight",
    color: "indigo",
    steps: [
      "Initiate request via POST /api/v1/fhir/request/{resourceType}",
      "Gateway creates transaction and notifies target",
      "Target processes request and sends data to gateway",
      "Gateway validates data against PH Core FHIR profiles",
      "Valid data is delivered to your webhook endpoint",
    ],
    keyInsight: "Strict validation ensures only PH Core compliant FHIR data enters the network. Invalid resources are rejected with 422 errors.",
  },
  {
    phase: 5,
    title: "Monitoring",
    subtitle: "Track & Audit",
    description: "Monitor transaction status, view history, and maintain audit trails for compliance and debugging.",
    icon: "Activity",
    color: "pink",
    steps: [
      "Check transaction status via GET /api/v1/transactions/{id}",
      "List all your transactions (as requester or target)",
      "Review timestamps and status transitions",
      "Use transaction IDs for support inquiries",
    ],
    keyInsight: "Every action is logged. The transaction_id is your audit trail—keep it for compliance and debugging.",
  },
] as const;

// ============================================================================
// COMPARISON TABLE DATA
// ============================================================================

export const flowComparison = [
  {
    aspect: "Scope",
    systemFlow: "Entire ecosystem lifecycle (macro)",
    transactionFlow: "Single request/response cycle (micro)",
  },
  {
    aspect: "Focus",
    systemFlow: "How providers join, operate, and maintain participation",
    transactionFlow: "How a specific data request moves through the system",
  },
  {
    aspect: "Duration",
    systemFlow: "Ongoing (days/months/years)",
    transactionFlow: "Minutes to hours per transaction",
  },
  {
    aspect: "Key Concept",
    systemFlow: "Provider Identity & Trust",
    transactionFlow: "Transaction ID & Correlation",
  },
  {
    aspect: "Question Answered",
    systemFlow: '"How do I participate in the network?"',
    transactionFlow: '"What happens when I send a request?"',
  },
  {
    aspect: "Phases",
    systemFlow: "Onboard → Discover → Secure → Exchange → Monitor",
    transactionFlow: "Request → Acknowledge → Process → Callback → Complete",
  },
] as const;

// ============================================================================
// KEY CONCEPTS
// ============================================================================

export const keyConcepts = [
  {
    term: "Provider ID",
    definition: "A UUID that uniquely identifies your organization in the gateway. Obtained during registration.",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },
  {
    term: "API Key",
    definition: "A secret token used to authenticate requests. Prefixed with 'wah_' and must be kept secure.",
    example: "wah_a1b2c3d4e5f6g7h8i9j0...",
  },
  {
    term: "Base URL",
    definition: "Your webhook endpoint base. The gateway appends paths like /fhir/process-query to call your system.",
    example: "https://api.yourhospital.com",
  },
  {
    term: "Transaction",
    definition: "A single data exchange request. Has a unique ID and progresses through status states.",
    example: "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
] as const;

// ============================================================================
// QUICK START CHECKLIST
// ============================================================================

export const quickStartSteps = [
  {
    step: 1,
    action: "Register Provider",
    endpoint: "Admin Process",
    result: "Provider ID",
  },
  {
    step: 2,
    action: "Implement Webhooks",
    endpoint: "Your server",
    result: "/fhir/process-query & /fhir/receive-results",
  },
  {
    step: 3,
    action: "Discover Providers",
    endpoint: "GET /api/v1/providers",
    result: "List of target IDs",
  },
  {
    step: 4,
    action: "Request Data",
    endpoint: "POST /api/v1/fhir/request/{type}",
    result: "Transaction ID",
  },
] as const;