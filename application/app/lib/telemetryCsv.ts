import type { TelemetryRow } from "./dataTypes";

export const MAX_TELEMETRY_BYTES = 1_048_576;
export const MAX_TELEMETRY_ROWS = 500;

const DOMAIN_RULES = {
  energy: { id: "entity_id", required: ["kwh"], numeric: { kwh: [0, 1_000_000], kw_demand: [0, 100_000], power_factor: [0, 1], voltage_v: [0, 1_000], temperature_c: [-50, 100] } },
  water: { id: "entity_id", required: ["litres"], numeric: { litres: [0, 10_000_000], flow_rate_lpm: [0, 100_000], pressure_bar: [0, 100], ph_level: [0, 14], tds_ppm: [0, 100_000] } },
  waste: { id: "entity_id", required: ["fill_level_kg"], numeric: { fill_level_kg: [0, 1_000_000], capacity_pct: [0, 100], temperature_c: [-50, 200] }, text: ["category"] },
  aqi: { id: "sensor_id", required: ["aqi_index"], numeric: { pm25: [0, 2_000], pm10: [0, 5_000], co2_ppm: [0, 100_000], aqi_index: [0, 500], temp_c: [-100, 100], humidity_pct: [0, 100] } },
  assets: { id: "asset_id", required: ["vibration_mm_s"], numeric: { vibration_mm_s: [0, 1_000], operating_temp_c: [-50, 300], power_kw: [0, 100_000], duty_cycle_pct: [0, 100], health_score: [0, 100] } },
} as const;

export type TelemetryDomain = keyof typeof DOMAIN_RULES;

export function safelyRemoveStoredTelemetry(key: string): void {
  try { localStorage.removeItem(key); } catch { /* Browser storage may be unavailable or damaged. */ }
}

function fail(row: number, field: string, message: string): never {
  throw new Error(`Row ${row}, ${field}: ${message}`);
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  let quoteClosed = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { value += '"'; i += 1; }
        else { quoted = false; quoteClosed = true; }
      } else value += ch;
      continue;
    }
    if (quoteClosed && ch !== "," && ch !== "\r" && ch !== "\n") fail(rows.length + 1, "CSV", "Unexpected text after a closing quote.");
    if (ch === '"') {
      if (value.length !== 0) fail(rows.length + 1, "CSV", "A quoted field must start with a quote.");
      quoted = true;
    } else if (ch === ",") {
      row.push(value); value = ""; quoteClosed = false;
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(value); rows.push(row); row = []; value = ""; quoteClosed = false;
    } else value += ch;
  }
  if (quoted) fail(rows.length + 1, "CSV", "Unclosed quoted field.");
  if (row.length > 0 || value.length > 0 || quoteClosed) { row.push(value); rows.push(row); }
  return rows;
}

function validateTimestamp(value: string, row: number): string {
  if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(value)) {
    return fail(row, "timestamp", "Use an ISO 8601 date and time; timezone-less values are treated as UTC.");
  }
  const parsed = new Date(value.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value.replace(" ", "T")}Z`);
  const min = Date.UTC(2000, 0, 1);
  if (!Number.isFinite(parsed.getTime()) || parsed.getTime() < min || parsed.getTime() > Date.now() + 86_400_000) {
    return fail(row, "timestamp", "Must be from 2000-01-01 UTC through 24 hours from now.");
  }
  return value;
}

function validIdentifier(value: string, row: number, field: string): string {
  const id = value.normalize("NFC").trim();
  if (!id || [...id].length > 128 || hasControlCharacters(id)) fail(row, field, "Use 1 to 128 printable characters.");
  return id;
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0) || 0;
    return code < 0x20 || (code >= 0x7f && code <= 0x9f) || (code >= 0xd800 && code <= 0xdfff) ||
      code === 0x00ad || code === 0x061c || (code >= 0x200b && code <= 0x200f) ||
      (code >= 0x202a && code <= 0x202e) || code === 0x2060 || (code >= 0x2066 && code <= 0x206f) || code === 0xfeff;
  });
}

export function validateTelemetryRows(domain: TelemetryDomain, input: unknown): input is TelemetryRow[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_TELEMETRY_ROWS) return false;
  const rule = DOMAIN_RULES[domain];
  const allowed = new Set(["timestamp", rule.id, ...Object.keys(rule.numeric), ...("text" in rule ? rule.text : [])]);
  return input.every((record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return false;
    const item = record as Record<string, unknown>;
    if (!["timestamp", rule.id, ...rule.required].every((key) => Object.hasOwn(item, key))) return false;
    if (Object.keys(item).some((key) => !allowed.has(key))) return false;
    if (typeof item.timestamp !== "string" || typeof item[rule.id] !== "string") return false;
    try { validateTimestamp(item.timestamp, 1); validIdentifier(item[rule.id] as string, 1, rule.id); } catch { return false; }
    for (const [field, bounds] of Object.entries(rule.numeric)) {
      if (!Object.hasOwn(item, field)) continue;
      const value = item[field];
      if (typeof value !== "number" || !Number.isFinite(value) || value < bounds[0] || value > bounds[1]) return false;
    }
    if ("text" in rule && rule.text.some((field) => typeof item[field] !== "string" || !item[field] || hasControlCharacters(item[field] as string))) return false;
    return true;
  });
}

export function isValidTelemetryDataset(value: unknown): value is {
  id: string; domain: TelemetryDomain; sector: string; filename: string; uploadDate: string; recordCount: number;
  dateRange: string; rows: TelemetryRow[]; kpis: { meanValue: number; maxValue: number; minValue: number; unit: string; anomaliesDetected: number };
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.domain !== "string" || !(item.domain in DOMAIN_RULES) || typeof item.sector !== "string" || typeof item.filename !== "string" ||
      typeof item.uploadDate !== "string" || typeof item.dateRange !== "string" || !Number.isInteger(item.recordCount) ||
      !item.kpis || typeof item.kpis !== "object" || Array.isArray(item.kpis)) return false;
  const domain = item.domain as TelemetryDomain;
  const kpis = item.kpis as Record<string, unknown>;
  if (!["meanValue", "maxValue", "minValue", "anomaliesDetected"].every((key) => typeof kpis[key] === "number" && Number.isFinite(kpis[key])) ||
      typeof kpis.unit !== "string" || kpis.unit.length > 16 || !validateTelemetryRows(domain, item.rows) || item.recordCount !== item.rows.length ||
      typeof item.id !== "string" || item.id.length > 128 || item.filename.length > 128 || item.sector.length > 64 ||
      item.filename !== item.filename.trim() || hasControlCharacters(item.filename) || hasControlCharacters(item.sector) ||
      !Number.isInteger(kpis.anomaliesDetected) || (kpis.anomaliesDetected as number) < 0 || (kpis.anomaliesDetected as number) > item.rows.length) return false;
  const metric = ({ energy: "kwh", water: "litres", waste: "fill_level_kg", aqi: "aqi_index", assets: "vibration_mm_s" } as const)[domain];
  const values = (item.rows as TelemetryRow[]).map((row) => row[metric]).filter((value): value is number => typeof value === "number");
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  return Math.abs((kpis.meanValue as number) - mean) <= 0.11 &&
    kpis.maxValue === Math.max(...values) && kpis.minValue === Math.min(...values);
}

export function parseTelemetryCsv(domain: TelemetryDomain, text: string): TelemetryRow[] {
  if (new TextEncoder().encode(text).length > MAX_TELEMETRY_BYTES) throw new Error(`File exceeds ${MAX_TELEMETRY_BYTES} bytes.`);
  const parsed = parseRows(text.replace(/^\uFEFF/, ""));
  if (parsed.length < 2) throw new Error("CSV must have a header and at least one data row.");
  if (parsed.length - 1 > MAX_TELEMETRY_ROWS) throw new Error(`CSV exceeds the ${MAX_TELEMETRY_ROWS}-row limit.`);
  const headers = parsed[0].map((header) => header.normalize("NFC").trim());
  if (headers.some((header) => !header)) throw new Error("Header names cannot be empty.");
  if (new Set(headers).size !== headers.length) throw new Error("Duplicate column names are not allowed.");
  const rule = DOMAIN_RULES[domain];
  const allowed = new Set(["timestamp", rule.id, ...Object.keys(rule.numeric), ...("text" in rule ? rule.text : [])]);
  const unknown = headers.find((header) => !allowed.has(header));
  if (unknown) throw new Error("CSV contains a column outside this telemetry domain's schema.");
  for (const required of ["timestamp", rule.id, ...rule.required]) if (!headers.includes(required)) throw new Error(`Required column missing: ${required}.`);
  const records = parsed.slice(1).map((values, index) => {
    const rowNumber = index + 2;
    if (values.length !== headers.length) fail(rowNumber, "row", `Expected ${headers.length} columns but found ${values.length}.`);
    const result: TelemetryRow = {};
    for (const [column, raw] of headers.map((header, column) => [header, values[column]] as const)) {
      const value = raw.normalize("NFC").trim();
      if (column === "timestamp") result[column] = validateTimestamp(value, rowNumber);
      else if (column === rule.id) result[column] = validIdentifier(value, rowNumber, column);
      else if (Object.hasOwn(rule.numeric, column)) {
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) fail(rowNumber, column, "Expected a finite number.");
        const numeric = Number(value);
        const bounds = rule.numeric[column as keyof typeof rule.numeric] as readonly [number, number];
        if (!Number.isFinite(numeric) || numeric < bounds[0] || numeric > bounds[1]) fail(rowNumber, column, `Must be between ${bounds[0]} and ${bounds[1]}.`);
        result[column] = numeric;
      } else {
        if (!value || value.length > 256 || hasControlCharacters(value)) fail(rowNumber, column, "Expected 1 to 256 printable characters.");
        result[column] = value;
      }
    }
    return result;
  });
  if (!validateTelemetryRows(domain, records)) throw new Error("CSV contains an invalid telemetry record.");
  return records;
}
