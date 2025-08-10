import { Router } from "express";
import { randomUUID } from "crypto";
const r = Router();

// TEMP in-memory store (swap to DB later)
const meds: any[] = [];
const logs: any[] = [];

r.get("/", (_req, res) => res.json(meds));

r.post("/", (req, res) => {
  const now = new Date().toISOString();
  const med = { id: randomUUID(), active: true, createdAt: now, updatedAt: now, ...req.body };
  meds.unshift(med);
  res.status(201).json(med);
});

r.put("/:id", (req, res) => {
  const i = meds.findIndex(m => m.id === req.params.id);
  if (i === -1) return res.sendStatus(404);
  meds[i] = { ...meds[i], ...req.body, updatedAt: new Date().toISOString() };
  res.json(meds[i]);
});

r.delete("/:id", (req, res) => {
  const i = meds.findIndex(m => m.id === req.params.id);
  if (i === -1) return res.sendStatus(404);
  meds.splice(i, 1);
  res.sendStatus(204);
});

r.get("/:id/logs", (req, res) => res.json(logs.filter(l => l.medId === req.params.id)));

r.post("/:id/logs", (req, res) => {
  const log = { id: randomUUID(), medId: req.params.id, takenAt: new Date().toISOString(), ...req.body };
  logs.push(log);
  res.status(201).json(log);
});

export default r;
