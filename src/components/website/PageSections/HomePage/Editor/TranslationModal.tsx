import React from "react";
import { X, Copy, Check, RefreshCw } from "lucide-react";

interface TranslationModalProps {
  translationResult: string;
  resultCopied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onApply: () => void;
}

const TranslationModal: React.FC<TranslationModalProps> = ({
  translationResult,
  resultCopied,
  onClose,
  onCopy,
  onApply,
}) => {
  if (!translationResult) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-[400px] bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-5 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-start mb-3">
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
      <p className="text-[14px] leading-relaxed mb-6 text-[var(--editor-text)]">
        {translationResult}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-[12px] font-medium rounded-xl border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-2.5 text-[12px] font-bold rounded-xl bg-[var(--accent-color)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-black cursor-pointer"
        >
          <RefreshCw size={14} /> Replace Text
        </button>
      </div>
    </div>
  );
};

export default TranslationModal;
