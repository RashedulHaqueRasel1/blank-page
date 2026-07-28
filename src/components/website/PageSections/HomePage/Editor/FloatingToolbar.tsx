import React from "react";
import { createPortal } from "react-dom";
import { Copy, Check, Languages, Loader2 } from "lucide-react";

interface FloatingToolbarProps {
  show: boolean;
  top: number;
  left: number;
  copied: boolean;
  isTranslating: boolean;
  showTranslateOptions: boolean;
  selectedModel: string;
  models: { id: string; label: string }[];
  languages: string[];
  onCopy: () => void;
  onToggleTranslate: () => void;
  onSetModel: (id: string) => void;
  onTranslate: (lang: string) => void;
  onApplyColor: (color: string) => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  show,
  top,
  left,
  copied,
  isTranslating,
  showTranslateOptions,
  selectedModel,
  models,
  languages,
  onCopy,
  onToggleTranslate,
  onSetModel,
  onTranslate,
  onApplyColor,
}) => {
  if (!show || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed z-[9999] -translate-x-1/2 flex items-center gap-3 p-2.5 bg-[var(--navbar-bg)] text-[var(--foreground)] backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[var(--border-color)] animate-in fade-in zoom-in slide-in-from-top-2 md:slide-in-from-bottom-2 duration-200 floating-toolbar"
      style={{
        top: top,
        left: left,
        maxWidth: "90vw",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Formatting Section */}
      <div className="flex items-center gap-2 border-r border-[var(--border-color)] pr-3 mr-1">
        {[
          { color: "inherit", label: "Default" },
          { color: "#ffffff", label: "White" },
          { color: "#000000", label: "Black" },
          { color: "#ef4444", label: "Red" },
          { color: "#3b82f6", label: "Blue" },
          { color: "#10b981", label: "Green" },
          { color: "#f59e0b", label: "Amber" },
          { color: "#8b5cf6", label: "Purple" },
        ].filter(item => {
           const isDark = typeof document !== 'undefined' && (document.documentElement.classList.contains('dark') || document.body.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark');
           if (isDark && item.color === '#000000') return false; // don't show black option in dark themes
           if (!isDark && item.color === '#ffffff') return false; // don't show white option in light themes
           return true;
        }).map((item) => (
          <button
            key={item.color}
            onClick={() => onApplyColor(item.color)}
            className="w-5 h-5 rounded-full border border-[var(--border-color)] hover:scale-125 transition-transform cursor-pointer"
            style={{
              backgroundColor: item.color === "inherit" ? "transparent" : item.color,
            }}
            title={item.label}
          />
        ))}
      </div>

      {/* Copy Button */}
      <button
        onClick={onCopy}
        className="p-1.5 hover:bg-[var(--border-color)] rounded-lg transition-colors cursor-pointer text-[var(--foreground)] opacity-60 hover:opacity-100"
        title="Copy selection"
      >
        {copied ? (
          <Check size={16} className="text-green-500" />
        ) : (
          <Copy size={16} />
        )}
      </button>

      {/* Translation Section */}
      <div className="relative flex items-center">
        <div className="w-[1px] h-4 mx-1" style={{ background: "var(--border-color)" }} />
        <button
          onClick={onToggleTranslate}
          className="p-1.5 hover:bg-[var(--border-color)] rounded-lg transition-colors cursor-pointer text-[var(--foreground)] opacity-60 hover:opacity-100 flex items-center gap-1"
          title="Translate"
        >
          {isTranslating ? (
            <Loader2 size={16} className="animate-spin text-accent-color" />
          ) : (
            <Languages size={16} />
          )}
        </button>

        {showTranslateOptions && (
          <div
            className="absolute top-full left-0 mt-2 w-56 text-[var(--foreground)] backdrop-blur-3xl rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[var(--border-color)] py-2 z-[110] animate-in fade-in zoom-in duration-200"
            style={{ backgroundColor: "var(--background)" }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >


            {/* AI Model Selection */}
            <div className="px-3 mb-2 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">
                AI Model
              </span>
              <div className="flex gap-1 mt-1">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSetModel(m.id)}
                    className={`flex-1 py-1 text-[9px] rounded-md transition-all ${selectedModel === m.id
                        ? "bg-[var(--accent-color)] cursor-pointer font-bold"
                        : "opacity-60 cursor-pointer hover:opacity-100"
                      }`}
                    style={{ 
                      color: selectedModel === m.id ? "var(--background)" : "var(--foreground)",
                      backgroundColor: selectedModel !== m.id ? "transparent" : undefined
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Language */}
            <span className="px-3 text-[10px] font-bold opacity-30 uppercase tracking-tighter">
              Target Language
            </span>
            <div className="mt-1 max-h-40 overflow-y-auto no-scrollbar">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => onTranslate(lang)}
                  className="w-full text-left px-3 py-1.5 text-[12px] transition-colors cursor-pointer text-[var(--foreground)] hover:bg-[var(--border-color)] font-medium rounded-md"
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </div>,
    document.body
  );
};

export default FloatingToolbar;
