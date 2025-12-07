import { useMemo, useState } from "react";

export default function ImageChoiceAnswer({ item, onAnswered, disabled }: any) {
  const [selected, setSelected] = useState<string | null>(null);

  // Shuffle image options only once
  const shuffled = useMemo(
    () => [...item.options].sort(() => Math.random() - 0.5),
    [item.options]
  );

  return (
    <div>
      <h3 className="font-medium mb-2">Image Choice</h3>

      <div className="grid grid-cols-2 gap-4">
        {shuffled.map((img: string, idx: number) => {
          const isActive = selected === img;

          return (
            <div
              key={idx}
              tabIndex={0}
              className={`border rounded-lg p-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center transition 
                  ${isActive ? "bg-blue-100 border-blue-500" : "hover:bg-gray-100"}`}
                onClick={() => {
                  if (disabled) return;
                  setSelected(img);
                  onAnswered(img);
                }}
                onKeyDown={(e) => !disabled && e.key === "Enter" && setSelected(img)}
            >
              <img
                src={img}
                alt="answer"
                className="rounded mb-2"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
