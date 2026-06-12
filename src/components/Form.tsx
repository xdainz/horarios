import { useState } from "react";
import type { Asignatura } from "../types/types";
import { matchesJornada } from "../service/ScheduleGenerator";
import { normalize } from "../utils/text";

interface FormProps {
    excelData: Asignatura[];
    onCareerSelected?: (career: string) => void;
    onJornadaSelected?: (jornada: string) => void;
    onNivelSelected?: (nivel: string) => void;
}

function jornadaOptionsFor(excelData: Asignatura[], career: string): string[] {
    const rows = excelData.filter((a) => a.Carrera === career);
    return ["Diurno", "Vespertino"].filter((j) =>
        rows.some((a) => matchesJornada(a, j)),
    );
}

function Form({
    excelData,
    onCareerSelected,
    onJornadaSelected,
    onNivelSelected,
}: FormProps) {
    const [careerInput, setCareerInput] = useState<string>("");
    const [careerOpen, setCareerOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [career, setCareer] = useState<string>("");
    const [jornada, setJornada] = useState<string>("");
    const [nivel, setNivel] = useState<string>("");

    const careerList: string[] = Array.from(
        new Set(
            excelData
                .map((a) => a.Carrera)
                .filter((c) => typeof c === "string" && c.trim() !== ""),
        ),
    ).sort();

    const filteredCareers = careerList.filter((c) =>
        normalize(c).includes(normalize(careerInput.trim())),
    );

    const jornadaOptions = jornadaOptionsFor(excelData, career);

    // niveles available for the selected career and jornada, numeric only
    // (Optativos are handled separately, not as a nivel)
    const nivelList: string[] = Array.from(
        new Set(
            excelData
                .filter(
                    (a) =>
                        a.Carrera === career && matchesJornada(a, jornada),
                )
                .map((a) => String(a.Nivel)),
        ),
    )
        .filter((n) => n !== "Optativo")
        .sort((a, b) => Number(a) - Number(b));

    const applyCareer = (newCareer: string) => {
        if (newCareer === career) return;
        setCareer(newCareer);
        setNivel("");
        if (onCareerSelected) onCareerSelected(newCareer);
        if (onNivelSelected) onNivelSelected("");
        // no real choice when the career runs on a single jornada
        const options = jornadaOptionsFor(excelData, newCareer);
        const newJornada =
            newCareer && options.length === 1 ? options[0] : "";
        setJornada(newJornada);
        if (onJornadaSelected) onJornadaSelected(newJornada);
    };

    const selectCareer = (newCareer: string) => {
        setCareerInput(newCareer);
        setCareerOpen(false);
        applyCareer(newCareer);
    };

    const handleCareerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCareerInput(value);
        setCareerOpen(true);
        setHighlight(0);
        // typed text only counts as a career once it matches an option
        applyCareer(careerList.includes(value) ? value : "");
    };

    const handleCareerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!careerOpen || filteredCareers.length === 0) return;
        const last = filteredCareers.length - 1;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, last));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            selectCareer(filteredCareers[Math.min(highlight, last)]);
        } else if (e.key === "Escape") {
            setCareerOpen(false);
        }
    };

    const handleJornadaClick = (newJornada: string) => {
        setJornada(newJornada);
        setNivel("");
        if (onJornadaSelected) onJornadaSelected(newJornada);
        if (onNivelSelected) onNivelSelected("");
    };

    const handleNivelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newNivel = e.target.value;
        setNivel(newNivel);
        if (onNivelSelected) onNivelSelected(newNivel);
    };

    return (
        <div className="form-selects">
            <div className="field combobox">
                <label htmlFor="carrera">Carrera</label>
                <input
                    id="carrera"
                    type="text"
                    autoComplete="off"
                    placeholder="Escribe para buscar tu carrera…"
                    value={careerInput}
                    onChange={handleCareerInput}
                    onFocus={() => setCareerOpen(true)}
                    onBlur={() => setCareerOpen(false)}
                    onKeyDown={handleCareerKeyDown}
                    role="combobox"
                    aria-expanded={careerOpen}
                />
                {careerOpen && filteredCareers.length > 0 ? (
                    <ul className="combobox-list" role="listbox">
                        {filteredCareers.map((c, i) => (
                            <li
                                key={c}
                                role="option"
                                aria-selected={c === career}
                                className={
                                    i === highlight
                                        ? "combobox-option highlight"
                                        : "combobox-option"
                                }
                                // mousedown fires before the input's blur
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectCareer(c);
                                }}
                                onMouseEnter={() => setHighlight(i)}
                            >
                                {c}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            {career.length > 1 ? (
                <div className="field">
                    <label>Jornada</label>
                    <div className="jornada-toggle">
                        <button
                            type="button"
                            className={
                                jornada === "Diurno" ? "chip active" : "chip"
                            }
                            disabled={!jornadaOptions.includes("Diurno")}
                            onClick={() => handleJornadaClick("Diurno")}
                        >
                            ☀️ Diurno
                        </button>
                        <button
                            type="button"
                            className={
                                jornada === "Vespertino"
                                    ? "chip active"
                                    : "chip"
                            }
                            disabled={!jornadaOptions.includes("Vespertino")}
                            onClick={() => handleJornadaClick("Vespertino")}
                        >
                            🌙 Vespertino
                        </button>
                    </div>
                </div>
            ) : null}

            {career.length > 1 && jornada ? (
                <div className="field">
                    <label htmlFor="nivel">Nivel (semestre)</label>
                    <select
                        id="nivel"
                        value={nivel}
                        onChange={handleNivelChange}
                    >
                        <option value="" disabled>
                            Selecciona el nivel…
                        </option>
                        {nivelList.map((nivel, index) => (
                            <option key={index} value={nivel}>
                                Nivel {nivel}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}
        </div>
    );
}
export default Form;
