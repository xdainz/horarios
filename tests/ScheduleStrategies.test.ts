import { describe, expect, test } from "bun:test";
import {
    computeStats,
    sortSchedules,
} from "../src/service/ScheduleStrategies";
import type { Section } from "../src/types/types";

function section(
    seccion: string,
    blocks: [day: number, start: number, end: number][],
): Section {
    return {
        sigla: seccion,
        nombre: seccion,
        seccion,
        nivel: 1,
        isVirtual: false,
        docente: "",
        blocks: blocks.map(([day, start, end]) => ({ day, start, end })),
    };
}

describe("computeStats", () => {
    test("counts gaps between classes on the same day", () => {
        const stats = computeStats([
            section("A", [[0, 480, 540]]),
            section("B", [[0, 600, 660]]),
        ]);
        expect(stats.gapMinutes).toBe(60);
    });

    test("short built-in breaks (<= 15 min) are not gaps", () => {
        const stats = computeStats([
            section("A", [[0, 480, 540]]),
            section("B", [[0, 555, 615]]),
        ]);
        expect(stats.gapMinutes).toBe(0);
    });

    test("free days exclude any day with at least one block", () => {
        const stats = computeStats([
            section("A", [
                [0, 480, 540],
                [2, 480, 540],
            ]),
        ]);
        expect(stats.freeDays).toBe(4);
        expect(stats.freeDayNames).toEqual(["Ma", "Ju", "Vi", "Sa"]);
    });

    test("average start/end are per-day means", () => {
        const stats = computeStats([
            section("A", [[0, 480, 540]]), // Lu 8:00-9:00
            section("B", [[1, 600, 660]]), // Ma 10:00-11:00
        ]);
        expect(stats.avgStart).toBe(540); // (480+600)/2
        expect(stats.avgEnd).toBe(600); // (540+660)/2
    });

    test("empty schedule has zeroed stats and all days free", () => {
        const stats = computeStats([]);
        expect(stats.gapMinutes).toBe(0);
        expect(stats.freeDays).toBe(6);
        expect(stats.avgStart).toBe(0);
    });
});

describe("sortSchedules", () => {
    const withGap = [
        section("A", [[0, 480, 540]]),
        section("B", [[0, 600, 660]]),
    ];
    const compactTwoDays = [
        section("A", [[0, 480, 540]]),
        section("B", [[1, 480, 540]]),
    ];
    const lateOneDay = [section("A", [[0, 1000, 1060]])];

    test("no strategies keeps original order", () => {
        const result = sortSchedules([withGap, compactTwoDays], []);
        expect(result[0].schedule).toBe(withGap);
        expect(result[1].schedule).toBe(compactTwoDays);
    });

    test("compact ranks the schedule without gaps first", () => {
        const result = sortSchedules([withGap, compactTwoDays], ["compact"]);
        expect(result[0].schedule).toBe(compactTwoDays);
    });

    test("freeDays ranks the schedule with more free days first", () => {
        const result = sortSchedules([withGap, compactTwoDays], ["freeDays"]);
        expect(result[0].schedule).toBe(withGap);
    });

    test("early prefers earlier average start, late the opposite", () => {
        const early = sortSchedules([lateOneDay, withGap], ["early"]);
        expect(early[0].schedule).toBe(withGap);
        const late = sortSchedules([lateOneDay, withGap], ["late"]);
        expect(late[0].schedule).toBe(lateOneDay);
    });

    test("stats ride along with each schedule", () => {
        const result = sortSchedules([withGap], ["compact"]);
        expect(result[0].stats.gapMinutes).toBe(60);
    });
});
