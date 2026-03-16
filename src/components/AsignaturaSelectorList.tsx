import type { Asignatura } from "../types/types";
import AsignaturaSelector from "./AsignaturaSelector";

interface AsignaturaSelectorListProps {
    asignaturas: Asignatura[];
}

function AsignaturaSelectorList({ asignaturas }: AsignaturaSelectorListProps) {
    const selectedAsignaturas = new Set<string>([]);

    const handleSelectedList = (siglaAsignatura: string) => {
        if (selectedAsignaturas.has(siglaAsignatura)) {
            selectedAsignaturas.delete(siglaAsignatura);
        } else {
            selectedAsignaturas.add(siglaAsignatura);
        }
    };

    console.log(selectedAsignaturas);
    return (
        <div className="asignatura-selector-grid">
            {asignaturas.map((asig, index) => (
                <AsignaturaSelector
                    sigla={asig.SiglaAsignatura}
                    nombre={asig.NombreAsignatura}
                    nivel={asig.Nivel}
                    key={index}
                    onSelect={handleSelectedList}
                />
            ))}
        </div>
    );
}

export default AsignaturaSelectorList;
