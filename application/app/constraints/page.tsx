"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDownUp, CheckCircle2, LoaderCircle, Radio, RotateCcw, ShieldCheck } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const INGESTION_URL = `${API_BASE_URL}/api/v1/continuous-learning/sync-and-learn`;
const STALE_EVENT_TIME = "2026-11-05T10:00:00Z";

type ApiReply = {
  status: number;
  ok: boolean;
  body: unknown;
};

type Arrival = {
  source: "Source A" | "Source B";
  kwh: number;
  reply: ApiReply;
};

type AttackCase =
  | "missing_field"
  | "invalid_timestamp"
  | "negative_value"
  | "unrealistic_value"
  | "unexpected_unicode"
  | "unknown_field"
  | "wrong_type"
  | "malformed_csv"
  | "malformed_json";

const ATTACK_CASES: { id: AttackCase; label: string; description: string }[] = [
  { id: "missing_field", label: "Missing required field", description: "The second row has no kWh measurement." },
  { id: "invalid_timestamp", label: "Invalid timestamp", description: "The second row uses text where an ISO 8601 timestamp is expected." },
  { id: "negative_value", label: "Negative measurement", description: "The second row reports negative energy use." },
  { id: "unrealistic_value", label: "Out-of-range measurement", description: "The second row exceeds the allowed kWh input bound." },
  { id: "unexpected_unicode", label: "Unexpected Unicode", description: "The second row contains a hidden directional control character in its ID." },
  { id: "unknown_field", label: "Unexpected field", description: "The second row includes a field outside the energy schema." },
  { id: "wrong_type", label: "Unexpected data type", description: "The second row sends kWh as text instead of a number." },
  { id: "malformed_csv", label: "Malformed CSV", description: "The batch has an unclosed quoted field." },
  { id: "malformed_json", label: "Malformed JSON", description: "The request body ends before the JSON array is complete." },
];

async function postTelemetry(body: unknown, rawBody?: string): Promise<ApiReply> {
  const response = await fetch(INGESTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody ?? JSON.stringify(body),
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = { message: "The server returned a non-JSON response." };
  }
  return { status: response.status, ok: response.ok, body: payload };
}

function responseDetail(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const outer = body as Record<string, unknown>;
  const detail = outer.detail;
  return detail && typeof detail === "object" && !Array.isArray(detail)
    ? detail as Record<string, unknown>
    : outer;
}

function errorSummary(body: unknown): string {
  const detail = responseDetail(body);
  const errors = Array.isArray(detail.errors) ? detail.errors : [];
  const messages = errors.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const rowLabel = typeof row.row === "number" ? `Row ${row.row}` : "Request";
    const field = typeof row.field === "string" ? row.field : "input";
    const message = typeof row.message === "string" ? row.message : "Rejected by validation.";
    return [`${rowLabel} · ${field}: ${message}`];
  });
  const summary = typeof detail.message === "string" ? detail.message : "The API rejected the batch.";
  return [summary, ...messages].join("\n");
}

function validationPayload(kind: AttackCase, facilityType: string): { body?: unknown; rawBody?: string } {
  if (kind === "malformed_json") {
    return {
      rawBody: `{"facility_type":"${facilityType}","domain":"energy","records":[`,
    };
  }

  if (kind === "malformed_csv") {
    return {
      body: {
        facility_type: facilityType,
        domain: "energy",
        csv_data: "timestamp,entity_id,kwh\n2026-11-05T10:00:00Z,demo-valid,8\n2026-11-05T11:00:00Z,demo-bad,\"12",
      },
    };
  }

  const good = {
    timestamp: STALE_EVENT_TIME,
    entity_id: `constraint-4-good-${Date.now()}`,
    kwh: 8,
  };
  const bad: Record<string, unknown> = {
    timestamp: STALE_EVENT_TIME,
    entity_id: `constraint-4-bad-${Date.now()}`,
    kwh: 12,
  };

  switch (kind) {
    case "missing_field":
      delete bad.kwh;
      break;
    case "invalid_timestamp":
      bad.timestamp = "last Tuesday";
      break;
    case "negative_value":
      bad.kwh = -12;
      break;
    case "unrealistic_value":
      bad.kwh = 1_000_001;
      break;
    case "unexpected_unicode":
      bad.entity_id = "meter-\u202e-hidden";
      break;
    case "unknown_field":
      bad.unexpected_sensor = "unrecognized";
      break;
    case "wrong_type":
      bad.kwh = "twelve";
      break;
  }

  return {
    body: {
      facility_type: facilityType,
      domain: "energy",
      records: [good, bad],
      operator_note: "Constraint 4 input-validation demonstration",
    },
  };
}

export default function ConstraintsDemoPage() {
  const [sourceAValue, setSourceAValue] = useState("940");
  const [sourceBValue, setSourceBValue] = useState("720");
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [conflictBusy, setConflictBusy] = useState(false);
  const [conflictError, setConflictError] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [resolvedConflict, setResolvedConflict] = useState("");
  const [attackCase, setAttackCase] = useState<AttackCase>("invalid_timestamp");
  const [attackBusy, setAttackBusy] = useState(false);
  const [attackReply, setAttackReply] = useState<ApiReply | null>(null);
  const [attackError, setAttackError] = useState("");

  const activeCase = ATTACK_CASES.find((item) => item.id === attackCase) ?? ATTACK_CASES[1];

  async function sendArrival(source: Arrival["source"], value: string) {
    setConflictBusy(true);
    setConflictError("");
    try {
      const kwh = Number(value);
      if (!Number.isFinite(kwh) || kwh < 0 || kwh > 1_000_000) {
        throw new Error("Enter a kWh value between 0 and 1,000,000.");
      }

      let entityId = arrivals[0]?.reply.ok
        ? (responseDetail(arrivals[0].reply.body).demo_entity_id as string | undefined)
        : undefined;
      if (!entityId) entityId = `constraint-2-demo-${Date.now()}`;

      const reply = await postTelemetry({
        facility_type: "engineering_college",
        domain: "energy",
        records: [{ timestamp: STALE_EVENT_TIME, entity_id: entityId, kwh }],
        operator_note: `Constraint 2 demo: ${source}`,
      });
      if (!reply.ok) throw new Error(`API returned ${reply.status}: ${errorSummary(reply.body)}`);

      const recordedReply = {
        ...reply,
        body: {
          ...(responseDetail(reply.body)),
          demo_entity_id: entityId,
        },
      };
      setArrivals((current) => [...current.filter((arrival) => arrival.source !== source), { source, kwh, reply: recordedReply }]);
      setResolvedConflict("");
    } catch (error) {
      setConflictError(error instanceof Error ? error.message : "Could not reach the telemetry API.");
    } finally {
      setConflictBusy(false);
    }
  }

  async function resolveConflict(selectedSource: "Source A" | "Source B") {
    const conflict = (responseDetail(sourceB?.reply.body).conflicts as Array<{ conflict_id?: string }> | undefined)?.[0];
    if (!conflict?.conflict_id || reviewReason.trim().length < 5) return;
    setConflictBusy(true);
    setConflictError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/telemetry/conflicts/${conflict.conflict_id}/resolve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_source: selectedSource, reason: reviewReason.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.detail === "string" ? result.detail : "Could not resolve conflict.");
      setResolvedConflict(`${result.selected_source} accepted. Review reason recorded; the conflict flag is cleared.`);
    } catch (error) {
      setConflictError(error instanceof Error ? error.message : "Could not resolve conflict.");
    } finally { setConflictBusy(false); }
  }

  async function runValidationDemo() {
    setAttackBusy(true);
    setAttackReply(null);
    setAttackError("");
    try {
      const payload = validationPayload(attackCase, "engineering_college");
      const reply = await postTelemetry(payload.body, payload.rawBody);
      setAttackReply(reply);
    } catch (error) {
      setAttackError(error instanceof Error ? error.message : "Could not reach the telemetry API.");
    } finally {
      setAttackBusy(false);
    }
  }

  function resetConflictDemo() {
    setArrivals([]);
    setConflictError("");
  }

  const sourceA = arrivals.find((arrival) => arrival.source === "Source A");
  const sourceB = arrivals.find((arrival) => arrival.source === "Source B");
  const hostileRejected = attackReply?.status === 422 && responseDetail(attackReply.body).accepted === 0;

  return (
    <main className="min-h-screen bg-[#080b12] px-4 py-8 text-slate-100 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="mb-4 inline-flex text-sm font-semibold text-orange-300 hover:text-orange-200">← CampusPulse AI</Link>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Live website demonstration</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Two telemetry constraints</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              These demos submit real requests to the telemetry API. The readings are synthetic, and the page never controls campus equipment.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 sm:self-auto">
            <Radio className="h-4 w-4" /> API-backed demo
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-orange-300/20 bg-[#111722] p-5 shadow-xl shadow-black/20 sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-orange-400/10 p-3 text-orange-300"><ArrowDownUp className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Constraint 2</p>
                <h2 className="mt-1 text-xl font-bold">Flag conflicts for review</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Two sources send different readings for the same meter and event time. Arrival order is recorded, but does not decide which reading is true.</p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <p><span className="text-slate-400">Same record key:</span> energy meter, same event timestamp</p>
              <p className="mt-1"><span className="text-slate-400">Event timestamp:</span> <code className="text-amber-200">{STALE_EVENT_TIME}</code> <span className="text-slate-500">(stale sample)</span></p>
              <p className="mt-1 text-xs text-slate-400">The API records arrival time and marks this event timestamp as stale. A later arrival alone cannot resolve the disagreement.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block rounded-2xl border border-white/10 p-4">
                <span className="text-sm font-bold">Source A · first arrival</span>
                <span className="mt-1 block text-xs text-slate-400">A plausible reading from the first feed.</span>
                <span className="mt-3 flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2">
                  <input aria-label="Source A kWh reading" type="number" min="0" max="1000000" step="0.1" value={sourceAValue} onChange={(event) => setSourceAValue(event.target.value)} className="w-full bg-transparent text-lg font-bold outline-none" />
                  <span className="text-xs text-slate-400">kWh</span>
                </span>
              </label>
              <label className="block rounded-2xl border border-white/10 p-4">
                <span className="text-sm font-bold">Source B · later arrival</span>
                <span className="mt-1 block text-xs text-slate-400">Conflicting value for that same event.</span>
                <span className="mt-3 flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2">
                  <input aria-label="Source B kWh reading" type="number" min="0" max="1000000" step="0.1" value={sourceBValue} onChange={(event) => setSourceBValue(event.target.value)} className="w-full bg-transparent text-lg font-bold outline-none" />
                  <span className="text-xs text-slate-400">kWh</span>
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => void sendArrival("Source A", sourceAValue)} disabled={conflictBusy || Boolean(sourceA)} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50">
                {conflictBusy && !sourceA ? "Sending…" : "1 · Send Source A"}
              </button>
              <button type="button" onClick={() => void sendArrival("Source B", sourceBValue)} disabled={conflictBusy || !sourceA || Boolean(sourceB)} className="rounded-xl border border-orange-300/30 px-4 py-2.5 text-sm font-bold text-orange-100 hover:bg-orange-300/10 disabled:cursor-not-allowed disabled:opacity-40">
                {conflictBusy && sourceA ? "Sending…" : "2 · Send Source B"}
              </button>
              <button type="button" onClick={resetConflictDemo} disabled={conflictBusy} aria-label="Reset conflict demo" className="rounded-xl border border-white/10 px-3 py-2.5 text-slate-300 hover:bg-white/5 disabled:opacity-40">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {arrivals.length > 0 && (
              <div aria-live="polite" className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-3 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400"><span>Arrival</span><span>Reading</span><span>API result</span></div>
                {arrivals.map((arrival, index) => (
                  <div key={arrival.source} className={`grid grid-cols-3 items-center border-t border-white/10 px-4 py-3 text-sm ${arrival.source === "Source B" && sourceB ? "bg-emerald-400/10" : ""}`}>
                    <span>{index + 1} · {arrival.source}</span>
                    <span className="font-bold">{arrival.kwh} kWh</span>
                    <span className="text-xs text-slate-300">{arrival.reply.status} · {String(responseDetail(arrival.reply.body).duplicates ?? 0)} duplicate · {String(responseDetail(arrival.reply.body).accepted ?? 0)} accepted</span>
                  </div>
                ))}
                {sourceB && !resolvedConflict && (
                  <div className="flex items-start gap-2 border-t border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Conflict detected in <strong>{String((responseDetail(sourceB.reply.body).conflicts as Array<{ fields?: string[] }> | undefined)?.[0]?.fields?.join(", ") ?? "telemetry values")}</strong>. Source A remains stored at <strong>{sourceA?.kwh} kWh</strong>; Source B&apos;s <strong>{sourceB.kwh} kWh</strong> reading was held for review. Arrival order did not decide the truth.</p>
                  </div>
                )}
                {sourceB && !resolvedConflict && <div className="border-t border-white/10 p-4">
                  <label htmlFor="review-reason" className="text-sm font-semibold">Offline verification reason</label>
                  <textarea id="review-reason" value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} maxLength={500} placeholder="Explain what you checked and why this source is more reliable…" className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm outline-none focus:border-amber-300/50" />
                  <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={conflictBusy || reviewReason.trim().length < 5} onClick={() => void resolveConflict("Source A")} className="rounded-xl border border-white/20 px-3 py-2 text-sm font-bold disabled:opacity-40">Accept Source A · {sourceA?.kwh} kWh</button><button type="button" disabled={conflictBusy || reviewReason.trim().length < 5} onClick={() => void resolveConflict("Source B")} className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Accept Source B · {sourceB?.kwh} kWh</button></div>
                </div>}
                {resolvedConflict && <p className="border-t border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{resolvedConflict}</p>}
              </div>
            )}
            {conflictError && <p role="alert" className="mt-4 whitespace-pre-wrap rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-200">{conflictError}</p>}
            <p className="mt-4 text-xs leading-5 text-slate-500">{resolvedConflict ? "The reviewer’s decision and reason are recorded; the conflict is no longer pending." : "The API retains the incumbent reading and returns conflict details for review."} This is synthetic demo data in the running API’s in-memory telemetry store.</p>
          </section>

          <section className="rounded-3xl border border-sky-300/20 bg-[#111722] p-5 shadow-xl shadow-black/20 sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-sky-400/10 p-3 text-sky-300"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">Constraint 4</p>
                <h2 className="mt-1 text-xl font-bold">Reject hostile input</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Send one valid row with one intentionally bad row. The server should reject the entire batch and leave the valid row unapplied.</p>
              </div>
            </div>

            <label className="block text-sm font-semibold" htmlFor="hostile-case">Choose an input problem to demonstrate</label>
            <select id="hostile-case" value={attackCase} onChange={(event) => { setAttackCase(event.target.value as AttackCase); setAttackReply(null); setAttackError(""); }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1019] px-3 py-3 text-sm text-white outline-none focus:border-sky-300/60">
              {ATTACK_CASES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <p className="mt-2 min-h-10 text-sm text-slate-400">{activeCase.description}</p>

            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>This sends a deliberately invalid test batch to the connected demo API. It does not touch real sensors or equipment.</p>
              </div>
            </div>

            <button type="button" onClick={() => void runValidationDemo()} disabled={attackBusy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-300 disabled:cursor-wait disabled:opacity-60">
              {attackBusy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending test batch…</> : "Send invalid test batch"}
            </button>

            {attackReply && (
              <div aria-live="polite" className={`mt-5 rounded-2xl border p-4 ${hostileRejected ? "border-emerald-300/20 bg-emerald-400/10" : "border-rose-300/20 bg-rose-400/10"}`}>
                <div className="flex items-center gap-2 font-bold">
                  {hostileRejected ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-rose-300" />}
                  <span>{hostileRejected ? "Rejected safely · no rows applied" : `Unexpected result · HTTP ${attackReply.status}`}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">HTTP {attackReply.status} · accepted {String(responseDetail(attackReply.body).accepted ?? "—")} · rejected {String(responseDetail(attackReply.body).rejected ?? "—")}</p>
                <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs leading-5 text-slate-300">{errorSummary(attackReply.body)}</pre>
                <p className="mt-3 text-xs text-slate-400">The API returns field-level errors without echoing the submitted values.</p>
              </div>
            )}
            {attackError && <p role="alert" className="mt-4 whitespace-pre-wrap rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-200">{attackError}</p>}
          </section>
        </div>

        <footer className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-6 text-slate-400">
          <strong className="text-slate-200">What is enforced:</strong> domain schemas, required fields, printable IDs, timestamp policy, finite numeric values and bounds, CSV/JSON shape, and request size and row limits. Every check runs again on the server; invalid batches fail as a unit.
        </footer>
      </div>
    </main>
  );
}
