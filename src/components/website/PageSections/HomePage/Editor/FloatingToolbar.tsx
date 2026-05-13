import React from "react";
import { Copy, Check, Languages, Loader2 } from "lucide-react";

interface FloatingToolbarProps {
  show: boolean;
  top: number;
  left: number;
  copied: boolean;
  isTranslating: boolean;
  showTranslateOptions: boolean;
  customInstruction: string;
  selectedModel: string;
  models: { id: string; label: string }[];
  languages: string[];
  onCopy: () => void;
  onToggleTranslate: () => void;
  onSetCustomInstruction: (val: string) => void;
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
  customInstruction,
  selectedModel,
  models,
  languages,
  onCopy,
  onToggleTranslate,
  onSetCustomInstruction,
  onSetModel,
  onTranslate,
  onApplyColor,
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed z-[100] -translate-x-1/2 flex items-center gap-3 p-2.5 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in slide-in-from-top-2 md:slide-in-from-bottom-2 duration-200 floating-toolbar"
      style={{
        top: top,
        left: left,
        maxWidth: "90vw",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Formatting Section */}
      <div className="flex items-center gap-2 border-r border-gray-100 dark:border-white/10 pr-3 mr-1">
        {[
          { color: "inherit", label: "Default" },
          { color: "#ef4444", label: "Red" },
          { color: "#3b82f6", label: "Blue" },
          { color: "#10b981", label: "Green" },
          { color: "#f59e0b", label: "Amber" },
          { color: "#8b5cf6", label: "Purple" },
        ].map((item) => (
          <button
            key={item.color}
            onClick={() => onApplyColor(item.color)}
            className="w-5 h-5 rounded-full border border-gray-200 dark:border-white/20 hover:scale-125 transition-transform cursor-pointer"
            style={{
              backgroundColor:
                item.color === "inherit" ? "transparent" : item.color,
            }}
            title={item.label}
          />
        ))}
      </div>

      {/* Copy Button */}
      <button
        onClick={onCopy}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-500 dark:text-gray-400"
        title="Copy selection"
      >
        {copied ? (
          <Check size={16} className="text-green-500" />
        ) : (
          <Copy size={16} />
        )}
      </button>

      {/* Translation Section */}
      <div className="relative">
        <button
          onClick={onToggleTranslate}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-500 dark:text-gray-400 flex items-center gap-1"
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
            className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 py-2 z-[110] animate-in fade-in zoom-in duration-200"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Custom Instruction */}
            <div className="px-3 mb-2 pb-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter mb-1 block">
                Prompt (Optional)
              </span>
              <input
                type="text"
                placeholder="e.g. more professional"
                value={customInstruction}
                onChange={(e) => onSetCustomInstruction(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-gray-50 dark:border-white/5 outline-none px-3 py-2 rounded-lg text-[11px] placeholder:opacity-40 focus:ring-1 focus:ring-[var(--accent-color)] transition-all"
              />
            </div>

            {/* AI Model Selection */}
            <div className="px-3 mb-2 pb-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">
                AI Model
              </span>
              <div className="flex gap-1 mt-1">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSetModel(m.id)}
                    className={`flex-1 py-1 text-[9px] rounded-md transition-all ${selectedModel === m.id
                        ? "bg-[var(--accent-color)] text-black cursor-pointer font-bold"
                        : "hover:bg-gray-100 dark:hover:bg-white/5 opacity-60 cursor-pointer "
                      }`}
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
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingToolbar;
