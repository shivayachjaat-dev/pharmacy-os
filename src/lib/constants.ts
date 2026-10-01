export const MEDICINE_SCHEDULES = {
  OTC: {
    label: "Over The Counter (OTC)",
    code: "OTC",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "General retail sale permitted without doctor's prescription",
    requiresPrescription: false,
  },
  SCHEDULE_H: {
    label: "Schedule H",
    code: "SCHEDULE_H",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only",
    requiresPrescription: true,
  },
  SCHEDULE_H1: {
    label: "Schedule H1",
    code: "SCHEDULE_H1",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    description: "Warning: Potent antibacterial/psychotropic drug. Retain duplicate record for 3 years",
    requiresPrescription: true,
  },
  SCHEDULE_X: {
    label: "Schedule X",
    code: "SCHEDULE_X",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    description: "Strictly controlled narcotic/psychotropic substance. Special double prescription required",
    requiresPrescription: true,
  },
  NARCOTIC: {
    label: "NDPS Narcotic",
    code: "NARCOTIC",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Narcotic Drugs and Psychotropic Substances Act regulated item",
    requiresPrescription: true,
  },
} as const;

export const GST_SLABS = [0, 5, 12, 18, 28] as const;

export const DOSAGE_FORMS = [
  "TABLET",
  "CAPSULE",
  "SYRUP",
  "SUSPENSION",
  "INJECTION",
  "OINTMENT",
  "CREAM",
  "GEL",
  "DROPS",
  "INHALER",
  "POWDER",
  "LOTION",
] as const;

export const STORAGE_TYPES = {
  ROOM_TEMP: {
    label: "Room Temperature (15°C - 25°C)",
    code: "ROOM_TEMP",
    coldStorage: false,
  },
  COLD_STORAGE_2_8C: {
    label: "Cold Storage Refrigerator (2°C - 8°C)",
    code: "COLD_STORAGE_2_8C",
    coldStorage: true,
  },
  COOL_DRY: {
    label: "Cool & Dry Place (<20°C)",
    code: "COOL_DRY",
    coldStorage: false,
  },
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: "SaaS Super Admin",
  ORG_OWNER: "Pharmacy Business Owner",
  STORE_MANAGER: "Store Manager",
  REGISTERED_PHARMACIST: "Registered Pharmacist",
  CASHIER: "Counter Cashier",
  INVENTORY_STAFF: "Inventory Manager",
  PICKER_DELIVERY: "Picker & Delivery Staff",
} as const;
