import Home from "./pages/Home";

function App() {
    return (
        <>
            <header className="app-header">
                <h1>
                    Horario<span className="accent">Duoc</span>
                </h1>
                <p>
                    Genera todas las combinaciones de horario sin topes para tu
                    carrera y nivel.
                </p>
            </header>
            <Home />
            <div className="watermark">
                <span>
                    <a
                        href="https://github.com/xdainz/horarios"
                        target="_blank"
                    >
                        Horarioduoc
                    </a>{" "}
                    fue desarrollado por{" "}
                    <a href="https://github.com/xdainz" target="_blank">
                        xdainz
                    </a>
                </span>
            </div>
        </>
    );
}

export default App;
