import * as XLSX from "xlsx";
import type { Asignatura } from "../types/types";

export function readExcel(file: File): Promise<Asignatura[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data as ArrayBuffer, {
                    type: "array",
                });

                // get first page
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rawData = XLSX.utils.sheet_to_json(worksheet);
                const parsed = parseAsignatura(rawData as object[]);
                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}

// ai slop parser
function parseAsignatura(objects: object[]): Asignatura[] {
    const parsedList: Asignatura[] = [];

    const keyMap: Record<string, keyof Asignatura> = {
        sede: "Sede",
        carrera: "Carrera",
        plan: "Plan",
        jornada: "Jornada",
        "sigla asignatura": "SiglaAsignatura",
        sigla: "SiglaAsignatura",
        "nombre asignatura": "NombreAsignatura",
        nombre: "NombreAsignatura",
        nivel: "Nivel",
        sección: "Seccion",
        seccion: "Seccion",
        horario: "Horario",
        docente: "Docente",
        "asignatura virtual sincronica": "IsVirtual",
        "asignatura virtual sincrona": "IsVirtual",
        "asignatura virtual sincrónica": "IsVirtual",
        "asignatura virtual": "IsVirtual",
        isvirtual: "IsVirtual",
    } as const;

    const normalize = (s: string) =>
        s
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/\s+/g, " ")
            .trim();

    for (const obj of objects) {
        const out: Partial<Asignatura> = {
            IsVirtual: null,
            Carrera: "",
            Docente: "",
            Horario: "",
            Jornada: "",
            Nivel: "",
            NombreAsignatura: "",
            Plan: 0,
            Seccion: "",
            Sede: "",
            SiglaAsignatura: "",
        } as Partial<Asignatura>;

        for (const [rawKey, rawVal] of Object.entries(
            obj as Record<string, unknown>,
        )) {
            const k = normalize(rawKey);
            const mapped = keyMap[k] ?? null;
            const val = rawVal === undefined || rawVal === null ? "" : rawVal;

            if (mapped) {
                // handle Plan numeric
                if (mapped === "Plan") {
                    const n = Number(val);
                    out.Plan = Number.isFinite(n) ? n : out.Plan;
                    continue;
                }

                if (mapped === "Nivel") {
                    const n = Number(val);
                    out.Nivel = Number.isFinite(n) ? n : String(val);
                    continue;
                }

                if (mapped === "IsVirtual") {
                    out.IsVirtual = String(val).trim() || null;
                    continue;
                }

                // generic string fields
                out[mapped] = String(val).trim();
            } else {
                // attempt to map some standard English/other keys
                if (k === "plan") {
                    const n = Number(val);
                    out.Plan = Number.isFinite(n) ? n : out.Plan;
                }
            }
        }

        // final normalization for required shape
        // Ensure Plan is a number
        if (out.Plan === undefined || out.Plan === null) out.Plan = 0;

        parsedList.push(out as Asignatura);
    }

    return parsedList;
}
