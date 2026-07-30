import { describe, expect, it } from "vitest";
import {
  isScheduleAvailable,
  isValidTimeWindow,
  listAvailableSlots,
  SAME_DAY_CUTOFF_HOUR,
  SCHEDULING_WINDOW_DAYS,
  TIME_WINDOWS,
} from "@/core/scheduling/rules";

describe("listAvailableSlots", () => {
  it("builds SCHEDULING_WINDOW_DAYS days of every time window", () => {
    const now = new Date("2026-01-15T08:00:00");
    const slots = listAvailableSlots(now, "delivery");
    expect(slots).toHaveLength(SCHEDULING_WINDOW_DAYS * TIME_WINDOWS.length);
  });

  it("disables today's slots whose window has already started", () => {
    const now = new Date("2026-01-15T11:00:00");
    const slots = listAvailableSlots(now, "delivery");
    const today = slots.filter((slot) => slot.date === "2026-01-15");
    expect(today.find((s) => s.timeWindow === "10:00-12:00")?.available).toBe(false);
    expect(today.find((s) => s.timeWindow === "12:00-14:00")?.available).toBe(true);
  });

  it("disables every slot today once past the same-day cutoff hour", () => {
    const now = new Date(`2026-01-15T${SAME_DAY_CUTOFF_HOUR}:30:00`);
    const slots = listAvailableSlots(now, "delivery");
    const today = slots.filter((slot) => slot.date === "2026-01-15");
    expect(today.every((s) => !s.available)).toBe(true);
  });

  it("leaves every future day's slots available", () => {
    const now = new Date(`2026-01-15T${SAME_DAY_CUTOFF_HOUR}:30:00`);
    const slots = listAvailableSlots(now, "delivery");
    const tomorrow = slots.filter((slot) => slot.date === "2026-01-16");
    expect(tomorrow.every((s) => s.available)).toBe(true);
  });

  it("returns the same fixed windows for pickup", () => {
    const now = new Date("2026-01-15T08:00:00");
    const deliverySlots = listAvailableSlots(now, "delivery");
    const pickupSlots = listAvailableSlots(now, "pickup");
    expect(pickupSlots).toEqual(deliverySlots);
  });
});

describe("isValidTimeWindow", () => {
  it("accepts a known window", () => {
    expect(isValidTimeWindow("10:00-12:00")).toBe(true);
  });

  it("rejects an unknown window", () => {
    expect(isValidTimeWindow("09:00-10:00")).toBe(false);
  });
});

describe("isScheduleAvailable", () => {
  it("accepts a valid, available slot", () => {
    const now = new Date("2026-01-15T08:00:00");
    expect(isScheduleAvailable(now, "delivery", { date: "2026-01-16", timeWindow: "10:00-12:00" })).toBe(true);
  });

  it("rejects a slot whose window has already started today", () => {
    const now = new Date("2026-01-15T11:00:00");
    expect(isScheduleAvailable(now, "delivery", { date: "2026-01-15", timeWindow: "10:00-12:00" })).toBe(false);
  });

  it("rejects an unrecognized time window even on a valid date", () => {
    const now = new Date("2026-01-15T08:00:00");
    expect(isScheduleAvailable(now, "delivery", { date: "2026-01-16", timeWindow: "not-a-window" })).toBe(false);
  });

  it("rejects a date outside the scheduling window", () => {
    const now = new Date("2026-01-15T08:00:00");
    expect(isScheduleAvailable(now, "delivery", { date: "2026-03-01", timeWindow: "10:00-12:00" })).toBe(false);
  });
});
