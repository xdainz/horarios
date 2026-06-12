import type { Asignatura } from "../types/types";
import AsignaturaSelector from "./AsignaturaSelector";

interface AsignaturaSelectorListProps {
    asignaturas: Asignatura[];
    selected: Set<string>;
    sectionCounts: Map<string, number>;
    onToggle: (siglaAsignatura: string) => void;
}

function AsignaturaSelectorList({
    asignaturas,
    selected,
    sectionCounts,
    onToggle,
}: AsignaturaSelectorListProps) {
    return (
        <div className="asignatura-selector-grid">
            {asignaturas.map((asig) => {
                const count = sectionCounts.get(asig.SiglaAsignatura) ?? 0;
                return (
                    <AsignaturaSelector
                        sigla={asig.SiglaAsignatura}
                        nombre={asig.NombreAsignatura}
                        subtitle={`${count} ${count === 1 ? "sección" : "secciones"}`}
                        selected={selected.has(asig.SiglaAsignatura)}
                        key={asig.SiglaAsignatura}
                        onSelect={onToggle}
                    />
                );
            })}
        </div>
    );
}

export default AsignaturaSelectorList;
