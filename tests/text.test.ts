import { describe, expect, test } from "bun:test";
import { normalize } from "../src/utils/text";

describe("normalize", () => {
    test("lowercases", () => {
        expect(normalize("CARRERA")).toBe("carrera");
    });

    test("strips accents", () => {
        expect(normalize("Sección")).toBe("seccion");
        expect(normalize("SINCRÓNICA")).toBe("sincronica");
    });

    test("ñ loses its tilde (header matching treats it as n)", () => {
        expect(normalize("AÑO")).toBe("ano");
    });

    test("plain ascii passes through unchanged", () => {
        expect(normalize("horario")).toBe("horario");
    });
});
