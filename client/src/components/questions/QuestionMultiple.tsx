import { useMemo, useState } from "react";

export default function MultipleChoiceAnswer({ item, onAnswered, disabled }: any) {
  const [selected, setSelected] = useState<string[]>([]);

  // Shuffle chỉ 1 lần
  const shuffled = useMemo(
    () => [...item.options].sort(() => Math.random() - 0.5),
    [item.options]
  );

  const toggleSelect = (opt: string) => {
    if (disabled) return;
    setSelected((prev) => {
      const next = prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt];
      onAnswered(next);
      return next;
    });
  };

  return (
    <div>
      <h3 className="font-medium mb-2">Multiple Choice</h3>

      {shuffled.map((opt: string, idx: number) => {
        const isActive = selected.includes(opt);

        return (
          <div
            key={idx}
            tabIndex={0}
            className={`flex items-center gap-2 p-2 m-2 border rounded-lg
              transition ${isActive ? "bg-blue-100 border-blue-500" : "hover:bg-gray-100"} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => toggleSelect(opt)}
            onKeyDown={(e) => !disabled && e.key === "Enter" && toggleSelect(opt)}
          >
            {/* checkbox controlled */}
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => toggleSelect(opt)}
              disabled={disabled}
              name={`q-${item.id}-multi`}
            />

            <span>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}
