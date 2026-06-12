import { useRef, useState } from "react";
import {
    InvalidScheduleFileError,
    readExcel,
} from "../service/SpreadSheetParsing";
import type { Asignatura } from "../types/types";

type FileUploaderProps = {
    /** Called with parsed data after the spreadsheet is read */
    onDataParsed?: (data: Asignatura[], fileName: string) => void;
};

function FileUploader({ onDataParsed }: FileUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFile = (file: File | undefined) => {
        if (!file) return;
        setLoading(true);
        setError("");
        readExcel(file)
            .then((data) => {
                if (data.length === 0) {
                    setError("El archivo no tiene filas que leer.");
                    return;
                }
                if (onDataParsed) onDataParsed(data, file.name);
            })
            .catch((err) =>
                setError(
                    err instanceof InvalidScheduleFileError
                        ? err.message
                        : "No se pudo leer el archivo. ¿Es el Excel de horarios de tu sede?",
                ),
            )
            .finally(() => setLoading(false));
    };

    return (
        <div
            className={dragOver ? "dropzone dragover" : "dropzone"}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
            }}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <p className="dz-icon">📅</p>
            <p className="dz-title">
                {loading
                    ? "Leyendo archivo…"
                    : "Arrastra aquí el Excel de tu sede"}
            </p>
            <p className="dz-sub">o haz clic para buscarlo (.xlsx)</p>
            {error ? <p className="dz-error">{error}</p> : null}
        </div>
    );
}

export default FileUploader;
