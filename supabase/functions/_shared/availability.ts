// Pure slot-generation logic shared between the edge function and tests.
// Keep dependency-free so it runs under both Deno and Vitest/Node.

export interface ScheduleBlock {
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
}

export interface BusyInterval {
  start: number; // minutes from 00:00
  end: number;
}

export interface ComputeSlotsInput {
  schedules: ScheduleBlock[];
  busy: BusyInterval[];
  durationMinutes: number;
  slotStepMinutes: number;
  isToday?: boolean;
  nowMinutes?: number; // required when isToday is true
  sameDayBufferMinutes?: number; // default 30
}

export function toMinutes(hms: string): number {
  const [h, m] = hms.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(t: number): string {
  const h = Math.floor(t / 60).toString().padStart(2, "0");
  const m = (t % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function computeSlots(input: ComputeSlotsInput): string[] {
  const {
    schedules,
    busy,
    durationMinutes,
    slotStepMinutes,
    isToday = false,
    nowMinutes = -1,
    sameDayBufferMinutes = 30,
  } = input;

  const slots: string[] = [];
  for (const block of schedules) {
    const blockStart = toMinutes(block.start_time);
    const blockEnd = toMinutes(block.end_time);
    for (let t = blockStart; t + durationMinutes <= blockEnd; t += slotStepMinutes) {
      if (isToday && t <= nowMinutes + sameDayBufferMinutes) continue;
      const slotEnd = t + durationMinutes;
      const conflict = busy.some((b) => t < b.end && slotEnd > b.start);
      if (!conflict) slots.push(fromMinutes(t));
    }
  }
  return slots;
}
