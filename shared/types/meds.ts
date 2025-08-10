export type DoseUnit = "mg" | "mcg" | "mL" | "tab" | "capsule";

export interface Med {
  id: string;
  name: string;
  strength?: number;
  unit?: DoseUnit;
  doseCount?: number;
  times: string[];
  startDate?: string;
  endDate?: string | null;
  refillCount?: number;
  refillLowAt?: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedLog {
  id: string;
  medId: string;
  takenAt: string;
  scheduledFor?: string;
}
