import { LocalNotifications } from "@capacitor/local-notifications";
import type { Med } from "../../../shared/types/meds";

async function ensurePermission() {
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") await LocalNotifications.requestPermissions();
}

export async function scheduleLocalNotificationsForMed(med: Med) {
  await ensurePermission();
  const base = Math.abs(med.id.split('').reduce((a,c)=>a + c.charCodeAt(0), 0)) % 100000;
  const notifs = (med.times || []).map((t, idx) => {
    const [h, min] = t.split(":").map(Number);
    return {
      id: base + idx,
      title: "Medication reminder",
      body: `${med.name} ${med.strength ?? ""}${med.unit ?? ""} x${med.doseCount ?? 1}`,
      schedule: { on: { hour: h, minute: min }, allowWhileIdle: true },
      smallIcon: "ic_stat_icon_config_sample",
    } as any;
  });
  await LocalNotifications.schedule({ notifications: notifs });
}

export async function cancelNotificationsForMed(med: Med) {
  const base = Math.abs(med.id.split('').reduce((a,c)=>a + c.charCodeAt(0), 0)) % 100000;
  const ids = (med.times || []).map((_, i) => base + i);
  await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
}
