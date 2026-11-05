"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ps6Api,
  type Ps6AuditRecord,
  type Ps6Comparison,
  type Ps6Recommendation,
  type Ps6Room,
  type Ps6Schedule,
  type Ps6Intelligence,
  type Ps6Settings,
} from "../lib/ps6Api";

interface Ps6Data {
  rooms: Ps6Room[];
  schedules: Ps6Schedule[];
  comparisons: Ps6Comparison[];
  recommendations: Ps6Recommendation[];
  savingsLabel: string;
  audit: Ps6AuditRecord[];
  intelligence: Ps6Intelligence;
  settings: Ps6Settings;
}

async function loadAll(): Promise<Ps6Data> {
  // Recommendations are generated from room state, so request them first, then the dependent views.
  const [rooms, recs] = await Promise.all([ps6Api.rooms(), ps6Api.recommendations()]);
  const [timetable, comparison, audit, intelligence, settings] = await Promise.all([
    ps6Api.timetable(),
    ps6Api.comparison(),
    ps6Api.audit(),
    ps6Api.intelligence(),
    ps6Api.settings(),
  ]);
  return {
    rooms: rooms.rooms,
    schedules: timetable.schedules,
    comparisons: comparison.comparisons,
    recommendations: recs.recommendations,
    savingsLabel: recs.estimated_savings_label,
    audit: audit.records,
    intelligence,
    settings,
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

const card = "rounded-lg border border-slate-300 bg-white p-4 text-slate-900 shadow-sm";
const btn =
  "rounded px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40";

function Badge({ children, tone }: { children: string; tone: "amber" | "green" | "red" | "slate" | "blue" }) {
  const tones = {
    amber: "bg-amber-100 text-amber-900",
    green: "bg-green-100 text-green-900",
    red: "bg-red-100 text-red-900",
    slate: "bg-slate-200 text-slate-800",
    blue: "bg-blue-100 text-blue-900",
  } as const;
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function statusTone(status: Ps6Recommendation["status"]): "amber" | "green" | "red" | "blue" {
  if (status === "PENDING") return "amber";
  if (status === "APPROVED") return "blue";
  if (status === "REJECTED") return "red";
  return "green";
}

export default function Ps6Page() {
  const [data, setData] = useState<Ps6Data | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actor, setActor] = useState("");
  const [building, setBuilding] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAll()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const actorName = actor.trim();

  async function act(id: string, work: () => Promise<string>) {
    setBusyId(id);
    setActionError(null);
    setNotice(null);
    try {
      setNotice(await work());
      refresh();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const buildings = useMemo(() => {
    const seen = new Map<string, string>();
    (data?.rooms ?? []).forEach((r) => seen.set(r.building_id, r.building_name));
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [data]);

  const visibleRooms = useMemo(
    () => (data?.rooms ?? []).filter((r) => building === "all" || r.building_id === building),
    [data, building],
  );

  const overview = useMemo(() => {
    const rooms = data?.rooms ?? [];
    const recs = data?.recommendations ?? [];
    return {
      rooms: rooms.length,
      occupied: rooms.filter((r) => r.occupancy_count > 0).length,
      totalKwh: rooms.reduce((sum, r) => sum + r.power_kwh, 0),
      pending: recs.filter((r) => r.status === "PENDING").length,
      pendingSavings: recs.filter((r) => r.status === "PENDING").reduce((sum, r) => sum + r.savings_kwh, 0),
    };
  }, [data]);

  const comparisonBySchedule = useMemo(() => {
    const map = new Map<string, Ps6Comparison>();
    (data?.comparisons ?? []).forEach((c) => map.set(c.schedule.id, c));
    return map;
  }, [data]);

  async function onCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const roomId = String(values.get("room_id") ?? "");
    const room = data?.rooms.find((r) => r.room_id === roomId);
    if (!room || !actorName) {
      setActionError("Choose a room and enter your name before saving a schedule.");
      return;
    }
    await act("schedule-form", async () => {
      await ps6Api.saveSchedule({
        building_id: room.building_id,
        room_id: room.room_id,
        starts_at: String(values.get("starts_at") ?? ""),
        ends_at: String(values.get("ends_at") ?? ""),
        expected_occupancy: Number(values.get("expected_occupancy") ?? 0),
        title: String(values.get("title") ?? ""),
        actor: actorName,
      });
      form.reset();
      return "Schedule saved.";
    });
  }

  async function onSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    await act("settings", async () => {
      await ps6Api.updateSettings({
        idle_load_kwh: Number(values.get("idle_load_kwh")),
        saving_fraction: Number(values.get("saving_fraction")) / 100,
        tariff_inr: Number(values.get("tariff_inr")),
        comfort_min_c: Number(values.get("comfort_min_c")),
        actor: actorName,
      });
      return "Operating settings saved. Protected equipment remains excluded.";
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">CAMPUSPULSE AI — PS6 Occupancy-Aware Energy Workflow</h1>
          <div role="note" className="rounded border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">
            <strong>SIMULATED DEMONSTRATION.</strong> Room readings are synthetic. Savings are{" "}
            <strong>estimated</strong>, not measured. Approving and executing a recommendation changes only a
            simulated state in the local database; no real building equipment is controlled.
          </div>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Acting as (required to approve, reject, execute or edit):</span>
            <input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="e.g. facility-manager"
              maxLength={120}
              className="rounded border border-slate-400 bg-white px-2 py-1 text-slate-900"
            />
          </label>
        </header>

        {loadError && (
          <div role="alert" className="rounded border border-red-400 bg-red-50 p-3 text-sm text-red-900">
            Could not load PS6 data: {loadError}. Is the backend running (see SETUP_GUIDE.md)?{" "}
            <button className="underline" onClick={refresh}>
              Retry
            </button>
          </div>
        )}
        {actionError && (
          <div role="alert" className="rounded border border-red-400 bg-red-50 p-3 text-sm text-red-900">
            {actionError}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded border border-green-400 bg-green-50 p-3 text-sm text-green-900">
            {notice}
          </div>
        )}

        {!data && !loadError && <p>Loading simulated campus data…</p>}

        {data && (
          <>
            <section aria-labelledby="overview" className="space-y-2">
              <h2 id="overview" className="text-xl font-semibold">
                1. Executive overview <Badge tone="slate">SIMULATED</Badge>
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className={card}>
                  <div className="text-xs text-slate-600">Rooms monitored</div>
                  <div className="text-2xl font-bold">{overview.rooms}</div>
                </div>
                <div className={card}>
                  <div className="text-xs text-slate-600">Rooms occupied now</div>
                  <div className="text-2xl font-bold">{overview.occupied}</div>
                </div>
                <div className={card}>
                  <div className="text-xs text-slate-600">Simulated load (kWh/h)</div>
                  <div className="text-2xl font-bold">{overview.totalKwh.toFixed(1)}</div>
                </div>
                <div className={card}>
                  <div className="text-xs text-slate-600">Pending proposals · est. kWh/h saved</div>
                  <div className="text-2xl font-bold">
                    {overview.pending} · {overview.pendingSavings.toFixed(2)}
                  </div>
                  <Badge tone="amber">ESTIMATED</Badge>
                </div>
              </div>
            </section>

            <section aria-labelledby="intelligence" className="space-y-2">
              <h2 id="intelligence" className="text-xl font-semibold">Simulated anomaly checks &amp; scheduled peak estimate <Badge tone="slate">RULE-BASED</Badge></h2>
              <p className="text-sm text-slate-700">{data.intelligence.method}. These demo checks are not equipment diagnoses.</p>
              <div className={card}><strong>Highest scheduled load estimate:</strong>{" "}{data.intelligence.estimated_peak_kwh_per_hour === null ? "No scheduled events yet" : `${data.intelligence.estimated_peak_kwh_per_hour} kWh/h`}</div>
              <div className={card}>
                <h3 className="font-semibold">Potential unusual-load records ({data.intelligence.anomalies.length})</h3>
                {data.intelligence.anomalies.length === 0 ? <p>No room matched the configured demo rules.</p> : <ul className="list-disc pl-5 text-sm">{data.intelligence.anomalies.map((item) => <li key={item.room_id}><strong>{item.room_id}</strong> · {item.load_kwh_per_hour} kWh/h · {item.message}</li>)}</ul>}
              </div>
            </section>

            <section aria-labelledby="settings" className="space-y-2">
              <h2 id="settings" className="text-xl font-semibold">Configurable operating constraints</h2>
              <p className="text-sm">Demo assumptions only. Safety-critical and essential equipment remains protected.</p>
              <form onSubmit={onSaveSettings} className={`${card} grid gap-3 md:grid-cols-5`}>
                <label className="text-sm">Idle threshold (kWh/h)<input name="idle_load_kwh" type="number" min="0.5" max="20" step="0.1" required defaultValue={data.settings.idle_load_kwh} className="mt-1 block w-full rounded border p-2" /></label>
                <label className="text-sm">Estimated reduction (%)<input name="saving_fraction" type="number" min="5" max="40" step="1" required defaultValue={Math.round(data.settings.saving_fraction * 100)} className="mt-1 block w-full rounded border p-2" /></label>
                <label className="text-sm">Assumed tariff (₹/kWh)<input name="tariff_inr" type="number" min="0.1" max="100" step="0.1" required defaultValue={data.settings.tariff_inr} className="mt-1 block w-full rounded border p-2" /></label>
                <label className="text-sm">Comfort floor (°C)<input name="comfort_min_c" type="number" min="18" max="26" step="0.5" required defaultValue={data.settings.comfort_min_c} className="mt-1 block w-full rounded border p-2" /></label>
                <button className={`${btn} self-end bg-slate-800 text-white`} disabled={!actorName || busyId === "settings"}>Save constraints</button>
              </form>
            </section>

            <section aria-labelledby="recs" className="space-y-2">
              <h2 id="recs" className="text-xl font-semibold">
                2. Recommendations, approval &amp; simulation
              </h2>
              <p className="text-sm text-slate-700">{data.savingsLabel}</p>
              {data.recommendations.length === 0 && (
                <p className={card}>No eligible empty, high-load rooms right now.</p>
              )}
              {data.recommendations.map((rec) => {
                const busy = busyId === rec.id;
                return (
                  <article key={rec.id} className={`${card} space-y-3`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{rec.room_id}</h3>
                      <Badge tone={statusTone(rec.status)}>{rec.status}</Badge>
                      <Badge tone="amber">ESTIMATED</Badge>
                    </div>
                    <p className="text-sm">
                      <strong>Why:</strong> room is empty ({rec.assumptions.occupancy} occupants) while drawing{" "}
                      {rec.baseline_kwh} kWh/h (simulated). <strong>Proposed:</strong> {rec.safety_validation.action}.
                    </p>
                    <dl className="grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <dt className="font-medium">Estimated before → after (kWh/h)</dt>
                        <dd>
                          {rec.baseline_kwh} → {rec.simulated_after_kwh ?? rec.proposed_kwh}{" "}
                          {rec.simulated_after_kwh === null ? "(proposed)" : "(simulated result, not measured)"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">Estimated saving</dt>
                        <dd>
                          {rec.savings_kwh} kWh/h ≈ ₹{rec.savings_inr}/h
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">Assumptions</dt>
                        <dd>
                          {rec.assumptions.basis}; tariff ₹{rec.assumptions.tariff_inr_per_kwh}/kWh; data is{" "}
                          {rec.assumptions.measurement}; comfort floor {rec.safety_validation.comfort_min_c}°C.
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">Equipment affected / protected (excluded)</dt>
                        <dd>
                          {rec.affected_equipment.join(", ")} /{" "}
                          <span className="font-semibold text-red-800">
                            {rec.safety_validation.excluded_protected_equipment.join(", ")}
                          </span>
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className={`${btn} bg-green-700 text-white`}
                        disabled={busy || rec.status !== "PENDING" || !actorName}
                        onClick={() =>
                          act(rec.id, async () => {
                            await ps6Api.decide(rec.id, "APPROVED", actorName);
                            return `Approved ${rec.room_id} as ${actorName}.`;
                          })
                        }
                      >
                        Approve
                      </button>
                      <button
                        className={`${btn} bg-red-700 text-white`}
                        disabled={busy || rec.status !== "PENDING" || !actorName}
                        onClick={() =>
                          act(rec.id, async () => {
                            await ps6Api.decide(rec.id, "REJECTED", actorName);
                            return `Rejected ${rec.room_id} as ${actorName}.`;
                          })
                        }
                      >
                        Reject
                      </button>
                      <button
                        className={`${btn} bg-blue-700 text-white`}
                        disabled={busy || rec.status !== "APPROVED" || !actorName}
                        onClick={() =>
                          act(rec.id, async () => {
                            await ps6Api.executeSimulation(rec.id, actorName);
                            return `Simulated execution recorded for ${rec.room_id}. No real equipment was controlled.`;
                          })
                        }
                      >
                        Execute in simulation
                      </button>
                      {rec.status === "PENDING" && (
                        <span className="text-xs text-slate-600">Execution is blocked until approved.</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>

            <section aria-labelledby="rooms" className="space-y-2">
              <h2 id="rooms" className="text-xl font-semibold">
                3. Campus / building / floor / room monitoring <Badge tone="slate">SIMULATED</Badge>
              </h2>
              <label className="text-sm">
                Building:{" "}
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="rounded border border-slate-400 bg-white px-2 py-1"
                >
                  <option value="all">All buildings</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className={`${card} overflow-x-auto`}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-1 pr-3">Room</th>
                      <th className="pr-3">Floor</th>
                      <th className="pr-3">Occupancy</th>
                      <th className="pr-3">kWh/h</th>
                      <th className="pr-3">°C</th>
                      <th>Protected equipment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRooms.map((r) => (
                      <tr key={r.room_id} className="border-b border-slate-100">
                        <td className="py-1 pr-3">{r.room_id}</td>
                        <td className="pr-3">{r.floor}</td>
                        <td className="pr-3">
                          {r.occupancy_count}/{r.capacity} ({r.occupancy_pct}%)
                        </td>
                        <td className="pr-3">{r.power_kwh}</td>
                        <td className="pr-3">{r.temperature_c}</td>
                        <td>{r.equipment.filter((e) => e.protected).map((e) => e.name).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="timetable" className="space-y-2">
              <h2 id="timetable" className="text-xl font-semibold">
                4. Campus event calendar &amp; timetable intelligence
              </h2>
              <form onSubmit={onCreateSchedule} className={`${card} grid gap-2 md:grid-cols-6`}>
                <select name="room_id" required defaultValue="" className="rounded border border-slate-400 px-2 py-1 md:col-span-2">
                  <option value="" disabled>
                    Room…
                  </option>
                  {data.rooms.map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                      {r.room_id}
                    </option>
                  ))}
                </select>
                <input name="title" required maxLength={120} placeholder="Title" className="rounded border border-slate-400 px-2 py-1 md:col-span-2" />
                <input name="expected_occupancy" type="number" min={0} max={1000} required placeholder="Expected people" className="rounded border border-slate-400 px-2 py-1 md:col-span-2" />
                <label className="text-xs md:col-span-2">
                  Starts
                  <input name="starts_at" type="datetime-local" required className="block w-full rounded border border-slate-400 px-2 py-1 text-sm" />
                </label>
                <label className="text-xs md:col-span-2">
                  Ends
                  <input name="ends_at" type="datetime-local" required className="block w-full rounded border border-slate-400 px-2 py-1 text-sm" />
                </label>
                <button type="submit" className={`${btn} self-end bg-slate-800 text-white md:col-span-2`} disabled={busyId === "schedule-form" || !actorName}>
                  Save schedule
                </button>
              </form>
              <div className={`${card} overflow-x-auto`}>
                {data.schedules.length === 0 ? (
                  <p className="text-sm">No campus events scheduled yet. Add events below; overlapping events in the same room are rejected.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="py-1 pr-3">Title</th>
                        <th className="pr-3">Room</th>
                        <th className="pr-3">Window</th>
                        <th className="pr-3">Expected</th>
                        <th className="pr-3">Simulated now</th>
                        <th className="pr-3">Flag</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.schedules.map((s) => {
                        const c = comparisonBySchedule.get(s.id);
                        return (
                          <tr key={s.id} className="border-b border-slate-100">
                            <td className="py-1 pr-3">{s.title}</td>
                            <td className="pr-3">{s.room_id}</td>
                            <td className="pr-3">
                              {s.starts_at} → {s.ends_at}
                            </td>
                            <td className="pr-3">{s.expected_occupancy}</td>
                            <td className="pr-3">
                              {c ? `${c.actual_occupancy ?? "n/a"} people, ${c.actual_power_kwh ?? "n/a"} kWh/h` : "n/a"}
                            </td>
                            <td className="pr-3">{c?.idle_energy_flag ? <Badge tone="amber">Idle energy</Badge> : "—"}</td>
                            <td>
                              <button
                                className={`${btn} bg-slate-200`}
                                disabled={busyId === s.id || !actorName}
                                onClick={() =>
                                  act(s.id, async () => {
                                    await ps6Api.deleteSchedule(s.id, actorName);
                                    return `Deleted schedule “${s.title}”.`;
                                  })
                                }
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section aria-labelledby="audit" className="space-y-2">
              <h2 id="audit" className="text-xl font-semibold">
                5. Audit history
              </h2>
              <div className={`${card} overflow-x-auto`}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-1 pr-3">Time (UTC)</th>
                      <th className="pr-3">Actor</th>
                      <th className="pr-3">Action</th>
                      <th className="pr-3">Entity</th>
                      <th>Status change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.audit.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100">
                        <td className="py-1 pr-3">{a.timestamp}</td>
                        <td className="pr-3">{a.actor}</td>
                        <td className="pr-3">{a.action}</td>
                        <td className="pr-3">
                          {a.entity_type} {a.entity_id.slice(0, 8)}
                        </td>
                        <td>
                          {String(a.previous_state?.status ?? "—")} → {String(a.new_state.status ?? "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="limits" className={`${card} text-sm`}>
              <h2 id="limits" className="mb-1 text-lg font-semibold">
              Method and integration limits
              </h2>
              <p>
                Peak estimates scale simulated room loads by manually entered event occupancy; anomaly flags use transparent rules. Neither is a trained forecast or verified equipment diagnosis. Events are entered in this app; external calendar providers are not connected. No savings what-if model is included.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
