import type { Section, TimeBlock } from "../types/types";
import { DAY_NAMES } from "./ScheduleGenerator";

export type StrategyKey = "compact" | "freeDays" | "early" | "late";

export const STRATEGIES: {
    key: StrategyKey;
    label: string;
    description: string;
}[] = [
    {
        key: "compact",
        label: "⚡ Sin ventanas",
        description: "Minimiza los tiempos muertos entre clases",
    },
    {
        key: "freeDays",
        label: "🏖️ Días libres",
        description: "Maximiza los días sin clases",
    },
    {
        key: "early",
        label: "🌅 Clases temprano",
        description: "Prefiere horarios que parten en la mañana",
    },
    {
        key: "late",
        label: "🌙 Clases tarde",
        description: "Prefiere horarios vespertinos",
    },
];

// strategies that can't be active at the same time
export const CONFLICTING: Partial<Record<StrategyKey, StrategyKey>> = {
    early: "late",
    late: "early",
};

export interface ScheduleStats {
    gapMinutes: number;
    freeDays: number;
    freeDayNames: string[];
    avgStart: number;
    avgEnd: number;
}

export interface ScoredSchedule {
    schedule: Section[];
    stats: ScheduleStats;
}

// breaks built into consecutive class blocks (~10 min) don't count as a gap
const MIN_GAP = 15;

export function computeStats(schedule: Section[]): ScheduleStats {
    const byDay = new Map<number, TimeBlock[]>();
    for (const section of schedule) {
        for (const block of section.blocks) {
            const list = byDay.get(block.day);
            if (list) list.push(block);
            else byDay.set(block.day, [block]);
        }
    }

    let gapMinutes = 0;
    const starts: number[] = [];
    const ends: number[] = [];
    for (const blocks of byDay.values()) {
        blocks.sort((a, b) => a.start - b.start);
        starts.push(blocks[0].start);
        ends.push(blocks[blocks.length - 1].end);
        for (let i = 1; i < blocks.length; i++) {
            const gap = blocks[i].start - blocks[i - 1].end;
            if (gap > MIN_GAP) gapMinutes += gap;
        }
    }

    const mean = (xs: number[]) =>
        xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    const freeDayNames = DAY_NAMES.filter((_, day) => !byDay.has(day));

    return {
        gapMinutes,
        freeDays: freeDayNames.length,
        freeDayNames,
        avgStart: mean(starts),
        avgEnd: mean(ends),
    };
}

// higher = better for each strategy
const METRIC: Record<StrategyKey, (s: ScheduleStats) => number> = {
    compact: (s) => -s.gapMinutes,
    freeDays: (s) => s.freeDays,
    early: (s) => -s.avgStart,
    late: (s) => s.avgStart,
};

// Sort schedules by how well they match the selected strategies. Each metric
// is normalized to 0..1 across the result set and summed with equal weight.
export function sortSchedules(
    schedules: Section[][],
    strategies: StrategyKey[],
): ScoredSchedule[] {
    const entries: ScoredSchedule[] = schedules.map((schedule) => ({
        schedule,
        stats: computeStats(schedule),
    }));
    if (strategies.length === 0 || entries.length < 2) return entries;

    const totals = new Array<number>(entries.length).fill(0);
    for (const key of strategies) {
        const values = entries.map((e) => METRIC[key](e.stats));
        const min = Math.min(...values);
        const range = Math.max(...values) - min || 1;
        values.forEach((v, i) => {
            totals[i] += (v - min) / range;
        });
    }

    return entries
        .map((entry, i) => ({ entry, score: totals[i] }))
        .sort((a, b) => b.score - a.score)
        .map(({ entry }) => entry);
}
