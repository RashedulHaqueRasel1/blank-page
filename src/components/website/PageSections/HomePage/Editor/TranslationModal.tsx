import React from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, RefreshCw, Loader2 } from "lucide-react";

interface TranslationModalProps {
  translationResult: string;
  resultCopied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onApply?: () => void;
  customInstruction: string;
  onSetCustomInstruction: (val: string) => void;
  onRetranslate: () => void;
  isTranslating: boolean;
}

const TranslationModal: React.FC<TranslationModalProps> = ({
  translationResult,
  resultCopied,
  onClose,
  onCopy,
  onApply,
  customInstruction,
  onSetCustomInstruction,
  onRetranslate,
  isTranslating,
}) => {
  if ((!translationResult && !isTranslating) || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[145] bg-black/15 animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div
        className="translation-modal fixed top-24 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-[360px] text-[var(--foreground)] rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-[var(--border-color)] p-6 animate-in fade-in zoom-in duration-300"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <h4 className="text-[10px] font-bold tracking-widest uppercase opacity-40">
              Translation Result
            </h4>
            <button
              onClick={onCopy}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all cursor-pointer opacity-40 hover:opacity-100 group"
              title="Copy result"
            >
              {resultCopied ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer opacity-40 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
        <div className="relative mb-1 min-h-[50px] max-h-[40vh] overflow-y-auto thin-scrollbar border border-[var(--border-color)] rounded-xl p-2 pr-3">
          {isTranslating && !translationResult ? (
            <div className="flex flex-col items-center justify-center py-4 gap-3 opacity-50">
              <Loader2 className="animate-spin text-[var(--editor-text)]" size={20} />
              <p className="text-[12px] text-[var(--editor-text)] uppercase tracking-widest font-semibold">Translating...</p>
            </div>
          ) : (
            <p className={`text-[14px] leading-relaxed text-[var(--editor-text)] transition-opacity ${isTranslating ? 'opacity-50' : 'opacity-100'}`}>
              {translationResult}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="e.g. make it more professional"
            value={customInstruction}
            onChange={(e) => onSetCustomInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isTranslating) {
                e.preventDefault();
                onRetranslate();
              }
            }}
            className="flex-1 border border-[var(--border-color)] outline-none px-3 py-2 rounded-xl text-[12px] placeholder:opacity-40 focus:ring-1 focus:ring-[var(--accent-color)] transition-all text-[var(--foreground)]"
            style={{ background: "color-mix(in srgb, var(--foreground) 5%, transparent)" }}
          />
          <button
            onClick={onRetranslate}
            disabled={isTranslating}
            className="p-2 bg-[var(--accent-color)] text-[var(--background)] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
            title="Regenerate"
          >
            {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-[12px] font-medium rounded-xl border transition-colors cursor-pointer"
            style={{ borderColor: "var(--border-color)", color: "var(--foreground)", background: "color-mix(in srgb, var(--foreground) 2%, transparent)" }}
          >
            {onApply ? "Cancel" : "Close"}
          </button>
          {onApply && (
            <button
              onClick={onApply}
              className="flex-1 py-2 text-[12px] font-bold rounded-xl bg-[var(--accent-color)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-[var(--background)] cursor-pointer"
            >
              <RefreshCw size={14} /> Replace Text
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default TranslationModal;
