import { useMemo, useState } from "react";

export default function SingleChoiceAnswer({ item, onAnswered, disabled }: any) {
    const [selected, setSelected] = useState<string | null>(null);
    // Shuffle options only once
    const shuffled = useMemo(
        () => [...item.options].sort(() => Math.random() - 0.5),
        [item.options]
    );

    return (
        <div>
            <h3 className="font-medium mb-2">Single Choice</h3>

            {shuffled.map((opt: string, idx: number) => (
                <div
                    key={idx}
                    tabIndex={0}
                    className= {`flex items-center gap-2 p-2 m-2 border rounded-lg
                        transition ${selected === opt ? "bg-blue-100 border-blue-500" : "hover:bg-gray-100"} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    onKeyDown={(e) => !disabled && e.key === "Enter" && setSelected(opt)}
                    onClick={() => {
                            if (disabled) return;
                            setSelected(opt);
                            onAnswered(opt);
                        }}
                >
                    <input type="radio" name={`q-${item.id}-single`} checked={selected === opt} onChange={() => !disabled && setSelected(opt)} disabled={disabled} />
                    <span>{opt}</span>
                </div>
            ))}
        </div>
    );
}
