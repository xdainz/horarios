import { useState } from "react";

interface AsignaturaSelectorProps {
    sigla: string;
    nombre: string;
    nivel: string | number;
    onSelect?: (siglaAsignatura: string) => void;
}

function AsignaturaSelector({
    sigla,
    nombre,
    nivel,
    onSelect,
}: AsignaturaSelectorProps) {
    const [selected, setSelected] = useState<boolean>(false);

    const handleClick = () => {
        const selectedValue = !selected;
        setSelected(selectedValue);
        // lift up state

        if (onSelect) onSelect(sigla);
    };

    return (
        <div
            className={
                selected
                    ? "asignatura-selector selected"
                    : "asignatura-selector"
            }
            onClick={handleClick}
        >
            <h4 className="nombre">
                <span className="sigla">{sigla}</span> {nombre}
            </h4>
            <p>
                Nivel:{" "}
                <span
                    className={
                        nivel != "Optativo" ? "nivel" : " nivel optativo"
                    }
                >
                    {nivel}
                </span>
            </p>
        </div>
    );
}

export default AsignaturaSelector;
