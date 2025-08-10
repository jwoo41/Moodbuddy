import { useEffect, useState } from "react";
import { listMeds, createMed, updateMed, logDose } from "../api/meds";
import type { Med } from "../../../shared/types/meds";
import { scheduleLocalNotificationsForMed, cancelNotificationsForMed } from "../utils/notifications";

export default function MedsPage() {
  const [meds, setMeds] = useState<Med[]>([]);
  const [form, setForm] = useState<Partial<Med>>({ name: "", times: ["08:00"], doseCount: 1, unit: "mg", refillLowAt: 5 });

  useEffect(() => { listMeds().then(setMeds); }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const med = await createMed({ ...form, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), active: true });
    setMeds(m => [med, ...m]);
    await scheduleLocalNotificationsForMed(med);
    setForm({ name: "", times: ["08:00"], doseCount: 1, unit: "mg", refillLowAt: 5 });
  }

  async function onToggleActive(med: Med) {
    const updated = await updateMed(med.id, { active: !med.active });
    setMeds(ms => ms.map(m => m.id === med.id ? updated : m));
    if (updated.active) await scheduleLocalNotificationsForMed(updated);
    else await cancelNotificationsForMed(updated);
  }

  async function onTakeNow(med: Med, scheduledFor?: string) {
    await logDose(med.id, { scheduledFor });
    if (typeof med.refillCount === "number") {
      const left = (med.refillCount ?? 0) - 1;
      const updated = await updateMed(med.id, { refillCount: left });
      setMeds(ms => ms.map(m => m.id === med.id ? updated : m));
      if (updated.refillLowAt && left <= updated.refillLowAt) alert(`Heads up: low on ${updated.name}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Medication</h1>
      <form onSubmit={onAdd} className="space-y-2 bg-white/50 rounded-2xl p-4 shadow">
        <input className="w-full border rounded p-2" placeholder="Name (e.g., Lithium)"
          value={form.name||""} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/>
        <div className="flex gap-2">
          <input className="w-24 border rounded p-2" type="number" placeholder="Strength"
            value={form.strength||""} onChange={e=>setForm(f=>({...f, strength:Number(e.target.value)}))}/>
          <select className="border rounded p-2" value={form.unit||"mg"}
            onChange={e=>setForm(f=>({...f, unit:e.target.value as any}))}>
            <option>mg</option><option>mcg</option><option>mL</option><option>tab</option><option>capsule</option>
          </select>
          <input className="w-24 border rounded p-2" type="number" placeholder="# per dose"
            value={form.doseCount||1} onChange={e=>setForm(f=>({...f, doseCount:Number(e.target.value)}))}/>
        </div>
        <div className="flex flex-wrap gap-2">
          {(form.times||["08:00"]).map((t,i)=>(
            <input key={i} type="time" className="border rounded p-2"
              value={t} onChange={e=>setForm(f=>({...f, times:(f.times||[]).map((x,xi)=>xi===i?e.target.value:x)}))}/>
          ))}
          <button type="button" className="px-3 py-2 border rounded"
            onClick={()=>setForm(f=>({...f, times:[...(f.times||[]), "20:00"]}))}>+ time</button>
        </div>
        <div className="flex gap-2">
          <input className="w-24 border rounded p-2" type="number" placeholder="On hand"
            value={form.refillCount||""} onChange={e=>setForm(f=>({...f, refillCount:Number(e.target.value)}))}/>
          <input className="w-24 border rounded p-2" type="number" placeholder="Warn at"
            value={form.refillLowAt||""} onChange={e=>setForm(f=>({...f, refillLowAt:Number(e.target.value)}))}/>
        </div>
        <button className="px-4 py-2 rounded-2xl shadow border">Add medication</button>
      </form>
      <ul className="space-y-3">
        {meds.map(m=>(
          <li key={m.id} className="p-3 rounded-2xl shadow bg-white/70 flex items-center justify-between">
            <div>
              <div className="font-semibold">{m.name} {m.strength ? `${m.strength}${m.unit||""}`:""} x{m.doseCount||1}</div>
              <div className="text-sm opacity-70">Times: {(m.times||[]).join(", ")}</div>
              {typeof m.refillCount==="number" && <div className="text-xs opacity-70">On hand: {m.refillCount}</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>onTakeNow(m)} className="px-3 py-2 border rounded">Take now</button>
              <button onClick={()=>onToggleActive(m)} className="px-3 py-2 border rounded">{m.active?"Pause":"Resume"}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
