import { useState } from "react";
import FileUploader from "./components/FileUploader";
import Form from "./components/Form";
import type { Asignatura } from "./types/types";
// import AsignaturaBlock from "./components/AsignaturaBlock";

function App() {
    const [excelData, setExcelData] = useState<Asignatura[]>([]);

    // Extract only the `Carrera` property from the parsed excel data,
    // remove empty strings and duplicates, and keep the result as string[]
    const careerList: string[] = Array.from(
        new Set(
            excelData
                .map((a) => a.Carrera)
                .filter((c) => typeof c === "string" && c.trim() !== ""),
        ),
    );

    return (
        <>
            <h1>To-Do</h1>
            <h2>diurno/vespertino</h2>
            <h2>clase online</h2>
            <h2>carrera</h2>
            <h2>nivel (semestre carrera)</h2>
            <h2>pref dias libres</h2>
            <hr />
            <FileUploader
                onDataParsed={(data: Asignatura[]) => setExcelData(data)}
            />
            <hr />
            <Form data={careerList} />
            <hr />
            {/* {excelData.length > 0 ? (
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

export default App;
