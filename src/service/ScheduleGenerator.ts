import type {
    Asignatura,
    ElectiveOption,
    Section,
    TimeBlock,
} from "../types/types";

const DAY_INDEX: Record<string, number> = {
    Lu: 0,
    Ma: 1,
    Mi: 2,
    Ju: 3,
    Vi: 4,
    Sa: 5,
};

export const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

// "Lu 14:31:00 - 15:50:00" -> TimeBlock.
// Returns null for "0:00:00 - 0:00:00" (async class, no fixed schedule).
export function parseHorario(horario: string): TimeBlock | null {
    const m = horario
        .trim()
        .match(
            /^(\p{L}{2})\s+(\d{1,2}):(\d{2}):\d{2}\s*-\s*(\d{1,2}):(\d{2}):\d{2}$/u,
        );
    if (!m) return null;
    const day = DAY_INDEX[m[1]];
    if (day === undefined) return null;
    const start = Number(m[2]) * 60 + Number(m[3]);
    const end = Number(m[4]) * 60 + Number(m[5]);
    if (end <= start) return null;
    return { day, start, end };
}

// "Diurno y Vespertino" rows are available to students of either jornada
export function matchesJornada(a: Asignatura, jornada: string): boolean {
    return a.Jornada === jornada || a.Jornada === "Diurno y Vespertino";
}

export function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${String(m).padStart(2, "0")}`;
}

// The excel repeats classes: different section codes of the same subject can
// hold the exact same weekly schedule. Those are interchangeable for the
// student — keep the first and drop the rest.
function dedupeIdenticalSchedules(sections: Section[]): Section[] {
    const seen = new Set<string>();
    return sections.filter((s) => {
        const signature = s.blocks
            .map((b) => `${b.day}:${b.start}:${b.end}`)
            .join("|");
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
    });
}

// Group rows (already filtered by carrera) into Sections, one per Sección,
// merging the multiple rows that hold each weekly block. Returns sections
// grouped by sigla.
export function groupSections(rows: Asignatura[]): Map<string, Section[]> {
    const bySeccion = new Map<
        string,
        { row: Asignatura; horarios: Set<string> }
    >();
    for (const row of rows) {
        // key includes sigla: a section code reused by another subject
        // must not merge into the same section
        const key = `${row.SiglaAsignatura}|${row.Seccion}`;
        let entry = bySeccion.get(key);
        if (!entry) {
            entry = { row, horarios: new Set() };
            bySeccion.set(key, entry);
        }
        entry.horarios.add(row.Horario);
    }

    const bySigla = new Map<string, Section[]>();
    for (const { row, horarios } of bySeccion.values()) {
        const blocks = Array.from(horarios)
            .map(parseHorario)
            .filter((b): b is TimeBlock => b !== null)
            .sort((a, b) => a.day - b.day || a.start - b.start);
        const section: Section = {
            sigla: row.SiglaAsignatura,
            nombre: row.NombreAsignatura,
            seccion: row.Seccion,
            nivel: row.Nivel,
            isVirtual: Boolean(row.IsVirtual),
            docente: row.Docente,
            blocks,
        };
        const list = bySigla.get(section.sigla);
        if (list) list.push(section);
        else bySigla.set(section.sigla, [section]);
    }
    for (const [sigla, sections] of bySigla) {
        bySigla.set(sigla, dedupeIdenticalSchedules(sections));
    }
    return bySigla;
}

function blocksConflict(a: TimeBlock, b: TimeBlock): boolean {
    return a.day === b.day && a.start < b.end && b.start < a.end;
}

export function sectionConflicts(
    section: Section,
    placed: TimeBlock[],
): boolean {
    return section.blocks.some((b) => placed.some((p) => blocksConflict(b, p)));
}

// All combinations picking one section per subject with no time overlaps.
// Backtracking with early pruning; stops once `cap` schedules are found.
export function generateSchedules(
    sectionsPerSubject: Section[][],
    cap = 300,
): { schedules: Section[][]; capped: boolean } {
    const schedules: Section[][] = [];
    let capped = false;
    if (sectionsPerSubject.length === 0) return { schedules, capped };

    // fewest sections first prunes the search tree sooner
    const subjects = [...sectionsPerSubject].sort(
        (a, b) => a.length - b.length,
    );
    const current: Section[] = [];
    const placed: TimeBlock[] = [];

    const search = (i: number): void => {
        if (schedules.length >= cap) {
            capped = true;
            return;
        }
        if (i === subjects.length) {
            schedules.push([...current]);
            return;
        }
        for (const section of subjects[i]) {
            if (sectionConflicts(section, placed)) continue;
            current.push(section);
            placed.push(...section.blocks);
            search(i + 1);
            current.pop();
            placed.length -= section.blocks.length;
            if (schedules.length >= cap) {
                capped = true;
                return;
            }
        }
    };

    search(0);
    return { schedules, capped };
}

// Electives (grouped by sigla) with at least one section that fits the
// given schedule without overlapping.
export function compatibleElectives(
    schedule: Section[],
    electives: Map<string, Section[]>,
): ElectiveOption[] {
    const placed = schedule.flatMap((s) => s.blocks);
    const result: ElectiveOption[] = [];
    for (const sections of electives.values()) {
        const fitting = sections.filter((s) => !sectionConflicts(s, placed));
        if (fitting.length > 0) {
            result.push({
                sigla: fitting[0].sigla,
                nombre: fitting[0].nombre,
                sections: fitting,
            });
        }
    }
    return result.sort((a, b) => a.sigla.localeCompare(b.sigla));
}
