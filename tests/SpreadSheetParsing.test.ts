import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import readXlsxFile from "read-excel-file/node";
import {
    InvalidScheduleFileError,
    parseSheets,
} from "../src/service/SpreadSheetParsing";

const HEADER = [
    "Sede",
    "Carrera",
    "Plan",
    "Jornada",
    "Sigla Asignatura",
    "Nombre Asignatura",
    "Nivel",
    "Sección",
    "Horario",
    "Docente",
    "ASIGNATURA VIRTUAL SINCRONICA",
];

const DATA_ROW = [
    "ANTONIO VARAS",
    "INGENIERÍA EN INFORMÁTICA",
    1446815,
    "Vespertino",
    "OCY1105",
    "CIBERSEGURIDAD DEFENSIVA",
    "Optativo",
    "OCY1105-006V",
    "Sa 10:01:00 - 11:20:00",
    null,
    "ONLINE SINCRONA",
];

describe("parseSheets", () => {
    test("parses a sheet whose first row is the header", () => {
        const rows = parseSheets([
            { sheet: "Hoja1", data: [HEADER, DATA_ROW] },
        ]);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual({
            Sede: "ANTONIO VARAS",
            Carrera: "INGENIERÍA EN INFORMÁTICA",
            Plan: 1446815,
            Jornada: "Vespertino",
            SiglaAsignatura: "OCY1105",
            NombreAsignatura: "CIBERSEGURIDAD DEFENSIVA",
            Nivel: "Optativo",
            Seccion: "OCY1105-006V",
            Horario: "Sa 10:01:00 - 11:20:00",
            Docente: "",
            IsVirtual: "ONLINE SINCRONA",
        });
    });

    test("finds the header below filler rows (raw export layout)", () => {
        const filler = ["SELECCIONA LOS FILTROS PARA REFINAR TU BUSQUEDA:"];
        const blank = [null, null, null];
        const rows = parseSheets([
            { sheet: "Hoja2", data: [filler, blank, blank, HEADER, DATA_ROW] },
        ]);
        expect(rows).toHaveLength(1);
        expect(rows[0].SiglaAsignatura).toBe("OCY1105");
    });

    test("skips sheets without the header and reads the one that has it", () => {
        const rows = parseSheets([
            { sheet: "Portada", data: [["bienvenido"], [null]] },
            { sheet: "Datos", data: [HEADER, DATA_ROW] },
        ]);
        expect(rows).toHaveLength(1);
    });

    test("header matching ignores case and accents", () => {
        const header = HEADER.map((h) => h.toUpperCase());
        const rows = parseSheets([{ sheet: "x", data: [header, DATA_ROW] }]);
        expect(rows[0].Seccion).toBe("OCY1105-006V");
    });

    test("accepts short header aliases (Sigla, Nombre, Asignatura Virtual)", () => {
        const header = [...HEADER];
        header[4] = "Sigla";
        header[5] = "Nombre";
        header[10] = "Asignatura Virtual";
        const rows = parseSheets([{ sheet: "x", data: [header, DATA_ROW] }]);
        expect(rows[0].SiglaAsignatura).toBe("OCY1105");
        expect(rows[0].NombreAsignatura).toBe("CIBERSEGURIDAD DEFENSIVA");
        expect(rows[0].IsVirtual).toBe("ONLINE SINCRONA");
    });

    test("optional columns (Sede, Plan, Docente, virtual) may be absent", () => {
        const required = [1, 3, 4, 5, 6, 7, 8]; // Carrera, Jornada, Sigla, Nombre, Nivel, Sección, Horario
        const header = required.map((i) => HEADER[i]);
        const data = required.map((i) => DATA_ROW[i]);
        const rows = parseSheets([{ sheet: "x", data: [header, data] }]);
        expect(rows[0].Sede).toBe("");
        expect(rows[0].Plan).toBe(0);
        expect(rows[0].Docente).toBe("");
        expect(rows[0].IsVirtual).toBeNull();
        expect(rows[0].Seccion).toBe("OCY1105-006V");
    });

    test("when a header repeats, the first column wins", () => {
        const header = [...HEADER, "Horario"];
        const data = [...DATA_ROW, "Lu 8:01:00 - 9:20:00"];
        const rows = parseSheets([{ sheet: "x", data: [header, data] }]);
        expect(rows[0].Horario).toBe("Sa 10:01:00 - 11:20:00");
    });

    test("numeric Nivel stays numeric, string Nivel stays string", () => {
        const numeric = [...DATA_ROW];
        numeric[6] = 3;
        const rows = parseSheets([
            { sheet: "x", data: [HEADER, numeric, DATA_ROW] },
        ]);
        expect(rows[0].Nivel).toBe(3);
        expect(rows[1].Nivel).toBe("Optativo");
    });

    test("non-numeric Plan becomes 0, numeric-string Plan parses", () => {
        const invalid = [...DATA_ROW];
        invalid[2] = "N/A";
        const asString = [...DATA_ROW];
        asString[2] = "1446815";
        const rows = parseSheets([
            { sheet: "x", data: [HEADER, invalid, asString] },
        ]);
        expect(rows[0].Plan).toBe(0);
        expect(rows[1].Plan).toBe(1446815);
    });

    test("rows shorter than the header parse with empty fields", () => {
        const short = DATA_ROW.slice(0, 5); // ends at Sigla Asignatura
        const rows = parseSheets([{ sheet: "x", data: [HEADER, short] }]);
        expect(rows[0].SiglaAsignatura).toBe("OCY1105");
        expect(rows[0].Horario).toBe("");
        expect(rows[0].IsVirtual).toBeNull();
    });

    test("empty virtual cell becomes null, empty docente becomes empty string", () => {
        const presencial = [...DATA_ROW];
        presencial[10] = null;
        const rows = parseSheets([{ sheet: "x", data: [HEADER, presencial] }]);
        expect(rows[0].IsVirtual).toBeNull();
        expect(rows[0].Docente).toBe("");
    });

    test("rejects a workbook without the expected columns", () => {
        expect(() =>
            parseSheets([
                { sheet: "x", data: [["foo", "bar"], ["a", "b"]] },
            ]),
        ).toThrow(InvalidScheduleFileError);
    });

    test("rejects when only some required columns exist", () => {
        expect(() =>
            parseSheets([
                {
                    sheet: "x",
                    data: [
                        ["Carrera", "Horario"],
                        ["INGENIERÍA", "Lu 8:01:00 - 9:20:00"],
                    ],
                },
            ]),
        ).toThrow(InvalidScheduleFileError);
    });
});

// integration against the real export — example.xlsx is gitignored,
// so this only runs locally when the file is present
const EXAMPLE = join(import.meta.dir, "..", "example.xlsx");

describe.skipIf(!existsSync(EXAMPLE))("real DUOC export", () => {
    test("parses thousands of complete rows", async () => {
        const sheets = await readXlsxFile(EXAMPLE);
        const rows = parseSheets(sheets);
        expect(rows.length).toBeGreaterThan(1000);
        for (const r of rows) {
            expect(r.Carrera).not.toBe("");
            expect(r.SiglaAsignatura).not.toBe("");
            expect(r.Seccion).not.toBe("");
        }
    });
});
