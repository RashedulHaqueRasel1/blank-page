"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, MoreHorizontal, Moon, Sun, Type, Maximize2, EyeOff, Eye, ChevronLeft, Check, Palette } from "lucide-react";

// Move sub-components outside the main component to avoid "Cannot create components during render" error
const ShortcutHint = ({ children }: { children: string }) => (
  <span className="text-[10px] opacity-40 font-mono border border-[var(--border-color)] px-1.5 py-0.5 rounded ml-auto group-hover:opacity-70 transition-opacity uppercase">
    {children}
  </span>
);

export default function Navbar() {
  const [theme, setTheme] = useState("light");
  const [wordCount, setWordCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuView, setMenuView] = useState("main"); 
  const [showCounter, setShowCounter] = useState(true);
  const [showThemeIcon, setShowThemeIcon] = useState(true);
  const [currentFont, setCurrentFont] = useState("draft");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeBtnRef = useRef<HTMLButtonElement>(null);

  const applyTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const toggleTheme = (event?: React.MouseEvent) => {
    const newTheme = theme === "light" ? "dark" : "light";
    

    if (event && document.startViewTransition) {
      const x = event.clientX;
      const y = event.clientY;
      const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));


      const transition = document.startViewTransition(() => applyTheme(newTheme));
      transition.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
          { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
        );
      });
    } else {
      applyTheme(newTheme);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
    setShowDropdown(false);
  };

  const toggleCounter = () => {
    const newState = !showCounter;
    setShowCounter(newState);
    localStorage.setItem("show-counter", String(newState));
    setShowDropdown(false);
  };

  const toggleThemeIconVisibility = () => {
    const newState = !showThemeIcon;
    setShowThemeIcon(newState);
    localStorage.setItem("show-theme-icon", String(newState));
    setShowDropdown(false);
  };

  const setFontStyle = (style: string) => {
    setCurrentFont(style);
    window.dispatchEvent(new CustomEvent("font-style-update", { detail: style }));
    localStorage.setItem("font-style", style);
    setShowDropdown(false);
    setMenuView("main");
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedCounter = localStorage.getItem("show-counter") !== "false";
    const savedThemeIcon = localStorage.getItem("show-theme-icon") !== "false";
    const savedFont = localStorage.getItem("font-style") || "draft";
    
    const timeoutId = setTimeout(() => {
      // Sync all states at once after mount
      if (savedTheme !== theme) setTheme(savedTheme);
      setShowCounter(savedCounter);
      setShowThemeIcon(savedThemeIcon);
      setCurrentFont(savedFont);

      if (savedTheme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }, 0);

    const handleWordCount = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setWordCount(customEvent.detail || 0);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setMenuView("main");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      
      if (key === "f") { e.preventDefault(); toggleFullscreen(); }
      if (key === "t") { e.preventDefault(); toggleTheme(); }
      if (key === "c") { e.preventDefault(); toggleCounter(); }
      if (key === "h") { e.preventDefault(); toggleThemeIconVisibility(); }
      if (key === "1") { e.preventDefault(); setFontStyle("modern"); }
      if (key === "2") { e.preventDefault(); setFontStyle("classic"); }
      if (key === "3") { e.preventDefault(); setFontStyle("draft"); }
      if (key === "escape") { setShowDropdown(false); setMenuView("main"); }
    };

    window.addEventListener("word-count-update", handleWordCount);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("word-count-update", handleWordCount);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [theme, showCounter, showThemeIcon, currentFont]);

  return (
    <nav className="w-full h-14 md:bg-transparent bg-[var(--navbar-bg)] border-b border-transparent md:border-none border-[var(--border-color)] flex items-center justify-between px-6 fixed top-0 left-0 z-50 md:pointer-events-none transition-all duration-300">
      <div className="flex items-center gap-5 md:pointer-events-auto">
        <button className="text-[#666] hover:text-black dark:hover:text-white transition-colors duration-200">
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-center gap-6 text-[#666] md:pointer-events-auto">
        {showCounter && (
          <span className="text-[13px] font-medium tracking-tight opacity-70 select-none">{wordCount} words</span>
        )}

        <div className="flex items-center gap-5 relative">
          {showThemeIcon && (
            <button onClick={(e) => toggleTheme(e)} className="hover:text-black dark:hover:text-white transition-colors duration-200">
              {theme === "light" ? <Moon size={19} strokeWidth={1.5} /> : <Sun size={19} strokeWidth={1.5} />}
            </button>
          )}

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowDropdown(!showDropdown)} className="hover:text-black dark:hover:text-white transition-colors duration-200">
              <MoreHorizontal size={19} strokeWidth={1.5} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-[var(--navbar-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl py-1.5 z-[60] pointer-events-auto overflow-hidden animate-in fade-in zoom-in duration-200">
                {menuView === "main" ? (
                  <>
                    <button onClick={toggleFullscreen} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center group transition-colors">
                      <div className="flex items-center gap-3"><Maximize2 size={15} /> Full screen</div>
                      <ShortcutHint>F</ShortcutHint>
                    </button>
                    
                    <button onClick={() => toggleTheme()} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center group transition-colors">
                      <div className="flex items-center gap-3">
                        {theme === "light" ? <Moon size={15} /> : <Sun size={15} />} 
                        {theme === "light" ? "Dark theme" : "Light theme"}
                      </div>
                      <ShortcutHint>T</ShortcutHint>
                    </button>

                    <button onClick={() => setMenuView("fonts")} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center group transition-colors">
                      <div className="flex items-center gap-3"><Type size={15} /> Font style</div>
                      <ShortcutHint>1,2,3</ShortcutHint>
                    </button>

                    <div className="h-[1px] bg-[var(--border-color)] my-1" />

                    <button onClick={toggleCounter} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center group transition-colors">
                      <div className="flex items-center gap-3">
                        {showCounter ? <EyeOff size={15} /> : <Eye size={15} />}
                        {showCounter ? "Hide counter" : "Show counter"}
                      </div>
                      <ShortcutHint>C</ShortcutHint>
                    </button>

                    <button onClick={toggleThemeIconVisibility} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center group transition-colors">
                      <div className="flex items-center gap-3"><Palette size={15} /> Theme icon</div>
                      <ShortcutHint>H</ShortcutHint>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setMenuView("main")} className="w-full text-left px-4 py-1.5 text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors">
                      <ChevronLeft size={13} /> Back
                    </button>
                    <div className="mt-1">
                      <button onClick={() => setFontStyle("modern")} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center justify-between transition-colors">
                        Modern {currentFont === "modern" && <Check size={13} />}
                      </button>
                      <button onClick={() => setFontStyle("classic")} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center justify-between transition-colors font-serif">
                        Classic {currentFont === "classic" && <Check size={13} />}
                      </button>
                      <button onClick={() => setFontStyle("draft")} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center justify-between transition-colors">
                        Draft {currentFont === "draft" && <Check size={13} />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}