interface AsignaturaSelectorProps {
    sigla: string;
    nombre: string;
    subtitle: string;
    selected: boolean;
    onSelect?: (siglaAsignatura: string) => void;
}

function AsignaturaSelector({
    sigla,
    nombre,
    subtitle,
    selected,
    onSelect,
}: AsignaturaSelectorProps) {
    const handleClick = () => {
        if (onSelect) onSelect(sigla);
    };

    return (
        <button
            type="button"
            className={
                selected
                    ? "asignatura-selector selected"
                    : "asignatura-selector"
            }
            onClick={handleClick}
            role="checkbox"
            aria-checked={selected}
        >
            <span className="check">{selected ? "✓" : ""}</span>
            <span className="sigla">{sigla}</span>
            <span className="nombre">{nombre}</span>
            <span className="meta">{subtitle}</span>
        </button>
    );
}

export default AsignaturaSelector;
