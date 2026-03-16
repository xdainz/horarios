interface AsignaturaBlockProps {
    sigla: string;
    nombre: string;
    dia: string;
    horaInicio: string;
    horaTermino: string;
    isVirtual: string | null;
    seccion: string;
}

function AsignaturaBlock({
    sigla,
    nombre,
    dia,
    horaInicio,
    horaTermino,
    isVirtual,
    seccion,
}: AsignaturaBlockProps) {
    return (
        <div className="classblock">
            <h3>
                {sigla} {nombre}
            </h3>
            <p>{dia}</p>
            <p>{horaInicio}</p>
            <p>{horaTermino}</p>
            <span>Seccion: {seccion}</span>{" "}
            {isVirtual ? <span>(VIRTUAL)</span> : null}
        </div>
    );
}

export default AsignaturaBlock;
