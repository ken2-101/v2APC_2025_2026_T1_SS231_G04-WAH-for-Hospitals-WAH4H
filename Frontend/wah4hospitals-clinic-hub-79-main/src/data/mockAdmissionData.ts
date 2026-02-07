import { Admission } from '../types/admission'; // We will ensure this type matches

export const LOCATION_HIERARCHY = {
  buildings: [
    { code: "MAIN", name: "Main Hospital Building", type: "si" },
    { code: "ANNEX", name: "Annex Building", type: "si" },
    { code: "ER", name: "Emergency Building", type: "si" }
  ],
  wings: {
    "MAIN": [
      { code: "MAIN-1F", name: "1st Floor", type: "lvl" },
      { code: "MAIN-2F", name: "2nd Floor", type: "lvl" },
      { code: "MAIN-3F", name: "3rd Floor", type: "lvl" }
    ],
    // ... add other wings as needed
  },
  wards: {
    "MAIN-1F": [
      { code: "ICU", name: "Intensive Care Unit", type: "wa", capacity: 10, occupied: 8 },
      { code: "CCU", name: "Cardiac Care Unit", type: "wa", capacity: 6, occupied: 4 }
    ],
    "MAIN-2F": [
      { code: "WARD-A", name: "Ward A - General", type: "wa", capacity: 20, occupied: 18 },
      { code: "WARD-B", name: "Ward B - General", type: "wa", capacity: 16, occupied: 6 }
    ]
  },
  corridors: {
    "ICU": [
      { code: "ICU-NORTH", name: "North Corridor", type: "co" },
      { code: "ICU-SOUTH", name: "South Corridor", type: "co" }
    ],
    "WARD-A": [
      { code: "WARD-A-EAST", name: "East Wing", type: "co" },
      { code: "WARD-A-WEST", name: "West Wing", type: "co" }
    ]
  },
  rooms: {
    "ICU-NORTH": [
      { code: "ICU-101", name: "ICU-101", type: "ro", beds: 4, occupied: 4, physicalType: "ro" },
      { code: "ICU-102", name: "ICU-102", type: "ro", beds: 4, occupied: 3, physicalType: "ro" }
    ],
    "WARD-A-EAST": [
      { code: "A-101", name: "Room 101", type: "ro", beds: 4, occupied: 4, physicalType: "ro" },
      { code: "A-102", name: "Room 102", type: "ro", beds: 4, occupied: 2, physicalType: "ro" }
    ]
  }
};

export const MOCK_ADMISSIONS: Admission[] = [
  {
    id: "1",
    patientId: "WAH-2026-00011",
    patientName: "Fernando Lucia Dela Cruz",
    admissionNo: "ENC-00011",
    admissionDate: "2026-02-01T08:00:00",
    dischargeDate: null,
    physician: "Dr. John Smith",
    location: {
      building: "MAIN",
      ward: "ICU",
      room: "ICU-3",
      bed: "A"
    },
    status: "in-progress",
    priority: "high",
    diagnosis: "I21.9 - Acute myocardial infarction",
    serviceType: "Cardiology",
    admitSource: "Emergency"
  },
  {
    id: "2",
    patientId: "WAH-2026-00017",
    patientName: "Oscar Lucia Aguilar",
    admissionNo: "ENC-00017",
    admissionDate: "2026-01-30T08:00:00",
    dischargeDate: null,
    physician: "Dr. Robert Lee",
    location: {
      building: "MAIN",
      ward: "Ward A",
      room: "101",
      bed: "B"
    },
    status: "in-progress",
    priority: "routine",
    diagnosis: "J18.9 - Pneumonia, unspecified",
    serviceType: "Internal Medicine",
    admitSource: "Physician Referral"
  }
];