import { ArrowRight, Shield, Zap, Users, Database, Server, Activity, FileCode } from "lucide-react";
import Link from "next/link";
import { DocsHeader } from "@/components/ui/docs-header";
import { FeatureCard } from "@/components/ui/feature-card";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { DownloadDocsButton } from "@/components/ui/download-docs-button";

const flowDiagram = `sequenceDiagram
    participant A as Provider A<br/>(Source)
    participant G as Gateway<br/>(Hub)
    participant B as Provider B<br/>(Target)
    
    rect rgb(240, 248, 255)
    Note over A, G: 1. Initiation Phase
    A->>G: POST /transactions
    G->>G: Auth & Validation
    end
    
    rect rgb(255, 250, 240)
    Note over G, B: 2. Routing Phase
    G->>B: Forward Request
    B-->>G: Return FHIR Bundle
    end
    
    rect rgb(240, 255, 240)
    Note over G, A: 3. Delivery Phase
    G-->>A: Webhook Callback
    end`;

export default function DocsIntroductionPage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="Documentation"
        badgeColor="blue"
        title="WAH4PC Gateway"
        description="A centralized interoperability gateway enabling secure FHIR resource transfers between healthcare providers. Connect clinics, hospitals, laboratories, and pharmacies through a unified API."
        action={<DownloadDocsButton />}
      />

      {/* Key Features */}
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Core Capabilities</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Async Transaction Model"
            description="Non-blocking request/response flow with transaction tracking and status updates."
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Provider Validation"
            description="All providers must register before exchanging data. Sender verification on callbacks."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Multi-Provider Support"
            description="Supports clinics, hospitals, laboratories, and pharmacies with type-specific routing."
          />
          <FeatureCard
            icon={<Database className="h-5 w-5" />}
            title="Transaction Logging"
            description="Complete audit trail of all FHIR resource transfers with metadata and timestamps."
          />
        </div>
      </section>

      {/* System Architecture */}
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-5 w-5 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">System Architecture</h2>
        </div>
        
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
           <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6">
              <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                 <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-mono text-slate-500">transaction_flow.mmd</span>
                 </div>
                 <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                 </div>
              </div>
              <MermaidDiagram chart={flowDiagram} className="!border-0 !bg-transparent !shadow-none" />
           </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
           <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 font-bold text-blue-600 text-sm shadow-sm">1</div>
              <div>
                 <h4 className="font-semibold text-slate-900">Initiation</h4>
                 <p className="text-sm text-slate-600 mt-1">Provider A sends a request. Gateway returns a transaction ID immediately.</p>
              </div>
           </div>
           <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 font-bold text-blue-600 text-sm shadow-sm">2</div>
              <div>
                 <h4 className="font-semibold text-slate-900">Routing</h4>
                 <p className="text-sm text-slate-600 mt-1">Gateway resolves the target provider and forwards the secure payload.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <FileCode className="h-5 w-5 text-green-600" />
          <h2 className="text-2xl font-bold text-slate-900">Quick Start</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickLink
            href="/docs/architecture"
            title="System Architecture"
            description="Understand the components and data flow"
          />
          <QuickLink
            href="/docs/flow"
            title="Transaction Flow"
            description="Step-by-step walkthrough of the lifecycle"
          />
          <QuickLink
            href="/docs/integration"
            title="Provider Integration"
            description="Set up your endpoints and webhooks"
          />
          <QuickLink
            href="/docs/api"
            title="API Reference"
            description="Explore available endpoints and payloads"
          />
        </div>
      </section>

      {/* Supported FHIR Resources */}
      <section>
        <h2 className="mb-6 text-xl font-bold text-slate-900">Supported FHIR Resources</h2>
        <div className="flex flex-wrap gap-3">
          {["Patient", "Observation", "DiagnosticReport", "MedicationRequest", "Encounter", "Condition"].map(
            (resource) => (
              <span
                key={resource}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600 cursor-default"
              >
                {resource}
              </span>
            )
          )}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          The gateway supports any valid FHIR resource type defined in the R4 specification.
        </p>
      </section>
    </article>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-blue-400 hover:shadow-md"
    >
      <div>
        <h3 className="font-mono text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      <div className="mt-4 flex justify-end">
         <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
      </div>
    </Link>
  );
}