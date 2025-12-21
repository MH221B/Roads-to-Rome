import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaMoneyBillWave } from 'react-icons/fa';

interface TopUpModalProps {
  open: boolean;
  amount: string;
  note: string;
  loading?: boolean;
  message?: string | null;
  isError?: boolean;
  coinPreview?: number;
  rateText?: string;
  onAmountChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const TopUpModal: React.FC<TopUpModalProps> = ({
  open,
  amount,
  note,
  loading,
  message,
  isError,
  coinPreview,
  rateText,
  onAmountChange,
  onNoteChange,
  onSubmit,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-emerald-600">Mock payment</p>
            <h3 className="text-lg font-bold text-slate-900">Top up your budget</h3>
            <p className="text-sm text-slate-600">Enter an amount to credit your balance. No real payment is processed.</p>
          </div>
          <button
            type="button"
            className="text-slate-500 transition hover:text-slate-800"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Amount (VND)</label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="100000"
            />
            <p className="text-xs text-slate-600">
              {rateText || '1,000 VND = 1 coin'} · Adds
              <span className="font-semibold text-slate-900"> {Math.max(coinPreview ?? 0, 0)}</span>
              <FaMoneyBillWave className="ml-1 inline h-4 w-4 text-emerald-600" />
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Note / reference (optional)</label>
            <Input
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="MOCK-REF-001"
            />
          </div>

          {message ? (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                isError
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {message}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="border-slate-200" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing…' : 'Add to budget'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopUpModal;