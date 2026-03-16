import { useState } from "react";
import type { Asignatura } from "../types/types";
import FileUploader from "../components/FileUploader";
import Form from "../components/Form";
// import AsignaturaBlock from "../components/AsignaturaBlock";
import AsignaturaSelectorList from "../components/AsignaturaSelectorList";

function Home() {
    const [excelData, setExcelData] = useState<Asignatura[]>([]);
    const [career, setCareer] = useState<string>("");

    // Filter by selected career and deduplicate by `SiglaAsignatura` (keep first occurrence).
    const selectedCareerAsignaturas: Asignatura[] = Array.from(
        excelData
            .filter((a) => a.Carrera === career)
            .reduce((map, a) => {
                if (!map.has(a.SiglaAsignatura)) map.set(a.SiglaAsignatura, a); // keep first seen
                return map;
            }, new Map<string, Asignatura>())
            .values(),
    ).sort((a, b) =>
        String(a.SiglaAsignatura).localeCompare(String(b.SiglaAsignatura)),
    );

    const dataExists = excelData.length > 0;

    return (
        <>
            {!dataExists ? (
                <FileUploader
                    onDataParsed={(data: Asignatura[]) => setExcelData(data)}
                />
            ) : (
                <Form
                    excelData={excelData}
                    onCareerSelected={(career: string) => setCareer(career)}
                />
            )}
            <hr />
            <AsignaturaSelectorList asignaturas={selectedCareerAsignaturas} />

            {/* <hr />
            {dataExists ? (
                <AsignaturaBlock
                    sigla={excelData[69].SiglaAsignatura}
                    nombre={excelData[69].NombreAsignatura}
                    dia={excelData[69].Horario.slice(0, 2)}
                    horaInicio={excelData[95].Horario.slice(3, 11)}
                    horaTermino={excelData[69].Horario.slice(13)}
                    isVirtual={excelData[69].IsVirtual}
                    seccion={excelData[69].Seccion.slice(9)}
                />
            ) : null} */}
        </>
    );
}

export default Home;
