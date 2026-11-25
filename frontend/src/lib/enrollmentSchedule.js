const dayMs = 24 * 60 * 60 * 1000;
const seoulOffsetMs = 9 * 60 * 60 * 1000;

export function enrollmentWindowFor(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const midnight = Date.parse(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(midnight) ||
    new Date(midnight).toISOString().slice(0, 10) !== date
  ) {
    return null;
  }
  const startsAt = midnight - seoulOffsetMs;
  return { date, startsAt, endsAt: startsAt + dayMs };
}

export function isEnrollmentOpen(schedule, now = Date.now()) {
  return Boolean(schedule && now >= schedule.startsAt && now < schedule.endsAt);
}
