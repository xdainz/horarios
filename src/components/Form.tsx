import { useState } from "react";
import type { Asignatura } from "../types/types";

interface FormProps {
    excelData: Asignatura[];
    onCareerSelected?: (career: string) => void;
    onNivelSelected?: (nivel: string | number) => void;
}

function Form({ excelData, onCareerSelected, onNivelSelected }: FormProps) {
    const [career, setCareer] = useState<string>("");
    const [nivel, setNivel] = useState<string | number>("");

    const careerList: string[] = Array.from(
        new Set(
            excelData
                .map((a) => a.Carrera)
                .filter((c) => typeof c === "string" && c.trim() !== ""),
        ),
    ).sort();

    const nivelList: [] = [];

    const handleCareerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCareer = e.target.value;
        setCareer(newCareer);
        if (onCareerSelected) onCareerSelected(newCareer);
    };

    const handleNivelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newNivel = e.target.value;
        setNivel(newNivel);
        if (onNivelSelected) onNivelSelected(newNivel);
    };

    return (
        <>
            <h2>Selecciona</h2>
            <label htmlFor="carrera">Carrera:</label>
            <select id="carrera" value={career} onChange={handleCareerChange}>
                <option value="" disabled>
                    -- Seleccione una carrera --
                </option>
                {careerList.map((career, index) => (
                    <option key={index} value={career}>
                        {career}
                    </option>
                ))}
            </select>

            {/* only render after career was selected */}
            {career.length > 1 ? (
                <>
                    <br />
                    <label htmlFor="nivel">Nivel (Semestre): </label>
                    <select
                        id="nivel"
                        value={nivel}
                        onChange={handleNivelChange}
                    >
                        <option value="" disabled>
                            -- Seleccione nivel --
                        </option>
                        {nivelList.map((nivel, index) => (
                            <option key={index} value={career}>
                                {nivel}
                            </option>
                        ))}
                    </select>
                </>
            ) : null}
        </>
    );
}
export default Form;
