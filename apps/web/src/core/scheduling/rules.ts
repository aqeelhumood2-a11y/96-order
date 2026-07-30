import type { FulfillmentMethod, FulfillmentSchedule } from "@/core/delivery/entities";

/**
 * Fixed, identical time windows for both delivery and pickup — the spec's
 * "delivery vs pickup availability" is satisfied by both methods sharing
 * this one simple rule set rather than needing per-method logic, which
 * this file leaves room for (`listAvailableSlots` already takes a
 * `method` parameter, currently unused by the rule itself) if a real
 * difference is ever needed. Deliberately simple, fixed slots — no
 * route-planning or per-driver capacity engine.
 */
export const TIME_WINDOWS = ["10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00"] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];

/** Orders placed at or after this local hour can no longer book a same-day slot at all. */
export const SAME_DAY_CUTOFF_HOUR = 14;

/** How many days ahead (including today) a shopper can pick a slot for. */
export const SCHEDULING_WINDOW_DAYS = 7;

export interface AvailableSlot {
  date: string;
  timeWindow: TimeWindow;
  available: boolean;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function windowStartHour(timeWindow: TimeWindow): number {
  return Number(timeWindow.split(":")[0]);
}

/**
 * Capacity-limit seam: Phase 5 has no real capacity tracking, so every
 * slot is always "not at capacity." A future capacity system (e.g. a
 * per-slot booked-count Firestore doc) plugs in by replacing this one
 * function's body — every caller already goes through it rather than
 * assuming unlimited capacity inline.
 */
export function isSlotAtCapacity(_date: string, _timeWindow: TimeWindow): boolean {
  return false;
}

/**
 * Builds `SCHEDULING_WINDOW_DAYS` days of slots starting today, marking a
 * slot unavailable when: it's today and past the same-day cutoff hour,
 * it's today and the window's own start time has already passed, or the
 * capacity seam says so. `now` is a parameter (not read internally) so
 * this stays a pure, deterministically testable function — the caller
 * supplies the real current time.
 */
export function listAvailableSlots(now: Date, _method: FulfillmentMethod): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const pastSameDayCutoff = currentHour >= SAME_DAY_CUTOFF_HOUR;

  for (let dayOffset = 0; dayOffset < SCHEDULING_WINDOW_DAYS; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const isoDate = toIsoDate(date);
    const isToday = dayOffset === 0;

    for (const timeWindow of TIME_WINDOWS) {
      let available = true;
      if (isToday && pastSameDayCutoff) available = false;
      else if (isToday && windowStartHour(timeWindow) <= currentHour) available = false;
      else if (isSlotAtCapacity(isoDate, timeWindow)) available = false;

      slots.push({ date: isoDate, timeWindow, available });
    }
  }

  return slots;
}

export function isValidTimeWindow(value: string): value is TimeWindow {
  return (TIME_WINDOWS as readonly string[]).includes(value);
}

/** Server-side validation for a submitted `FulfillmentSchedule` — re-derives availability from `now` rather than trusting the client's own idea of what's bookable. */
export function isScheduleAvailable(now: Date, method: FulfillmentMethod, schedule: FulfillmentSchedule): boolean {
  if (!isValidTimeWindow(schedule.timeWindow)) return false;
  return listAvailableSlots(now, method).some(
    (slot) => slot.date === schedule.date && slot.timeWindow === schedule.timeWindow && slot.available,
  );
}
