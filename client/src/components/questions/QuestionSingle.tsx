import { useMemo, useState } from "react";

export default function SingleChoiceAnswer({ item }: any) {
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
                    className= {`flex items-center gap-2 p-2 m-2 border rounded-lg cursor-pointer
                        transition ${selected === opt ? "bg-blue-100 border-blue-500" : "hover:bg-gray-100"}`}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(opt)}
                    onClick={() => setSelected(opt)} // chỉ đổi màu
                >
                    <input type="radio" name={`q-${item.id}-single`} checked={selected === opt} onChange={() => setSelected(opt)} />
                    <span>{opt}</span>
                </div>
            ))}
        </div>
    );
}
