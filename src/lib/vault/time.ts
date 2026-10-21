const NY = "America/New_York";

export function nyDay(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NY,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addCivilDays(day: string, delta: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + delta)).toISOString().slice(0, 10);
}

function nyParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NY,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return {
    day: `${read("year")}-${String(read("month")).padStart(2, "0")}-${String(read("day")).padStart(2, "0")}`,
    hour: read("hour"),
    minute: read("minute"),
  };
}

/** A civil New York hour on a YYYY-MM-DD, as UTC ISO. */
export function nyDateTime(day: string, hour: number, minute = 0): string {
  const [year, month, date] = day.split("-").map(Number);
  let stamp = Date.UTC(year, month - 1, date, hour + 5, minute);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const got = nyParts(new Date(stamp));
    if (got.day === day && got.hour === hour && got.minute === minute) {
      return new Date(stamp).toISOString();
    }
    const dayDelta = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${got.day}T00:00:00Z`)) / 86_400_000);
    stamp += dayDelta * 86_400_000 + (hour - got.hour) * 3_600_000 + (minute - got.minute) * 60_000;
  }
  return new Date(stamp).toISOString();
}
