"use client";

import { Server, ArrowRightLeft, FileJson } from "lucide-react";
import { DocsHeader } from "@/components/ui/docs-header";
import { DiagramContainer } from "@/components/ui/diagram-container";
import { JsonViewer } from "@/components/ui/json-viewer";
import { AlertBlock } from "@/components/ui/alert-block";
import { DataTable } from "@/components/ui/data-table";
import {
  systemArchitectureDiagram,
  transactionFlowDiagram,
  transactionStatesDiagram,
  transactionStatesData,
  keyPoints,
  dataModels,
} from "./data";

export default function ArchitecturePage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="Architecture"
        badgeColor="purple"
        title="System Architecture"
        description="Understanding the data flow and transaction lifecycle of the WAH4PC Gateway."
      />

      {/* System Components */}
      <section id="components" className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Server className="h-5 w-5 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">System Components</h2>
        </div>
        <p className="mb-6 text-slate-600">
          The diagram below shows how healthcare providers interact with the gateway
          and how requests flow through the system.
        </p>
        <DiagramContainer 
          chart={systemArchitectureDiagram} 
          title="Component Interaction Model"
          filename="system_architecture.mmd"
        />
      </section>

      {/* Transaction Flow */}
      <section id="transaction-flow" className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <ArrowRightLeft className="h-5 w-5 text-green-600" />
          <h2 className="text-2xl font-bold text-slate-900">Transaction Flow</h2>
        </div>
        <p className="mb-6 text-slate-600">
          The gateway uses an asynchronous request/response model. When a provider
          requests data, the gateway orchestrates the entire flow without blocking.
        </p>
        <DiagramContainer 
          chart={transactionFlowDiagram} 
          title="Async Request/Response Cycle"
          filename="transaction_flow.mmd"
          className="mb-8"
        />

        <AlertBlock type="warning" title="Key Points">
          <ul className="space-y-1 list-disc list-inside text-sm">
            {keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </AlertBlock>
      </section>

      {/* Transaction States */}
      <section id="states" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Transaction States</h2>
        <p className="mb-6 text-slate-600">
          Each transaction progresses through a state machine. This enables status
          tracking and prevents duplicate processing.
        </p>
        <DiagramContainer 
          chart={transactionStatesDiagram} 
          title="State Machine Diagram"
          filename="states.mmd"
          className="mb-8"
        />

        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <DataTable
            columns={[
              {
                key: "status",
                header: "Status",
                render: (_value, row) => (
                  <span className={`rounded-md px-2 py-1 font-mono text-xs font-semibold ${row.statusColor}`}>
                    {row.status}
                  </span>
                ),
              },
              {
                key: "description",
                header: "Description",
                className: "text-slate-600",
              },
              {
                key: "nextStates",
                header: "Next States",
                className: "text-slate-500 font-mono text-xs",
              },
            ]}
            data={transactionStatesData}
          />
        </div>
      </section>

      {/* Data Models */}
      <section id="models">
        <div className="flex items-center gap-3 mb-6">
          <FileJson className="h-5 w-5 text-amber-600" />
          <h2 className="text-2xl font-bold text-slate-900">Data Models</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">{dataModels.provider.title}</h3>
              <div className="flex gap-2">
                {dataModels.provider.types.map((type) => (
                  <span key={type} className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <JsonViewer 
              data={dataModels.provider.code} 
              title="Provider Struct"
            />
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">{dataModels.transaction.title}</h3>
            <JsonViewer 
              data={dataModels.transaction.code} 
              title="Transaction Struct"
            />
          </div>
        </div>
      </section>
    </article>
  );
}

// Mermaid diagrams for Architecture page

export const systemArchitectureDiagram = `
sequenceDiagram
    participant P1 as Hospital A (Requester)
    participant GW as WAH4PC Gateway
    participant V as FHIR Validator
    participant P2 as Laboratory B (Target)

    rect rgb(240, 249, 255)
        Note over P1,P2: Provider Request Flow
        P1->>GW: POST /api/v1/fhir/request/Patient
        GW->>GW: Validate Providers
        GW->>GW: Create Transaction
        GW->>P2: POST /fhir/process-query
        P2-->>GW: 200 OK
        GW-->>P1: 202 Accepted (Transaction ID)
    end

    rect rgb(240, 253, 244)
        Note over P1,P2: Provider Response Flow
        P2->>GW: POST /api/v1/fhir/receive/Patient
        GW->>V: POST /validateResource
        V-->>GW: Validation Result
        alt Valid Resource
            GW->>GW: Update Transaction Status
            GW->>P1: POST /fhir/receive-results
            P1-->>GW: 200 OK
            GW-->>P2: 200 OK
        else Invalid Resource
            GW-->>P2: 422 Unprocessable Entity
        end
    end
`;

export const transactionFlowDiagram = `
sequenceDiagram
    participant R as Requester (Hospital A)
    participant G as Gateway
    participant V as Validator
    participant T as Target (Lab B)

    rect rgb(240, 249, 255)
        Note over R,T: Phase 1 - Query Initiation
        R->>+G: POST /api/v1/fhir/request/Patient
        G->>G: Validate Providers
        G->>G: Create Transaction (PENDING)
        G->>+T: POST /fhir/process-query
        T-->>-G: 200 OK (Acknowledged)
        G-->>-R: 202 Accepted (Transaction ID)
    end

    rect rgb(254, 252, 232)
        Note over R,T: Phase 2 - Async Data Processing
        T->>T: Fetch Patient Data
        T->>T: Prepare FHIR Bundle
    end

    rect rgb(240, 253, 244)
        Note over R,T: Phase 3 - Data Relay
        T->>+G: POST /api/v1/fhir/receive/Patient
        G->>V: Validate FHIR Resource
        V-->>G: Validation Result
        G->>G: Update Status (RECEIVED)
        G->>+R: POST /fhir/receive-results
        R-->>-G: 200 OK (Data Received)
        G->>G: Update Status (COMPLETED)
        G-->>-T: 200 OK
    end
`;

export const transactionStatesDiagram = `
sequenceDiagram
    participant TX as Transaction
    participant S as Status

    rect rgb(254, 252, 232)
        Note over TX,S: State Transitions
        TX->>S: Transaction Created
        S->>S: Status = PENDING
    end

    alt Target sends data successfully
        rect rgb(240, 249, 255)
            TX->>S: Target responds
            S->>S: Status = RECEIVED
        end
        alt Requester acknowledges
            rect rgb(240, 253, 244)
                TX->>S: Requester confirms
                S->>S: Status = COMPLETED
            end
        else Requester unreachable
            rect rgb(254, 242, 242)
                TX->>S: Delivery failed
                S->>S: Status = FAILED
            end
        end
    else Target unreachable
        rect rgb(254, 242, 242)
            TX->>S: Forward failed
            S->>S: Status = FAILED
        end
    end
`;

// Static data for tables and cards

export interface TransactionStateData {
  status: string;
  statusColor: string;
  description: string;
  nextStates: string;
  [key: string]: unknown;
}

export const transactionStatesData: TransactionStateData[] = [
  {
    status: "PENDING",
    statusColor: "bg-yellow-100 text-yellow-800",
    description: "Request sent to target, awaiting response",
    nextStates: "RECEIVED, FAILED",
  },
  {
    status: "RECEIVED",
    statusColor: "bg-blue-100 text-blue-800",
    description: "Target sent data, relaying to requester",
    nextStates: "COMPLETED, FAILED",
  },
  {
    status: "COMPLETED",
    statusColor: "bg-green-100 text-green-800",
    description: "Requester acknowledged receipt",
    nextStates: "-",
  },
  {
    status: "FAILED",
    statusColor: "bg-red-100 text-red-800",
    description: "Provider unreachable or error occurred",
    nextStates: "-",
  },
];

export const keyPoints = [
  "The requester receives a transaction ID immediately (202 Accepted)",
  "Data processing happens asynchronously at the target",
  "The gateway acts as a relay, never storing FHIR data",
  "Transaction status is tracked throughout the lifecycle",
] as const;

export const dataModels = {
  provider: {
    title: "Provider",
    code: `{
  "id": "uuid",
  "name": "City Hospital",
  "type": "hospital",
  "baseUrl": "https://api.cityhospital.com",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}`,
    types: ["clinic", "hospital", "laboratory", "pharmacy"],
  },
  transaction: {
    title: "Transaction",
    code: `{
  "id": "uuid",
  "requesterId": "provider-uuid",
  "targetId": "provider-uuid",
  "patientId": "patient-123",
  "resourceType": "Patient",
  "status": "PENDING",
  "metadata": {
    "reason": "Referral",
    "notes": "Urgent"
  },
  "createdAt": "...",
  "updatedAt": "..."
}`,
  },
} as const;