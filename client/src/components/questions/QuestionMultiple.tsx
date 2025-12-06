import { useMemo, useState } from "react";

export default function MultipleChoiceAnswer({ item }: any) {
  const [selected, setSelected] = useState<string[]>([]);

  // Shuffle chỉ 1 lần
  const shuffled = useMemo(
    () => [...item.options].sort(() => Math.random() - 0.5),
    [item.options]
  );

  const toggleSelect = (opt: string) => {
    setSelected((prev) =>
      prev.includes(opt)
        ? prev.filter((x) => x !== opt) // bỏ chọn
        : [...prev, opt]                // thêm chọn
    );
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
            className={`flex items-center gap-2 p-2 m-2 border rounded-lg cursor-pointer
              transition ${isActive ? "bg-blue-100 border-blue-500" : "hover:bg-gray-100"}`}
            onClick={() => toggleSelect(opt)}               // chỉ đổi state
            onKeyDown={(e) => e.key === "Enter" && toggleSelect(opt)}
          >
            {/* checkbox controlled */}
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => toggleSelect(opt)}             // click vào checkbox
              name={`q-${item.id}-multi`}
            />

            <span>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}
