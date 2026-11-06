"""Strict telemetry parsing and arrival-ordered merging for upload batches."""
from __future__ import annotations

import csv
import io
import json
import math
import re
import unicodedata
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from typing import Any


MAX_CSV_BYTES = 1_048_576
MAX_ROWS = 500
MAX_FIELD_LENGTH = 256
MIN_EVENT_TIME = datetime(2000, 1, 1, tzinfo=timezone.utc)

# Upload schemas mirror the downloadable CSV templates. Optional measurement
# fields may be omitted; unknown fields are rejected. Bounds are conservative
# engineering plausibility limits for input hygiene, not sensor accuracy claims.
SCHEMAS: dict[str, dict[str, Any]] = {
    "energy": {"id": "entity_id", "measure": "kwh", "numeric": {
        "kwh": (0, 1_000_000), "kw_demand": (0, 100_000), "power_factor": (0, 1),
        "voltage_v": (0, 1_000), "temperature_c": (-50, 100),
    }, "text": set()},
    "water": {"id": "entity_id", "measure": "litres", "numeric": {
        "litres": (0, 10_000_000), "flow_rate_lpm": (0, 100_000), "pressure_bar": (0, 100),
        "ph_level": (0, 14), "tds_ppm": (0, 100_000),
    }, "text": set()},
    "waste": {"id": "entity_id", "measure": "fill_level_kg", "numeric": {
        "fill_level_kg": (0, 1_000_000), "capacity_pct": (0, 100), "temperature_c": (-50, 200),
    }, "text": {"category"}},
    "aqi": {"id": "sensor_id", "measure": "aqi_index", "numeric": {
        "pm25": (0, 2_000), "pm10": (0, 5_000), "co2_ppm": (0, 100_000),
        "aqi_index": (0, 500), "temp_c": (-100, 100), "humidity_pct": (0, 100),
    }, "text": set()},
    "assets": {"id": "asset_id", "measure": "vibration_mm_s", "numeric": {
        "vibration_mm_s": (0, 1_000), "operating_temp_c": (-50, 300), "power_kw": (0, 100_000),
        "duty_cycle_pct": (0, 100), "health_score": (0, 100),
    }, "text": set()},
}
COMMON_FIELDS = {"timestamp"}
IDENTIFIER_RE = re.compile(r"[^\s\x00-\x1f\x7f][^\x00-\x1f\x7f]{0,127}\Z", re.UNICODE)
INTERNAL_COLUMNS = {"_record_identity", "_arrival_order", "_arrival_at", "_arrival_source", "_arrival_row"}


class TelemetryValidationError(ValueError):
    def __init__(self, errors: list[dict[str, Any]], rejected: int = 0):
        self.errors = errors
        self.rejected = rejected
        super().__init__("Telemetry batch validation failed.")


def _error(row: int | None, field: str, message: str) -> dict[str, Any]:
    return {"row": row, "field": field, "message": message}


def _timestamp(value: Any, row: int, now: datetime) -> tuple[str | None, dict[str, Any] | None]:
    if not isinstance(value, str) or not value.strip() or len(value) > 64 or not re.match(r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}", value.strip()):
        return None, _error(row, "timestamp", "Expected a non-empty ISO 8601 timestamp.")
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except (ValueError, OverflowError):
        return None, _error(row, "timestamp", "Expected a valid ISO 8601 date and time.")
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)  # naive upload times are explicitly UTC
    parsed = parsed.astimezone(timezone.utc)
    if parsed < MIN_EVENT_TIME or parsed > now + timedelta(days=1):
        return None, _error(row, "timestamp", "Timestamp must be between 2000-01-01 UTC and 24 hours in the future.")
    return parsed.isoformat(timespec="microseconds").replace("+00:00", "Z"), None


def _safe_text(value: Any, field: str, row: int) -> tuple[str | None, dict[str, Any] | None]:
    if not isinstance(value, str):
        return None, _error(row, field, "Expected text.")
    normalized = unicodedata.normalize("NFC", value.strip())
    if not normalized or len(normalized) > MAX_FIELD_LENGTH:
        return None, _error(row, field, f"Must contain 1 to {MAX_FIELD_LENGTH} characters.")
    if any(unicodedata.category(ch) in {"Cc", "Cf", "Cs"} for ch in normalized):
        return None, _error(row, field, "Control, formatting, and invalid Unicode characters are not allowed.")
    return normalized, None


def _validate_record(record: dict[str, Any], domain: str, row: int, now: datetime) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    schema = SCHEMAS[domain]
    allowed = COMMON_FIELDS | {schema["id"]} | set(schema["numeric"]) | schema["text"]
    errors: list[dict[str, Any]] = []
    extra = set(record) - allowed
    for _field in sorted(extra, key=lambda value: str(value)):
        errors.append(_error(row, "unknown_field", "Record contains a field outside this telemetry domain's schema."))
    required = {"timestamp", schema["id"], schema["measure"]}
    for field in sorted(required - set(record)):
        errors.append(_error(row, field, "Required field is missing."))
    if errors:
        return None, errors

    normalized: dict[str, Any] = {}
    event_time, error = _timestamp(record["timestamp"], row, now)
    if error:
        errors.append(error)
    else:
        normalized["timestamp"] = event_time
    entity, error = _safe_text(record[schema["id"]], schema["id"], row)
    if error:
        errors.append(error)
    elif not IDENTIFIER_RE.fullmatch(entity):
        errors.append(_error(row, schema["id"], "Identifier must contain 1 to 128 printable Unicode characters."))
    else:
        normalized[schema["id"]] = entity

    for field, bounds in schema["numeric"].items():
        if field not in record:
            continue
        value = record[field]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            errors.append(_error(row, field, "Expected a JSON number or a numeric CSV value."))
            continue
        numeric = float(value)
        if not math.isfinite(numeric):
            errors.append(_error(row, field, "Value must be finite."))
        elif numeric < bounds[0] or numeric > bounds[1]:
            errors.append(_error(row, field, f"Value must be between {bounds[0]} and {bounds[1]} for this field."))
        else:
            normalized[field] = numeric

    for field in schema["text"]:
        if field in record:
            value, error = _safe_text(record[field], field, row)
            if error:
                errors.append(error)
            else:
                normalized[field] = value
    return (normalized if not errors else None), errors


def parse_csv_batch(csv_data: str, domain: str, now: datetime | None = None) -> list[dict[str, Any]]:
    if domain not in SCHEMAS:
        raise TelemetryValidationError([_error(None, "domain", "Unsupported telemetry domain.")])
    if not isinstance(csv_data, str):
        raise TelemetryValidationError([_error(None, "csv_data", "Expected CSV text.")])
    if len(csv_data.encode("utf-8", errors="replace")) > MAX_CSV_BYTES:
        raise TelemetryValidationError([_error(None, "csv_data", f"CSV exceeds the {MAX_CSV_BYTES}-byte upload limit.")])
    reader = csv.reader(io.StringIO(csv_data, newline=""), strict=True)
    try:
        header = next(reader, None)
        if not header:
            raise TelemetryValidationError([_error(1, "header", "CSV must include a header and at least one data row.")])
        header = [unicodedata.normalize("NFC", item.lstrip("\ufeff").strip()) for item in header]
        if len(set(header)) != len(header):
            raise TelemetryValidationError([_error(1, "header", "Duplicate column names are not allowed.")])
        schema = SCHEMAS[domain]
        allowed = COMMON_FIELDS | {schema["id"]} | set(schema["numeric"]) | schema["text"]
        errors = [_error(1, "header", "CSV contains a column outside this telemetry domain's schema.") for name in header if name not in allowed]
        for field in sorted({"timestamp", schema["id"], schema["measure"]} - set(header)):
            errors.append(_error(1, field, "Required column is missing."))
        if errors:
            raise TelemetryValidationError(errors)

        records: list[dict[str, Any]] = []
        batch_errors: list[dict[str, Any]] = []
        data_rows = 0
        clock = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
        for row_number, values in enumerate(reader, start=2):
            data_rows += 1
            if row_number - 1 > MAX_ROWS:
                raise TelemetryValidationError([_error(row_number, "rows", f"Batch exceeds the {MAX_ROWS}-row limit.")], rejected=row_number - 1)
            if len(values) != len(header):
                batch_errors.append(_error(row_number, "row", f"Expected {len(header)} columns but found {len(values)}."))
                continue
            source = dict(zip(header, values))
            converted: dict[str, Any] = {k: v for k, v in source.items() if k in {"timestamp", schema["id"]} | schema["text"]}
            for field in set(schema["numeric"]) & set(source):
                try:
                    # CSV numeric cells have a textual wire representation; do not accept blanks or prefixes.
                    if not source[field].strip() or not re.fullmatch(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?", source[field].strip()):
                        raise ValueError
                    converted[field] = float(source[field])
                except (ValueError, OverflowError):
                    batch_errors.append(_error(row_number, field, "Expected a finite numeric value."))
            result, record_errors = _validate_record(converted, domain, row_number, clock)
            batch_errors.extend(record_errors)
            if result is not None:
                records.append(result)
        if not records and not batch_errors:
            batch_errors.append(_error(2, "row", "CSV must contain at least one data row."))
        if batch_errors:
            raise TelemetryValidationError(batch_errors, rejected=max(1, data_rows))
        return records
    except csv.Error:
        raise TelemetryValidationError([_error(reader.line_num or 1, "csv_data", "Malformed CSV quoting or escape sequence.")], rejected=max(1, reader.line_num - 1)) from None


def validate_records(records: Any, domain: str, now: datetime | None = None) -> list[dict[str, Any]]:
    if domain not in SCHEMAS:
        raise TelemetryValidationError([_error(None, "domain", "Unsupported telemetry domain.")])
    if not isinstance(records, list) or not records:
        raise TelemetryValidationError([_error(None, "records", "Provide at least one telemetry record.")])
    if len(records) > MAX_ROWS:
        raise TelemetryValidationError([_error(None, "records", f"Batch exceeds the {MAX_ROWS}-row limit.")], rejected=len(records))
    clock = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    valid: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    for row, record in enumerate(records, start=1):
        if not isinstance(record, dict):
            errors.append(_error(row, "record", "Each record must be a JSON object."))
            continue
        normalized, row_errors = _validate_record(record, domain, row, clock)
        errors.extend(row_errors)
        if normalized is not None:
            valid.append(normalized)
    if errors:
        raise TelemetryValidationError(errors, rejected=len(records))
    return valid


def record_identity(facility_type: str, domain: str, record: dict[str, Any]) -> str:
    entity_key = SCHEMAS[domain]["id"]
    timestamp, error = _timestamp(record.get("timestamp"), 1, datetime.now(timezone.utc))
    if error or not isinstance(record.get(entity_key), str) or not record[entity_key].strip():
        raise ValueError("Record does not have a valid identity.")
    entity = unicodedata.normalize("NFC", record[entity_key].strip())
    return json.dumps([facility_type, domain, entity, timestamp], ensure_ascii=False, separators=(",", ":"))


def merge_batch(existing: pd.DataFrame, records: list[dict[str, Any]], facility_type: str, domain: str, source: str) -> tuple[pd.DataFrame, dict[str, int]]:
    """Merge non-conflicting records; retain the incumbent and report value conflicts."""
    import pandas as pd

    now = datetime.now(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")
    old = existing.copy(deep=True) if existing is not None else pd.DataFrame()
    old = old.reset_index(drop=True)
    if "_arrival_order" not in old:
        old["_arrival_order"] = range(len(old))
    old["_arrival_order"] = pd.to_numeric(old["_arrival_order"], errors="coerce").fillna(-1).astype("int64")
    if "_arrival_at" not in old:
        old["_arrival_at"] = "legacy"
    if "_arrival_source" not in old:
        old["_arrival_source"] = "existing"
    if "_arrival_row" not in old:
        old["_arrival_row"] = range(1, len(old) + 1)
    schema = SCHEMAS[domain]
    identity_keys: list[str | None] = []
    for _, row in old.iterrows():
        event = row.get("timestamp")
        if not isinstance(event, str) or not event.strip():
            event = row.get("date")
        entity = next((row.get(k) for k in (schema["id"], "entity_id", "sensor_id", "asset_id", "bin_id", "building_id") if isinstance(row.get(k), str) and row.get(k).strip()), None)
        try:
            canonical, error = _timestamp(str(event), 1, datetime.now(timezone.utc))
            identity_keys.append(record_identity(facility_type, domain, {"timestamp": canonical, schema["id"]: entity}) if not error and entity else None)
        except (KeyError, TypeError):
            identity_keys.append(None)
    old["_record_identity"] = identity_keys

    latest_existing: dict[str, int] = {}
    for index, identity in enumerate(identity_keys):
        if identity is not None and (identity not in latest_existing or old.iloc[index]["_arrival_order"] >= old.iloc[latest_existing[identity]]["_arrival_order"]):
            latest_existing[identity] = index
    retained = old.drop(index=[i for i, identity in enumerate(identity_keys) if identity is not None and latest_existing.get(identity) != i])
    start_order = max([-1, *[int(v) for v in old["_arrival_order"].tolist()]]) + 1
    winners: dict[str, tuple[int, dict[str, Any]]] = {}
    conflicts: list[dict[str, Any]] = []
    duplicate_count = 0
    for batch_index, record in enumerate(records, start=1):
        identity = record_identity(facility_type, domain, record)
        previous = winners.get(identity)
        existing_index = latest_existing.get(identity)
        incumbent = winners[identity][1] if previous else (old.iloc[existing_index].to_dict() if existing_index is not None else None)
        if previous or existing_index is not None:
            duplicate_count += 1
            changed = [field for field in set(schema["numeric"]) | schema["text"]
                       if field in record and field in incumbent and pd.notna(incumbent[field])
                       and record[field] != incumbent[field]]
            if changed:
                conflicts.append({
                    "conflict_id": str(uuid4()), "record_identity": identity,
                    "entity_id": record.get(schema["id"]), "timestamp": record.get("timestamp"),
                    "fields": sorted(changed), "retained_source": incumbent.get("_arrival_source", "earlier batch row"),
                    "incoming_source": source, "resolution": "held_for_review",
                    "retained_record": {field: incumbent[field] for field in set(schema["numeric"]) | schema["text"] if field in incumbent},
                    "incoming_record": {field: record[field] for field in set(schema["numeric"]) | schema["text"] if field in record},
                })
            # Keep the first observed record; arrival time alone is not evidence of truth.
            continue
        winners[identity] = (batch_index, record)
    additions: list[dict[str, Any]] = []
    for identity, (batch_index, record) in winners.items():
        item = dict(record)
        if domain == "assets":
            item["date"] = record["timestamp"]
        item.update({"_record_identity": identity, "_arrival_order": start_order + batch_index - 1,
                     "_arrival_at": now, "_arrival_source": source, "_arrival_row": batch_index})
        additions.append(item)
    combined = pd.concat([retained, pd.DataFrame(additions)], ignore_index=True, sort=False)
    # Preserve the incumbent for duplicate identities; stable order keeps its provenance.
    identified = combined[combined["_record_identity"].notna()].drop_duplicates("_record_identity", keep="first")
    unidentified = combined[combined["_record_identity"].isna()]
    combined = pd.concat([unidentified, identified], ignore_index=True, sort=False)
    combined = combined.sort_values("_arrival_order", kind="stable").tail(500).reset_index(drop=True)
    return combined, {"accepted": len(winners), "rejected": 0, "duplicates": duplicate_count, "conflicts": conflicts}
