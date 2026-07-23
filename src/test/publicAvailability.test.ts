import { describe, it, expect } from "vitest";
import { computeSlots } from "../../supabase/functions/_shared/availability";

describe("public-availability slot generation", () => {
  const schedules = [{ start_time: "09:00", end_time: "12:00" }];

  it("respects a 30-minute configured step", () => {
    const slots = computeSlots({
      schedules,
      busy: [],
      durationMinutes: 60,
      slotStepMinutes: 30,
    });
    expect(slots).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });

  it("respects a 15-minute configured step", () => {
    const slots = computeSlots({
      schedules,
      busy: [],
      durationMinutes: 30,
      slotStepMinutes: 15,
    });
    expect(slots).toEqual([
      "09:00", "09:15", "09:30", "09:45",
      "10:00", "10:15", "10:30", "10:45",
      "11:00", "11:15", "11:30",
    ]);
  });

  it("respects a 60-minute configured step and a longer service", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "08:00", end_time: "14:00" }],
      busy: [],
      durationMinutes: 90,
      slotStepMinutes: 60,
    });
    // 08:00, 09:00, 10:00, 11:00, 12:00 (12:00+90=13:30 ≤ 14:00)
    expect(slots).toEqual(["08:00", "09:00", "10:00", "11:00", "12:00"]);
  });

  it("supports a 4h (240 min) step for long services", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "08:00", end_time: "20:00" }],
      busy: [],
      durationMinutes: 240,
      slotStepMinutes: 240,
    });
    expect(slots).toEqual(["08:00", "12:00", "16:00"]);
  });

  it("excludes slots that overlap busy intervals", () => {
    const slots = computeSlots({
      schedules,
      busy: [{ start: 10 * 60, end: 11 * 60 }], // 10:00-11:00 busy
      durationMinutes: 30,
      slotStepMinutes: 30,
    });
    // 10:00 and 10:30 removed
    expect(slots).toEqual(["09:00", "09:30", "11:00", "11:30"]);
  });

  it("skips past + buffered slots when computing for today", () => {
    const slots = computeSlots({
      schedules,
      busy: [],
      durationMinutes: 30,
      slotStepMinutes: 30,
      isToday: true,
      nowMinutes: 9 * 60 + 15, // 09:15 with 30-min buffer -> first allowed > 09:45
      sameDayBufferMinutes: 30,
    });
    expect(slots).toEqual(["10:00", "10:30", "11:00", "11:30"]);
  });
});
