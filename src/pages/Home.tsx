import { useEffect, useMemo, useRef, useState } from "react";
import type { Asignatura, ElectiveOption, Section } from "../types/types";
import FileUploader from "../components/FileUploader";
import Form from "../components/Form";
import AsignaturaSelectorList from "../components/AsignaturaSelectorList";
import ScheduleTemplate from "../components/ScheduleTemplate";
import StrategySelector from "../components/StrategySelector";
import {
    compatibleElectives,
    DAY_NAMES,
    formatTime,
    generateSchedules,
    groupSections,
    matchesJornada,
} from "../service/ScheduleGenerator";
import {
    CONFLICTING,
    sortSchedules,
    type StrategyKey,
} from "../service/ScheduleStrategies";
import { normalize } from "../utils/text";

const SCHEDULE_CAP = 300;

interface GenerationResult {
    schedules: Section[][];
    capped: boolean;
    electives: Map<string, Section[]>;
}

// deduplicate by sigla (keep first occurrence), sorted by sigla
function uniqueBySigla(rows: Asignatura[]): Asignatura[] {
    const map = new Map<string, Asignatura>();
    for (const a of rows) {
        if (!map.has(a.SiglaAsignatura)) map.set(a.SiglaAsignatura, a);
    }
    return Array.from(map.values()).sort((a, b) =>
        a.SiglaAsignatura.localeCompare(b.SiglaAsignatura),
    );
}

function matchesQuery(a: Asignatura, query: string): boolean {
    const q = normalize(query.trim());
    if (!q) return true;
    return (
        normalize(a.SiglaAsignatura).includes(q) ||
        normalize(a.NombreAsignatura).includes(q)
    );
}

function formatGap(minutes: number): string {
    if (minutes === 0) return "sin ventanas";
    if (minutes < 60) return `${minutes} min de ventanas`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ""} de ventanas`;
}

function Home() {
    const [excelData, setExcelData] = useState<Asignatura[]>([]);
    const [fileName, setFileName] = useState("");
    const [career, setCareer] = useState<string>("");
    const [jornada, setJornada] = useState<string>("");
    const [nivel, setNivel] = useState<string>("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [subjectQuery, setSubjectQuery] = useState("");
    const [strategies, setStrategies] = useState<StrategyKey[]>([]);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [scheduleIndex, setScheduleIndex] = useState(0);
    const resultsRef = useRef<HTMLDivElement>(null);

    // rows the student can actually take: their career and jornada
    const availableRows = useMemo(
        () =>
            excelData.filter(
                (a) => a.Carrera === career && matchesJornada(a, jornada),
            ),
        [excelData, career, jornada],
    );

    const nivelSubjects = useMemo(
        () =>
            uniqueBySigla(
                availableRows.filter((a) => String(a.Nivel) === nivel),
            ),
        [availableRows, nivel],
    );
    const sectionCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const sections of groupSections(availableRows).values()) {
            counts.set(sections[0].sigla, sections.length);
        }
        return counts;
    }, [availableRows]);

    // changing career/jornada/nivel invalidates the selection and results
    const resetSelection = () => {
        setSelected(new Set());
        setSubjectQuery("");
        setResult(null);
    };
    const handleCareerSelected = (newCareer: string) => {
        setCareer(newCareer);
        resetSelection();
    };
    const handleJornadaSelected = (newJornada: string) => {
        setJornada(newJornada);
        resetSelection();
    };
    const handleNivelSelected = (newNivel: string) => {
        setNivel(newNivel);
        resetSelection();
    };

    const filteredNivelSubjects = useMemo(
        () => nivelSubjects.filter((a) => matchesQuery(a, subjectQuery)),
        [nivelSubjects, subjectQuery],
    );

    const handleToggle = (sigla: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(sigla)) next.delete(sigla);
            else next.add(sigla);
            return next;
        });
        setResult(null);
    };

    const selectAllNivel = () => {
        setSelected(
            (prev) =>
                new Set([
                    ...prev,
                    ...nivelSubjects.map((a) => a.SiglaAsignatura),
                ]),
        );
        setResult(null);
    };

    const clearSelection = () => {
        setSelected(new Set());
        setResult(null);
    };

    const toggleStrategy = (key: StrategyKey) => {
        setStrategies((prev) => {
            if (prev.includes(key)) return prev.filter((k) => k !== key);
            // e.g. picking "late" drops "early" — they contradict each other
            return [...prev.filter((k) => k !== CONFLICTING[key]), key];
        });
        setScheduleIndex(0);
    };

    const handleGenerate = () => {
        const rows = availableRows.filter((a) =>
            selected.has(a.SiglaAsignatura),
        );
        const bySigla = groupSections(rows);
        const { schedules, capped } = generateSchedules(
            Array.from(bySigla.values()),
            SCHEDULE_CAP,
        );
        const electives = groupSections(
            availableRows.filter((a) => a.Nivel === "Optativo"),
        );
        setResult({ schedules, capped, electives });
        setScheduleIndex(0);
    };

    useEffect(() => {
        if (result) resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [result]);

    const scored = useMemo(
        () => (result ? sortSchedules(result.schedules, strategies) : []),
        [result, strategies],
    );
    const current = scored[scheduleIndex];
    const currentElectives: ElectiveOption[] = useMemo(
        () =>
            result && current
                ? compatibleElectives(current.schedule, result.electives)
                : [],
        [result, current],
    );

    const dataExists = excelData.length > 0;

    return (
        <>
            <section className="step">
                <h2 className="step-title">
                    <span className="step-num">1</span> Sube el Excel de tu
                    sede
                </h2>
                {!dataExists ? (
                    <FileUploader
                        onDataParsed={(data: Asignatura[], name: string) => {
                            setExcelData(data);
                            setFileName(name);
                        }}
                    />
                ) : (
                    <div className="file-chip">
                        <span className="file-name">📄 {fileName}</span>
                        <span className="file-meta">
                            {excelData.length.toLocaleString("es-CL")} filas
                        </span>
                        <button
                            className="link-btn"
                            onClick={() => {
                                setExcelData([]);
                                setFileName("");
                                setCareer("");
                                setJornada("");
                                setNivel("");
                                setSelected(new Set());
                                setResult(null);
                            }}
                        >
                            Cambiar
                        </button>
                    </div>
                )}
            </section>

            {dataExists ? (
                <section className="step">
                    <h2 className="step-title">
                        <span className="step-num">2</span> Elige carrera,
                        jornada y nivel
                    </h2>
                    <Form
                        excelData={excelData}
                        career={career}
                        jornada={jornada}
                        nivel={nivel}
                        onCareerSelected={handleCareerSelected}
                        onJornadaSelected={handleJornadaSelected}
                        onNivelSelected={handleNivelSelected}
                    />
                </section>
            ) : null}

            {dataExists && career && jornada && nivel ? (
                <>
                    <section className="step">
                        <h2 className="step-title">
                            <span className="step-num">3</span> Elige tus
                            asignaturas
                        </h2>
                        <div className="selection-toolbar">
                            <input
                                type="search"
                                className="subject-search"
                                placeholder="Buscar por sigla o nombre…"
                                value={subjectQuery}
                                onChange={(e) =>
                                    setSubjectQuery(e.target.value)
                                }
                            />
                            <span className="selection-count">
                                {selected.size}{" "}
                                {selected.size === 1
                                    ? "seleccionada"
                                    : "seleccionadas"}
                            </span>
                            <button
                                className="link-btn"
                                onClick={selectAllNivel}
                            >
                                Todas las del nivel
                            </button>
                            <button
                                className="link-btn"
                                onClick={clearSelection}
                                disabled={selected.size === 0}
                            >
                                Ninguna
                            </button>
                        </div>
                        {filteredNivelSubjects.length === 0 ? (
                            <p className="hint">
                                Sin resultados para “{subjectQuery}”.
                            </p>
                        ) : null}
                        <AsignaturaSelectorList
                            asignaturas={filteredNivelSubjects}
                            selected={selected}
                            sectionCounts={sectionCounts}
                            onToggle={handleToggle}
                        />
                        <p className="hint">
                            Los optativos compatibles se muestran junto a cada
                            horario generado.
                        </p>
                    </section>

                    <section className="step">
                        <h2 className="step-title">
                            <span className="step-num">4</span> ¿Cómo prefieres
                            tu horario?{" "}
                            <span className="optional-tag">opcional</span>
                        </h2>
                        <StrategySelector
                            selected={strategies}
                            onToggle={toggleStrategy}
                        />
                    </section>

                    <button
                        className="generate-btn"
                        onClick={handleGenerate}
                        disabled={selected.size === 0}
                    >
                        {selected.size === 0
                            ? "Selecciona al menos una asignatura"
                            : `Generar horarios (${selected.size} ${selected.size === 1 ? "asignatura" : "asignaturas"})`}
                    </button>
                </>
            ) : null}

            {result ? (
                <section className="step results" ref={resultsRef}>
                    {scored.length === 0 ? (
                        <div className="empty-state">
                            <p className="empty-title">
                                😕 No hay ninguna combinación sin topes
                            </p>
                            <p className="empty-sub">
                                Esas asignaturas chocan entre sí en todas sus
                                secciones. Prueba quitando alguna.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h2 className="results-title">
                                {scored.length === SCHEDULE_CAP && result.capped
                                    ? `+${SCHEDULE_CAP}`
                                    : scored.length}{" "}
                                {scored.length === 1
                                    ? "horario posible"
                                    : "horarios posibles"}
                                {strategies.length > 0
                                    ? " · ordenados según tus preferencias"
                                    : ""}
                            </h2>
                            <div className="schedule-nav">
                                <button
                                    onClick={() =>
                                        setScheduleIndex((i) => i - 1)
                                    }
                                    disabled={scheduleIndex === 0}
                                    aria-label="anterior"
                                >
                                    ←
                                </button>
                                <span>
                                    {scheduleIndex + 1} / {scored.length}
                                    {strategies.length > 0 &&
                                    scheduleIndex === 0
                                        ? " ★"
                                        : ""}
                                </span>
                                <button
                                    onClick={() =>
                                        setScheduleIndex((i) => i + 1)
                                    }
                                    disabled={
                                        scheduleIndex >= scored.length - 1
                                    }
                                    aria-label="siguiente"
                                >
                                    →
                                </button>
                            </div>

                            {current ? (
                                <>
                                    <div className="stats-row">
                                        <span className="stat-badge">
                                            🏖️ {current.stats.freeDays}{" "}
                                            {current.stats.freeDays === 1
                                                ? "día libre"
                                                : "días libres"}
                                            {current.stats.freeDayNames.length >
                                            0
                                                ? ` (${current.stats.freeDayNames.join(", ")})`
                                                : ""}
                                        </span>
                                        <span className="stat-badge">
                                            ⚡{" "}
                                            {formatGap(
                                                current.stats.gapMinutes,
                                            )}
                                        </span>
                                        <span className="stat-badge">
                                            🌅 entrada prom.{" "}
                                            {formatTime(
                                                Math.round(
                                                    current.stats.avgStart,
                                                ),
                                            )}
                                        </span>
                                        <span className="stat-badge">
                                            🌙 salida prom.{" "}
                                            {formatTime(
                                                Math.round(
                                                    current.stats.avgEnd,
                                                ),
                                            )}
                                        </span>
                                    </div>
                                    <ScheduleTemplate
                                        sections={current.schedule}
                                    />
                                    <div className="electives">
                                        <h3>
                                            Optativos compatibles con este
                                            horario
                                        </h3>
                                        {currentElectives.length === 0 ? (
                                            <p className="hint">Ninguno.</p>
                                        ) : (
                                            currentElectives.map((e) => (
                                                <details key={e.sigla}>
                                                    <summary>
                                                        <span className="sigla">
                                                            {e.sigla}
                                                        </span>{" "}
                                                        {e.nombre} (
                                                        {e.sections.length}{" "}
                                                        {e.sections.length ===
                                                        1
                                                            ? "sección"
                                                            : "secciones"}
                                                        )
                                                    </summary>
                                                    <ul>
                                                        {e.sections.map((s) => (
                                                            <li key={s.seccion}>
                                                                {s.seccion} —{" "}
                                                                {s.blocks
                                                                    .length > 0
                                                                    ? s.blocks
                                                                          .map(
                                                                              (
                                                                                  b,
                                                                              ) =>
                                                                                  `${DAY_NAMES[b.day]} ${formatTime(b.start)}-${formatTime(b.end)}`,
                                                                          )
                                                                          .join(
                                                                              ", ",
                                                                          )
                                                                    : "sin horario fijo"}
                                                                {s.isVirtual
                                                                    ? " (virtual)"
                                                                    : ""}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </details>
                                            ))
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </>
                    )}
                </section>
            ) : null}
        </>
    );
}

export default Home;
