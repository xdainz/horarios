import readXlsxFile, { type Row, type Sheet } from "read-excel-file/browser";
import type { Asignatura } from "../types/types";
import { normalize } from "../utils/text";

// Thrown when the workbook doesn't look like the horarios export.
// The message is shown to the user as-is.
export class InvalidScheduleFileError extends Error {}

const WRONG_FILE_MESSAGE =
    "El archivo no tiene las columnas esperadas (Carrera, Sección, Horario…). ¿Es el Excel de horarios de tu sede?";

// normalized header text -> Asignatura field
const HEADER_MAP: Record<string, keyof Asignatura> = {
    sede: "Sede",
    carrera: "Carrera",
    plan: "Plan",
    jornada: "Jornada",
    "sigla asignatura": "SiglaAsignatura",
    sigla: "SiglaAsignatura",
    "nombre asignatura": "NombreAsignatura",
    nombre: "NombreAsignatura",
    nivel: "Nivel",
    seccion: "Seccion",
    horario: "Horario",
    docente: "Docente",
    "asignatura virtual sincronica": "IsVirtual",
    "asignatura virtual sincrona": "IsVirtual",
    "asignatura virtual": "IsVirtual",
};

const REQUIRED: (keyof Asignatura)[] = [
    "Carrera",
    "Jornada",
    "SiglaAsignatura",
    "NombreAsignatura",
    "Nivel",
    "Seccion",
    "Horario",
];

type ColumnIndex = Partial<Record<keyof Asignatura, number>>;

// Map a header row to column positions; null if required columns are missing.
function matchHeaderRow(row: Row): ColumnIndex | null {
    const columns: ColumnIndex = {};
    row.forEach((cell, i) => {
        if (typeof cell !== "string") return;
        const field = HEADER_MAP[normalize(cell).trim().replace(/\s+/g, " ")];
        if (field !== undefined && columns[field] === undefined) {
            columns[field] = i;
        }
    });
    return REQUIRED.every((field) => columns[field] !== undefined)
        ? columns
        : null;
}

function parseRow(row: Row, columns: ColumnIndex): Asignatura {
    const cell = (field: keyof Asignatura) => {
        const i = columns[field];
        return i === undefined ? null : (row[i] ?? null);
    };
    const text = (field: keyof Asignatura) =>
        cell(field) === null ? "" : String(cell(field)).trim();

    const plan = Number(cell("Plan"));
    const nivelRaw = cell("Nivel");
    return {
        Sede: text("Sede"),
        Carrera: text("Carrera"),
        Plan: Number.isFinite(plan) ? plan : 0,
        Jornada: text("Jornada"),
        SiglaAsignatura: text("SiglaAsignatura"),
        NombreAsignatura: text("NombreAsignatura"),
        Nivel: typeof nivelRaw === "number" ? nivelRaw : text("Nivel"),
        Seccion: text("Seccion"),
        Horario: text("Horario"),
        Docente: text("Docente"),
        IsVirtual: text("IsVirtual") || null,
    };
}

// The DUOC export varies: some sheets start with the header row, others
// (the raw "RESULTADOS DE LA BUSQUEDA" sheet) prepend ~20 filler rows, and
// sheet order is not guaranteed. Find the first sheet containing a row that
// holds all required headers and parse everything below it.
export function parseSheets(sheets: Sheet[]): Asignatura[] {
    for (const { data } of sheets) {
        for (let i = 0; i < data.length; i++) {
            const columns = matchHeaderRow(data[i]);
            if (columns) {
                return data.slice(i + 1).map((row) => parseRow(row, columns));
            }
        }
    }
    throw new InvalidScheduleFileError(WRONG_FILE_MESSAGE);
}

export async function readExcel(file: File): Promise<Asignatura[]> {
    let sheets: Sheet[];
    try {
        sheets = await readXlsxFile(file);
    } catch {
        throw new InvalidScheduleFileError(
            "No se pudo leer el archivo. Debe ser un Excel .xlsx.",
        );
    }
    return parseSheets(sheets);
}
