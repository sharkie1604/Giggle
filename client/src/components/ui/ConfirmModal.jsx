import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, X, Loader2 } from 'lucide-react';

/**
 * ConfirmModal — Cartoon-Brutalist confirmation dialog.
 * Eliminates browser-native window.confirm() with a tactile, accessible modal.
 *
 * @param {boolean} isOpen
 * @param {string} title
 * @param {string|React.ReactNode} message
 * @param {string} [confirmLabel='Confirm']
 * @param {string} [cancelLabel='Cancel']
 * @param {'jake'|'bubblegum'|'finn'} [variant='jake']
 * @param {() => void} onConfirm
 * @param {() => void} onCancel
 * @param {boolean} [loading=false]
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'jake',
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const confirmBtnStyles =
    variant === 'bubblegum'
      ? 'bg-bubblegum text-ink hover:bg-bubblegum/90'
      : variant === 'finn'
      ? 'bg-finn text-ink hover:bg-finn/90'
      : 'bg-jake text-ink hover:bg-jake/90';

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => !loading && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-paper border-4 border-ink shadow-brutal-lg rounded-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg border-2 border-ink bg-paper hover:bg-paper/70 transition text-ink disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl border-3 border-ink flex items-center justify-center shadow-brutal-sm ${
              variant === 'bubblegum'
                ? 'bg-bubblegum/30 text-ink'
                : 'bg-jake/30 text-ink'
            }`}
          >
            {variant === 'bubblegum' ? (
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <h3 className="font-heading font-black text-2xl text-ink leading-tight pr-6">
            {title}
          </h3>
        </div>

        {/* Modal Body */}
        <div className="text-ink/80 font-medium text-sm sm:text-base leading-relaxed mb-6">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t-2 border-ink/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="border-3 border-ink bg-white text-ink shadow-brutal rounded-xl font-heading font-bold px-5 py-2.5 hover:bg-paper/80 active:translate-x-0.5 active:translate-y-0.5 transition disabled:opacity-50 text-center"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`border-3 border-ink ${confirmBtnStyles} shadow-brutal rounded-xl font-heading font-black px-6 py-2.5 active:translate-x-0.5 active:translate-y-0.5 transition disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
