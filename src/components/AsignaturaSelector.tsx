interface AsignaturaSelectorProps {
    sigla: string;
    nombre: string;
    nivel: string | number;
}

function AsignaturaSelector({ sigla, nombre, nivel }: AsignaturaSelectorProps) {
    return (
        <>
            <h3>{sigla}</h3>
            <h3>{nombre}</h3>
            <h3>{nivel}</h3>
        </>
    );
}

export default AsignaturaSelector;
