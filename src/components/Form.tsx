interface FormProps {
    data: string[];
}

function Form({ data }: FormProps) {
    if (data.length < 1) return <label></label>;

    return (
        <>
            <h2>Selecciona</h2>
            <label>Carrera</label>
            <input type="text" list="carreras" />
            <datalist id="carreras">
                {data.map((career, index) => (
                    <option key={index} value={career} />
                ))}
            </datalist>
        </>
    );
}
export default Form;
