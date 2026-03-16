interface AsignaturaSelectorProps {
    sigla: string;
    nombre: string;
    nivel: string | number;
}

function AsignaturaSelector({ sigla, nombre, nivel }: AsignaturaSelectorProps) {
    return (
        <div className="asignatura-selector">
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
