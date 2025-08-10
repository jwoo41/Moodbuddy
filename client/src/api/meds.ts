import type { Med, MedLog } from "../../../shared/types/meds";
const base = "/api/meds";

export async function listMeds(): Promise<Med[]> {
  const r = await fetch(base); return r.json();
}
export async function createMed(m: Partial<Med>): Promise<Med> {
  const r = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) });
  return r.json();
}
export async function updateMed(id: string, patch: Partial<Med>): Promise<Med> {
  const r = await fetch(`${base}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
  return r.json();
}
export async function logDose(id: string, payload: Partial<MedLog>): Promise<MedLog> {
  const r = await fetch(`${base}/${id}/logs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  return r.json();
}
