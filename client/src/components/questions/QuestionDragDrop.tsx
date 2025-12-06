import React, { useState, useMemo } from "react";

export default function DragDropAnswer({ item, onAnswered }: any) {
  // Shuffle chỉ 1 lần
  const shuffled = useMemo(
    () => [...item.options].sort(() => Math.random() - 0.5),
    [item.options]
  );

  const [dragItems, setDragItems] = useState<string[]>(shuffled);
  const [dropSlots, setDropSlots] = useState<(string | null)[]>(
    Array(item.slotCount || shuffled.length).fill(null)
  );

  // if left side fully empty or right side fully filled, consider question answered
  React.useEffect(() => {
    const leftEmpty = dragItems.length === 0;
    const rightFull = dropSlots.every((slot) => slot !== null);
    if (leftEmpty || rightFull) {
      onAnswered();
    }
  }, [dragItems, dropSlots, onAnswered]);

  const handleDragStartFromLeft = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ source: "left", item })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragStartFromSlot = (e: React.DragEvent, index: number) => {
    if (!dropSlots[index]) return;
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ source: "slot", index, item: dropSlots[index] })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropToSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;

    const payload = JSON.parse(raw);
    if (dropSlots[slotIndex]) return;

    if (payload.source === "left") {
      setDragItems((prev) => prev.filter((x) => x !== payload.item));
      setDropSlots((prev) => {
        const copy = [...prev];
        copy[slotIndex] = payload.item;
        return copy;
      });
    }

    if (payload.source === "slot") {
      setDropSlots((prev) => {
        const copy = [...prev];
        const moving = copy[payload.index];
        if (!moving) return prev;

        if (!copy[slotIndex]) {
          copy[slotIndex] = moving;
          copy[payload.index] = null;
        }
        return copy;
      });
    }
  };

  const handleDropToLeft = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;

    const payload = JSON.parse(raw);
    if (payload.source !== "slot") return;

    setDropSlots((prev) => {
      const copy = [...prev];
      copy[payload.index] = null;
      return copy;
    });

    setDragItems((prev) => [...prev, payload.item]);
  };

  return (
    <div>
      <h3 className="font-medium mb-2">Drag & Drop</h3>

      <div className="flex gap-4">
        {/* LEFT COLUMN */}
        <div
          className="w-1/2 p-4 border rounded-lg min-h-[140px] bg-white"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToLeft}
        >
          <p className="text-sm text-gray-500 mb-2">Draggable Items</p>
          {dragItems.map((text) => (
            <div
              key={text}
              draggable
              onDragStart={(e) => handleDragStartFromLeft(e, text)}
              className="p-2 border rounded mb-2 cursor-grab bg-white hover:bg-gray-50"
            >
              {text}
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-1/2 p-4 border rounded-lg min-h-[140px] bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">Drop Slots</p>

          {dropSlots.map((slot, idx) => (
            <div
              key={idx}
              className="p-2 border rounded mb-2 bg-white flex justify-between"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropToSlot(e, idx)}
            >
              {slot ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStartFromSlot(e, idx)}
                  className="p-1 bg-gray-100 rounded cursor-grab"
                >
                  {slot}
                </div>
              ) : (
                <span className="text-gray-400 text-sm">(empty)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
