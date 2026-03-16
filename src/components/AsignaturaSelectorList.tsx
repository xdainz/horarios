import type { Asignatura } from "../types/types";
import AsignaturaSelector from "./AsignaturaSelector";

interface AsignaturaSelectorListProps {
    asignaturas: Asignatura[];
}

function AsignaturaSelectorList({ asignaturas }: AsignaturaSelectorListProps) {
    return (
        <div className="asignatura-selector-grid">
            {asignaturas.map((asig, index) => (
                <AsignaturaSelector
                    sigla={asig.SiglaAsignatura}
                    nombre={asig.NombreAsignatura}
                    nivel={asig.Nivel}
                    key={index}
                />
            ))}
        </div>
    );
}

export default AsignaturaSelectorList;
