import type { Section } from "../types/types";
import { DAY_NAMES, formatTime } from "../service/ScheduleGenerator";

const PALETTE = [
    "#3b6ea5",
    "#a5533b",
    "#3b8a5e",
    "#7d4fa3",
    "#a3823b",
    "#3b94a3",
    "#a33b6e",
    "#6ba33b",
    "#5950b8",
    "#a36b3b",
];

const PX_PER_MIN = 1;

interface ScheduleTemplateProps {
    sections: Section[];
}

function ScheduleTemplate({ sections }: ScheduleTemplateProps) {
    const timed = sections.filter((s) => s.blocks.length > 0);
    const noSchedule = sections.filter((s) => s.blocks.length === 0);
    const allBlocks = timed.flatMap((s) => s.blocks);

    // color per subject, stable within this schedule
    const siglas = Array.from(new Set(sections.map((s) => s.sigla))).sort();
    const colorOf = (sigla: string) =>
        PALETTE[siglas.indexOf(sigla) % PALETTE.length];

    const startHour =
        allBlocks.length > 0
            ? Math.floor(Math.min(...allBlocks.map((b) => b.start)) / 60)
            : 8;
    const endHour =
        allBlocks.length > 0
            ? Math.ceil(Math.max(...allBlocks.map((b) => b.end)) / 60)
            : 9;
    const bodyHeight = (endHour - startHour) * 60 * PX_PER_MIN;
    const hours = Array.from(
        { length: endHour - startHour },
        (_, i) => startHour + i,
    );

    return (
        <div className="schedule">
            {timed.length > 0 ? (
                <div className="schedule-scroll">
                    <div className="schedule-grid">
                        <div className="schedule-corner" />
                        {DAY_NAMES.map((d) => (
                            <div className="day-header" key={d}>
                                {d}
                            </div>
                        ))}
                        <div className="time-col" style={{ height: bodyHeight }}>
                            {hours.map((h) => (
                                <span
                                    className="time-label"
                                    key={h}
                                    style={{
                                        top: (h - startHour) * 60 * PX_PER_MIN,
                                    }}
                                >
                                    {h}:00
                                </span>
                            ))}
                        </div>
                        {DAY_NAMES.map((d, dayIndex) => (
                            <div
                                className="day-body"
                                key={d}
                                style={{ height: bodyHeight }}
                            >
                                {timed.flatMap((s) =>
                                    s.blocks
                                        .filter((b) => b.day === dayIndex)
                                        .map((b) => (
                                            <div
                                                className="class-block"
                                                key={`${s.seccion}-${b.start}`}
                                                style={{
                                                    top:
                                                        (b.start -
                                                            startHour * 60) *
                                                        PX_PER_MIN,
                                                    height:
                                                        (b.end - b.start) *
                                                        PX_PER_MIN,
                                                    background: colorOf(
                                                        s.sigla,
                                                    ),
                                                }}
                                                title={`${s.nombre} (${s.seccion})${s.isVirtual ? " — virtual" : ""}`}
                                            >
                                                <span className="cb-seccion">
                                                    {s.seccion}
                                                </span>
                                                <span className="cb-time">
                                                    {formatTime(b.start)}–
                                                    {formatTime(b.end)}
                                                </span>
                                                {s.isVirtual ? (
                                                    <span className="cb-virtual">
                                                        virtual
                                                    </span>
                                                ) : null}
                                            </div>
                                        )),
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="schedule-legend">
                {[...timed, ...noSchedule].map((s) => (
                    <span className="legend-item" key={s.seccion}>
                        <span
                            className="legend-swatch"
                            style={{
                                background:
                                    s.blocks.length > 0
                                        ? colorOf(s.sigla)
                                        : "var(--surface-2)",
                            }}
                        />
                        <span className="legend-seccion">{s.seccion}</span>{" "}
                        {s.nombre}
                        {s.blocks.length === 0 ? " — sin horario fijo" : ""}
                        {s.isVirtual ? " (virtual)" : ""}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default ScheduleTemplate;
