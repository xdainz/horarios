import { describe, expect, test } from "bun:test";
import {
    compatibleElectives,
    generateSchedules,
    groupSections,
    matchesJornada,
    parseHorario,
    sectionConflicts,
} from "../src/service/ScheduleGenerator";
import type { Asignatura, Section, TimeBlock } from "../src/types/types";

function row(partial: Partial<Asignatura>): Asignatura {
    return {
        Sede: "",
        Carrera: "",
        Plan: 0,
        Jornada: "Diurno",
        SiglaAsignatura: "",
        NombreAsignatura: "",
        Nivel: 1,
        Seccion: "",
        Horario: "",
        Docente: "",
        IsVirtual: null,
        ...partial,
    };
}

function section(
    sigla: string,
    seccion: string,
    blocks: [day: number, start: number, end: number][],
): Section {
    return {
        sigla,
        nombre: sigla,
        seccion,
        nivel: 1,
        isVirtual: false,
        docente: "",
        blocks: blocks.map(([day, start, end]) => ({ day, start, end })),
    };
}

describe("parseHorario", () => {
    test("parses a standard block", () => {
        expect(parseHorario("Lu 14:31:00 - 15:50:00")).toEqual({
            day: 0,
            start: 14 * 60 + 31,
            end: 15 * 60 + 50,
        });
    });

    test("parses every known day", () => {
        const days = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
        days.forEach((d, i) => {
            expect(parseHorario(`${d} 8:01:00 - 9:20:00`)?.day).toBe(i);
        });
    });

    test("tolerates surrounding whitespace and single-digit hours", () => {
        expect(parseHorario("  Vi 8:01:00 - 9:20:00  ")).toEqual({
            day: 4,
            start: 481,
            end: 560,
        });
    });

    test("returns null for the async-class placeholder", () => {
        expect(parseHorario("0:00:00 - 0:00:00")).toBeNull();
    });

    test("returns null for unknown days", () => {
        expect(parseHorario("Do 8:01:00 - 9:20:00")).toBeNull();
    });

    test("returns null when end is not after start", () => {
        expect(parseHorario("Lu 10:00:00 - 10:00:00")).toBeNull();
        expect(parseHorario("Lu 10:00:00 - 9:00:00")).toBeNull();
    });

    test("returns null for garbage", () => {
        expect(parseHorario("")).toBeNull();
        expect(parseHorario("Lunes 10:00 - 11:00")).toBeNull();
    });
});

describe("matchesJornada", () => {
    test("matches exact jornada", () => {
        expect(matchesJornada(row({ Jornada: "Diurno" }), "Diurno")).toBe(true);
        expect(matchesJornada(row({ Jornada: "Diurno" }), "Vespertino")).toBe(
            false,
        );
    });

    test("mixed jornada matches both", () => {
        const a = row({ Jornada: "Diurno y Vespertino" });
        expect(matchesJornada(a, "Diurno")).toBe(true);
        expect(matchesJornada(a, "Vespertino")).toBe(true);
    });
});

describe("groupSections", () => {
    test("merges rows of the same section into one section with all blocks", () => {
        const rows = [
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "MAT1-001D",
                Horario: "Lu 8:01:00 - 9:20:00",
            }),
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "MAT1-001D",
                Horario: "Mi 8:01:00 - 9:20:00",
            }),
        ];
        const grouped = groupSections(rows);
        const sections = grouped.get("MAT1")!;
        expect(sections).toHaveLength(1);
        expect(sections[0].blocks).toHaveLength(2);
    });

    test("blocks are sorted by day then start", () => {
        const rows = [
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "MAT1-001D",
                Horario: "Mi 8:01:00 - 9:20:00",
            }),
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "MAT1-001D",
                Horario: "Lu 10:01:00 - 11:20:00",
            }),
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "MAT1-001D",
                Horario: "Lu 8:01:00 - 9:20:00",
            }),
        ];
        const blocks = groupSections(rows).get("MAT1")![0].blocks;
        expect(blocks.map((b) => [b.day, b.start])).toEqual([
            [0, 481],
            [0, 601],
            [2, 481],
        ]);
    });

    test("drops sections whose weekly schedule is identical to another", () => {
        const rows = [
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "MAT1-001D",
                Horario: "Lu 8:01:00 - 9:20:00",
            }),
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "MAT1-002D",
                Horario: "Lu 8:01:00 - 9:20:00",
            }),
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "MAT1-003D",
                Horario: "Ma 8:01:00 - 9:20:00",
            }),
        ];
        const sections = groupSections(rows).get("MAT1")!;
        expect(sections.map((s) => s.seccion)).toEqual([
            "MAT1-001D",
            "MAT1-003D",
        ]);
    });

    test("a section code reused by a different subject does not merge", () => {
        const rows = [
            row({
                SiglaAsignatura: "MAT1",
                Seccion: "001D",
                Horario: "Lu 8:01:00 - 9:20:00",
            }),
            row({
                SiglaAsignatura: "FIS1",
                Seccion: "001D",
                Horario: "Ma 8:01:00 - 9:20:00",
            }),
        ];
        const grouped = groupSections(rows);
        expect(grouped.get("MAT1")![0].blocks[0].day).toBe(0);
        expect(grouped.get("FIS1")![0].blocks[0].day).toBe(1);
    });

    test("unparseable horarios become sections with no blocks", () => {
        const rows = [
            row({
                SiglaAsignatura: "ONL1",
                Seccion: "ONL1-001V",
                Horario: "0:00:00 - 0:00:00",
            }),
        ];
        expect(groupSections(rows).get("ONL1")![0].blocks).toHaveLength(0);
    });
});

describe("sectionConflicts", () => {
    const placed: TimeBlock[] = [{ day: 0, start: 480, end: 560 }];

    test("overlapping block on the same day conflicts", () => {
        expect(
            sectionConflicts(section("X", "X-1", [[0, 500, 600]]), placed),
        ).toBe(true);
    });

    test("touching blocks (end == start) do not conflict", () => {
        expect(
            sectionConflicts(section("X", "X-1", [[0, 560, 620]]), placed),
        ).toBe(false);
    });

    test("same time on another day does not conflict", () => {
        expect(
            sectionConflicts(section("X", "X-1", [[1, 480, 560]]), placed),
        ).toBe(false);
    });
});

describe("generateSchedules", () => {
    test("returns the full cartesian product when nothing conflicts", () => {
        const { schedules, capped } = generateSchedules([
            [
                section("A", "A-1", [[0, 480, 560]]),
                section("A", "A-2", [[1, 480, 560]]),
            ],
            [
                section("B", "B-1", [[2, 480, 560]]),
                section("B", "B-2", [[3, 480, 560]]),
            ],
        ]);
        expect(schedules).toHaveLength(4);
        expect(capped).toBe(false);
    });

    test("excludes combinations with overlaps", () => {
        const { schedules } = generateSchedules([
            [
                section("A", "A-1", [[0, 480, 560]]),
                section("A", "A-2", [[1, 480, 560]]),
            ],
            [section("B", "B-1", [[0, 500, 580]])], // clashes with A-1
        ]);
        expect(schedules).toHaveLength(1);
        expect(schedules[0].map((s) => s.seccion).sort()).toEqual([
            "A-2",
            "B-1",
        ]);
    });

    test("returns empty when every combination clashes", () => {
        const { schedules } = generateSchedules([
            [section("A", "A-1", [[0, 480, 560]])],
            [section("B", "B-1", [[0, 480, 560]])],
        ]);
        expect(schedules).toHaveLength(0);
    });

    test("every schedule picks exactly one section per subject", () => {
        const { schedules } = generateSchedules([
            [
                section("A", "A-1", [[0, 480, 560]]),
                section("A", "A-2", [[1, 480, 560]]),
            ],
            [section("B", "B-1", [[2, 480, 560]])],
        ]);
        for (const schedule of schedules) {
            expect(schedule.map((s) => s.sigla).sort()).toEqual(["A", "B"]);
        }
    });

    test("stops at the cap and reports it", () => {
        const sections = [1, 2, 3, 4].map((i) =>
            section("A", `A-${i}`, [[i % 5, 480, 560]]),
        );
        const { schedules, capped } = generateSchedules([sections], 2);
        expect(schedules).toHaveLength(2);
        expect(capped).toBe(true);
    });

    test("empty input yields no schedules", () => {
        const { schedules, capped } = generateSchedules([]);
        expect(schedules).toHaveLength(0);
        expect(capped).toBe(false);
    });
});

describe("compatibleElectives", () => {
    test("keeps only sections that fit and drops fully clashing electives", () => {
        const schedule = [section("A", "A-1", [[0, 480, 560]])];
        const electives = new Map<string, Section[]>([
            [
                "OPT1",
                [
                    section("OPT1", "OPT1-1", [[0, 500, 600]]), // clashes
                    section("OPT1", "OPT1-2", [[1, 480, 560]]), // fits
                ],
            ],
            ["OPT2", [section("OPT2", "OPT2-1", [[0, 480, 560]])]], // clashes
        ]);
        const result = compatibleElectives(schedule, electives);
        expect(result).toHaveLength(1);
        expect(result[0].sigla).toBe("OPT1");
        expect(result[0].sections.map((s) => s.seccion)).toEqual(["OPT1-2"]);
    });
});
