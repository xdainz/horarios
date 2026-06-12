import { STRATEGIES, type StrategyKey } from "../service/ScheduleStrategies";

interface StrategySelectorProps {
    selected: StrategyKey[];
    onToggle: (key: StrategyKey) => void;
}

function StrategySelector({ selected, onToggle }: StrategySelectorProps) {
    return (
        <>
            <div className="strategy-chips">
                {STRATEGIES.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        title={s.description}
                        className={
                            selected.includes(s.key) ? "chip active" : "chip"
                        }
                        onClick={() => onToggle(s.key)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
            {selected.length > 0 ? (
                <p className="strategy-desc">
                    {STRATEGIES.filter((s) => selected.includes(s.key))
                        .map((s) => s.description)
                        .join(" · ")}
                </p>
            ) : null}
        </>
    );
}

export default StrategySelector;
