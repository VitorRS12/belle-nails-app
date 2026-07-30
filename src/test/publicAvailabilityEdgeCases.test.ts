import { describe, it, expect } from "vitest";
import { computeSlots, toMinutes, fromMinutes } from "../../supabase/functions/_shared/availability";

describe("public-availability — limites de horário", () => {
  it("inclui o primeiro slot exatamente no início do expediente", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "00:00", end_time: "02:00" }],
      busy: [],
      durationMinutes: 60,
      slotStepMinutes: 60,
    });
    expect(slots[0]).toBe("00:00");
    expect(slots).toEqual(["00:00", "01:00"]);
  });

  it("inclui um slot que termina exatamente no fim do expediente", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "22:00", end_time: "24:00" }],
      busy: [],
      durationMinutes: 60,
      slotStepMinutes: 60,
    });
    expect(slots).toEqual(["22:00", "23:00"]);
  });

  it("não gera slot que ultrapasse o fim do expediente", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "09:00", end_time: "10:30" }],
      busy: [],
      durationMinutes: 60,
      slotStepMinutes: 30,
    });
    // 09:00 e 09:30 cabem; 10:00+60=11:00 > 10:30
    expect(slots).toEqual(["09:00", "09:30"]);
  });

  it("retorna vazio quando a duração é maior que a janela", () => {
    expect(
      computeSlots({
        schedules: [{ start_time: "09:00", end_time: "09:45" }],
        busy: [],
        durationMinutes: 60,
        slotStepMinutes: 15,
      }),
    ).toEqual([]);
  });

  it("retorna vazio quando não há expediente cadastrado", () => {
    expect(
      computeSlots({ schedules: [], busy: [], durationMinutes: 30, slotStepMinutes: 30 }),
    ).toEqual([]);
  });

  it("aceita horários com segundos (HH:MM:SS) vindos do banco", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "09:00:00", end_time: "10:00:00" }],
      busy: [],
      durationMinutes: 30,
      slotStepMinutes: 30,
    });
    expect(slots).toEqual(["09:00", "09:30"]);
  });

  it("suporta múltiplos blocos (manhã e tarde) sem vazar no intervalo de almoço", () => {
    const slots = computeSlots({
      schedules: [
        { start_time: "09:00", end_time: "11:00" },
        { start_time: "13:00", end_time: "15:00" },
      ],
      busy: [],
      durationMinutes: 60,
      slotStepMinutes: 60,
    });
    expect(slots).toEqual(["09:00", "10:00", "13:00", "14:00"]);
  });
});

describe("public-availability — intervalos ímpares", () => {
  it("gera slots com passo de 25 minutos", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "09:00", end_time: "11:00" }],
      busy: [],
      durationMinutes: 25,
      slotStepMinutes: 25,
    });
    expect(slots).toEqual([
      "09:00", "09:25", "09:50", "10:15", "10:40",
    ]);
  });

  it("gera slots com passo de 7 minutos e formata corretamente", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "09:00", end_time: "09:30" }],
      busy: [],
      durationMinutes: 7,
      slotStepMinutes: 7,
    });
    expect(slots).toEqual(["09:00", "09:07", "09:14", "09:21"]);
  });

  it("permite passo menor que a duração (slots sobrepostos na oferta)", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "09:00", end_time: "10:30" }],
      busy: [],
      durationMinutes: 45,
      slotStepMinutes: 15,
    });
    expect(slots).toEqual(["09:00", "09:15", "09:30", "09:45"]);
  });

  it("permite passo maior que a duração (folga entre atendimentos)", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "09:00", end_time: "12:00" }],
      busy: [],
      durationMinutes: 20,
      slotStepMinutes: 45,
    });
    expect(slots).toEqual(["09:00", "09:45", "10:30", "11:15"]);
  });

  it("mantém sempre o formato HH:MM com zero à esquerda", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "08:05", end_time: "09:00" }],
      busy: [],
      durationMinutes: 10,
      slotStepMinutes: 11,
    });
    slots.forEach((s) => expect(s).toMatch(/^\d{2}:\d{2}$/));
    expect(slots[0]).toBe("08:05");
  });
});

describe("public-availability — horários ocupados", () => {
  const schedules = [{ start_time: "09:00", end_time: "13:00" }];

  it("remove slot que começa dentro de um agendamento existente", () => {
    const slots = computeSlots({
      schedules,
      busy: [{ start: toMinutes("10:00"), end: toMinutes("11:00") }],
      durationMinutes: 30,
      slotStepMinutes: 30,
    });
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("09:30");
    expect(slots).toContain("11:00");
  });

  it("remove slot cujo fim invade um agendamento existente", () => {
    const slots = computeSlots({
      schedules,
      busy: [{ start: toMinutes("10:00"), end: toMinutes("11:00") }],
      durationMinutes: 60,
      slotStepMinutes: 30,
    });
    // 09:30 + 60 = 10:30 -> conflita
    expect(slots).not.toContain("09:30");
    expect(slots).toContain("09:00");
    expect(slots).toContain("11:00");
  });

  it("permite slot que encosta no início e no fim de um ocupado (sem sobreposição)", () => {
    const slots = computeSlots({
      schedules,
      busy: [{ start: toMinutes("10:00"), end: toMinutes("11:00") }],
      durationMinutes: 60,
      slotStepMinutes: 60,
    });
    expect(slots).toContain("09:00"); // termina 10:00
    expect(slots).toContain("11:00"); // começa 11:00
    expect(slots).not.toContain("10:00");
  });

  it("lida com múltiplos ocupados, inclusive adjacentes", () => {
    const slots = computeSlots({
      schedules,
      busy: [
        { start: toMinutes("09:00"), end: toMinutes("10:00") },
        { start: toMinutes("10:00"), end: toMinutes("11:00") },
        { start: toMinutes("12:00"), end: toMinutes("12:30") },
      ],
      durationMinutes: 30,
      slotStepMinutes: 30,
    });
    expect(slots).toEqual(["11:00", "11:30", "12:30"]);
  });

  it("retorna vazio quando o dia inteiro está ocupado", () => {
    const slots = computeSlots({
      schedules,
      busy: [{ start: toMinutes("09:00"), end: toMinutes("13:00") }],
      durationMinutes: 30,
      slotStepMinutes: 30,
    });
    expect(slots).toEqual([]);
  });

  it("ignora ocupados fora da janela de expediente", () => {
    const slots = computeSlots({
      schedules: [{ start_time: "09:00", end_time: "11:00" }],
      busy: [
        { start: toMinutes("07:00"), end: toMinutes("08:00") },
        { start: toMinutes("18:00"), end: toMinutes("19:00") },
      ],
      durationMinutes: 60,
      slotStepMinutes: 60,
    });
    expect(slots).toEqual(["09:00", "10:00"]);
  });

  it("combina ocupados com o buffer de mesmo dia", () => {
    const slots = computeSlots({
      schedules,
      busy: [{ start: toMinutes("11:00"), end: toMinutes("12:00") }],
      durationMinutes: 60,
      slotStepMinutes: 60,
      isToday: true,
      nowMinutes: toMinutes("09:10"),
      sameDayBufferMinutes: 30,
    });
    // 09:00 já passou/bufferizado, 11:00 ocupado
    expect(slots).toEqual(["10:00", "12:00"]);
  });
});

describe("helpers de tempo", () => {
  it("converte ida e volta corretamente", () => {
    expect(fromMinutes(toMinutes("00:00"))).toBe("00:00");
    expect(fromMinutes(toMinutes("23:59"))).toBe("23:59");
    expect(fromMinutes(toMinutes("07:05"))).toBe("07:05");
  });
});
