"""
Multi-Sector Facility Configuration
Supports: Engineering College, Hospital, Industrial Estate, Municipal Campus, Corporate Campus
Each facility type has its own buildings, asset types, sensor configs, and thresholds.
"""

FACILITY_TYPES = {
    "engineering_college": {
        "name": "Engineering College",
        "buildings": [
            {"id": "academic_block", "name": "Academic Block", "area_sqm": 5000, "floors": 4, "occupancy": 800},
            {"id": "hostel_a", "name": "Hostel A", "area_sqm": 3000, "floors": 5, "occupancy": 400},
            {"id": "hostel_b", "name": "Hostel B", "area_sqm": 3000, "floors": 5, "occupancy": 400},
            {"id": "admin_block", "name": "Admin Block", "area_sqm": 2000, "floors": 3, "occupancy": 150},
            {"id": "canteen", "name": "Canteen", "area_sqm": 1000, "floors": 1, "occupancy": 300},
            {"id": "sports_complex", "name": "Sports Complex", "area_sqm": 4000, "floors": 1, "occupancy": 200},
        ],
        "assets": {
            "hvac": {"count": 24, "types": ["Split AC", "Central AC", "Exhaust Fan"]},
            "water_pump": {"count": 8, "types": ["Submersible", "Centrifugal"]},
            "generator": {"count": 4, "types": ["Diesel", "Solar Inverter"]},
            "lift": {"count": 6, "types": ["Passenger", "Goods"]},
            "transformer": {"count": 3, "types": ["Distribution"]},
            "lighting": {"count": 48, "types": ["LED Panel", "Tube Light", "Street Light"]},
            "fire_system": {"count": 12, "types": ["Sprinkler", "Extinguisher", "Alarm"]},
        },
        "energy": {
            "base_kwh_per_sqm": 0.08,
            "peak_hours": [(9, 12), (14, 17)],
            "off_peak_multiplier": 0.4,
            "tariff_per_kwh": 7.5,
            "emission_factor_kg_co2": 0.82,
        },
        "water": {
            "base_litres_per_person": 135,
            "peak_hours": [(6, 9), (17, 20)],
            "tariff_per_kl": 45,
        },
        "waste": {
            "bins_per_building": 3,
            "bin_capacity_kg": 50,
            "collection_frequency_hours": 24,
            "types": ["Dry", "Wet", "E-waste"],
        },
        "aqi": {
            "baseline_pm25": 45,
            "baseline_pm10": 80,
            "seasonal_variation": {"summer": 1.3, "monsoon": 0.7, "winter": 1.5, "autumn": 1.0},
        },
        "safety": {
            "zones": ["Lab", "Workshop", "Hostel", "Sports", "Parking", "Canteen"],
            "incident_types": ["Fire", "Electrical", "Slip/Fall", "Chemical", "Equipment", "Structural"],
        },
    },
    "hospital": {
        "name": "District Hospital",
        "buildings": [
            {"id": "opd_block", "name": "OPD Block", "area_sqm": 4000, "floors": 3, "occupancy": 600},
            {"id": "ipd_block", "name": "IPD Block", "area_sqm": 6000, "floors": 5, "occupancy": 500},
            {"id": "emergency", "name": "Emergency Wing", "area_sqm": 2000, "floors": 2, "occupancy": 200},
            {"id": "admin_wing", "name": "Admin Wing", "area_sqm": 1500, "floors": 2, "occupancy": 100},
            {"id": "pharmacy", "name": "Pharmacy & Lab", "area_sqm": 1000, "floors": 2, "occupancy": 80},
            {"id": "staff_quarters", "name": "Staff Quarters", "area_sqm": 3000, "floors": 4, "occupancy": 300},
        ],
        "assets": {
            "hvac": {"count": 40, "types": ["Central AC", "Split AC", "AHU"]},
            "water_pump": {"count": 10, "types": ["Submersible", "Booster"]},
            "generator": {"count": 6, "types": ["Diesel", "UPS"]},
            "lift": {"count": 8, "types": ["Passenger", "Stretcher", "Goods"]},
            "medical_equipment": {"count": 60, "types": ["Ventilator", "X-Ray", "CT-Scan", "MRI", "Monitor"]},
            "fire_system": {"count": 20, "types": ["Sprinkler", "Extinguisher", "Alarm", "Hydrant"]},
            "oxygen_plant": {"count": 2, "types": ["PSA Plant"]},
        },
        "energy": {
            "base_kwh_per_sqm": 0.15,
            "peak_hours": [(8, 14), (18, 22)],
            "off_peak_multiplier": 0.6,
            "tariff_per_kwh": 8.0,
            "emission_factor_kg_co2": 0.82,
        },
        "water": {
            "base_litres_per_person": 340,
            "peak_hours": [(6, 10), (16, 20)],
            "tariff_per_kl": 45,
        },
        "waste": {
            "bins_per_building": 5,
            "bin_capacity_kg": 40,
            "collection_frequency_hours": 12,
            "types": ["Bio-medical", "Sharp", "General", "Chemical", "Recyclable"],
        },
        "aqi": {
            "baseline_pm25": 35,
            "baseline_pm10": 65,
            "seasonal_variation": {"summer": 1.2, "monsoon": 0.6, "winter": 1.4, "autumn": 0.9},
        },
        "safety": {
            "zones": ["OPD", "ICU", "Lab", "Pharmacy", "Emergency", "Parking"],
            "incident_types": ["Needle-stick", "Biohazard", "Slip/Fall", "Fire", "Chemical", "Electrical"],
        },
    },
    "industrial_estate": {
        "name": "Industrial Estate",
        "buildings": [
            {"id": "plant_a", "name": "Manufacturing Plant A", "area_sqm": 10000, "floors": 2, "occupancy": 500},
            {"id": "plant_b", "name": "Manufacturing Plant B", "area_sqm": 8000, "floors": 2, "occupancy": 400},
            {"id": "warehouse", "name": "Warehouse", "area_sqm": 5000, "floors": 1, "occupancy": 50},
            {"id": "admin_office", "name": "Admin Office", "area_sqm": 2000, "floors": 3, "occupancy": 150},
            {"id": "etp", "name": "ETP / Utility Block", "area_sqm": 1500, "floors": 1, "occupancy": 30},
            {"id": "canteen_welfare", "name": "Canteen & Welfare", "area_sqm": 1200, "floors": 1, "occupancy": 200},
        ],
        "assets": {
            "hvac": {"count": 15, "types": ["Industrial Cooler", "Central AC", "AHU"]},
            "water_pump": {"count": 12, "types": ["Industrial", "ETP Pump", "Cooling Tower"]},
            "generator": {"count": 8, "types": ["Diesel DG", "Solar"]},
            "compressor": {"count": 10, "types": ["Screw", "Reciprocating"]},
            "cnc_machine": {"count": 20, "types": ["CNC Lathe", "CNC Mill", "Press"]},
            "boiler": {"count": 4, "types": ["Steam", "Thermic"]},
            "fire_system": {"count": 18, "types": ["Sprinkler", "Hydrant", "Alarm", "Foam"]},
        },
        "energy": {
            "base_kwh_per_sqm": 0.25,
            "peak_hours": [(8, 16)],
            "off_peak_multiplier": 0.3,
            "tariff_per_kwh": 9.0,
            "emission_factor_kg_co2": 0.82,
        },
        "water": {
            "base_litres_per_person": 50,
            "peak_hours": [(8, 12), (14, 18)],
            "tariff_per_kl": 55,
        },
        "waste": {
            "bins_per_building": 4,
            "bin_capacity_kg": 200,
            "collection_frequency_hours": 8,
            "types": ["Hazardous", "Non-Hazardous", "Metal Scrap", "Packaging", "E-waste"],
        },
        "aqi": {
            "baseline_pm25": 60,
            "baseline_pm10": 110,
            "seasonal_variation": {"summer": 1.4, "monsoon": 0.8, "winter": 1.6, "autumn": 1.1},
        },
        "safety": {
            "zones": ["Shop Floor", "Warehouse", "ETP", "Boiler Room", "Loading Dock", "Chemical Store"],
            "incident_types": ["Machine Injury", "Chemical Spill", "Fire", "Electrical", "Fall from Height", "Gas Leak"],
        },
    },
    "municipal_campus": {
        "name": "Municipal Corporation Campus",
        "buildings": [
            {"id": "main_office", "name": "Main Office", "area_sqm": 4000, "floors": 4, "occupancy": 400},
            {"id": "public_hall", "name": "Public Hall", "area_sqm": 2000, "floors": 1, "occupancy": 500},
            {"id": "records_room", "name": "Records & Archives", "area_sqm": 1500, "floors": 2, "occupancy": 50},
            {"id": "water_supply", "name": "Water Supply Office", "area_sqm": 1000, "floors": 2, "occupancy": 80},
            {"id": "workshop", "name": "Maintenance Workshop", "area_sqm": 2000, "floors": 1, "occupancy": 60},
            {"id": "parking_complex", "name": "Parking Complex", "area_sqm": 3000, "floors": 3, "occupancy": 20},
        ],
        "assets": {
            "hvac": {"count": 20, "types": ["Split AC", "Central AC", "Desert Cooler"]},
            "water_pump": {"count": 6, "types": ["Submersible", "Centrifugal"]},
            "generator": {"count": 3, "types": ["Diesel", "Solar Inverter"]},
            "lift": {"count": 4, "types": ["Passenger"]},
            "vehicle": {"count": 15, "types": ["Garbage Truck", "Water Tanker", "Inspection Van"]},
            "fire_system": {"count": 10, "types": ["Extinguisher", "Alarm"]},
        },
        "energy": {
            "base_kwh_per_sqm": 0.06,
            "peak_hours": [(10, 14), (15, 17)],
            "off_peak_multiplier": 0.35,
            "tariff_per_kwh": 6.5,
            "emission_factor_kg_co2": 0.82,
        },
        "water": {
            "base_litres_per_person": 100,
            "peak_hours": [(9, 12), (14, 17)],
            "tariff_per_kl": 35,
        },
        "waste": {
            "bins_per_building": 2,
            "bin_capacity_kg": 60,
            "collection_frequency_hours": 24,
            "types": ["Dry", "Wet", "Paper/Cardboard"],
        },
        "aqi": {
            "baseline_pm25": 50,
            "baseline_pm10": 90,
            "seasonal_variation": {"summer": 1.2, "monsoon": 0.7, "winter": 1.5, "autumn": 1.0},
        },
        "safety": {
            "zones": ["Reception", "Public Hall", "Parking", "Workshop", "Records"],
            "incident_types": ["Fire", "Electrical", "Slip/Fall", "Structural", "Crowd"],
        },
    },
}

# Default facility for demo
DEFAULT_FACILITY = "engineering_college"


def get_facility_config(facility_type: str = None) -> dict:
    """Get configuration for a specific facility type."""
    facility_type = facility_type or DEFAULT_FACILITY
    if facility_type not in FACILITY_TYPES:
        raise ValueError(f"Unknown facility type: {facility_type}. Available: {list(FACILITY_TYPES.keys())}")
    return FACILITY_TYPES[facility_type]


def get_all_facility_types() -> list:
    """Return list of all supported facility types."""
    return [{"id": k, "name": v["name"]} for k, v in FACILITY_TYPES.items()]


def get_buildings(facility_type: str = None) -> list:
    """Get buildings for a facility."""
    config = get_facility_config(facility_type)
    return config["buildings"]


def get_asset_types(facility_type: str = None) -> dict:
    """Get asset types for a facility."""
    config = get_facility_config(facility_type)
    return config["assets"]
