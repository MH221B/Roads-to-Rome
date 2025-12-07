import React from 'react';

interface Props {
    open: boolean;
    historyData: any[];
    onClose: () => void;
    onSelect: (attempt: any) => void;
}

export default function HistorySelector({ open, historyData, onClose, onSelect }: Props) {
    if (!open) return null;

    return (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-1/3 max-h-[80vh] overflow-y-auto p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Select an attempt to review</h3>
                    <button className="text-sm text-red-600" onClick={onClose}>Close</button>
                </div>

                {historyData.length === 0 && <div className="text-sm text-gray-500">No attempts found.</div>}

                <div className="space-y-2">
                    {historyData.map((h) => (
                        <button
                            key={h._id}
                            onClick={() => onSelect(h)}
                            className={`w-full text-left p-3 border rounded hover:bg-gray-50`}
                        >
                            <div className="flex justify-between">
                                <div>
                                    <div className="text-sm">Score: <strong>{h.score}</strong></div>
                                    <div className="text-xs text-gray-500">Duration: {h.duration}s</div>
                                </div>
                                <div className="text-xs text-gray-500">{new Date(h.submittedAt).toLocaleString()}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
