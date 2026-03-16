import type React from "react";
import { readExcel } from "../service/SpreadSheetParsing";
import type { Asignatura } from "../types/types";

type FileUploaderProps = {
    /** Called with parsed data after the spreadsheet is read */
    onDataParsed?: (data: Asignatura[]) => void;
};

function FileUploader({ onDataParsed }: FileUploaderProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // get the only uploaded file
        const file = e.target.files?.[0];

        if (!file) return null;
        readExcel(file).then((data) => {
            console.log(data);
            // forward parsed data to parent if provided
            if (onDataParsed) onDataParsed(data);
        });
    };

    return (
        <div>
            <h1>Sube el Excel de tu sede (.xlsx/.xls)</h1>
            <input
                type="file"
                onChange={handleFileChange}
                accept=".xlsx, .xls"
            />
        </div>
    );
}

export default FileUploader;
