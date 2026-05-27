export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "Price N/A";
  return `HKD ${Math.round(value).toLocaleString("en-HK")}`;
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes)) return "Duration N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function normaliseTime(v: string | undefined): string {
  if (!v) return "00:00";
  const d = new Date(v);
  if (!isNaN(d.getTime()))
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  const m = String(v).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "00:00";
}

export function parseDuration(v: string | number | undefined): number {
  if (Number.isFinite(v as number)) return v as number;
  const t = String(v || "");
  const h = t.match(/(\d+)\s*h/);
  const m = t.match(/(\d+)\s*m/);
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
}

export function stopLabel(n: number): string {
  return n === 0 ? "Non-stop" : `${n} stop${n > 1 ? "s" : ""}`;
}

export function inferBag(airline: string): number {
  return /express|low cost/i.test(airline) ? 0 : 23;
}
