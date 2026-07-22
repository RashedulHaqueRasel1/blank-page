const MIRROR_STYLE_KEYS = [
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "letterSpacing",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "whiteSpace",
  "wordSpacing",
  "wordBreak",
  "overflowWrap",
  "tabSize",
] as const;

export const getTextareaSelectionRect = (
  textarea: HTMLTextAreaElement
): DOMRect | null => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  if (start === end) return null;

  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  mirror.setAttribute("aria-hidden", "true");
  mirror.style.position = "fixed";
  mirror.style.left = "0";
  mirror.style.top = "0";
  mirror.style.pointerEvents = "none";
  mirror.style.opacity = "0";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";

  MIRROR_STYLE_KEYS.forEach((key) => {
    mirror.style[key] = computed[key];
  });

  mirror.scrollTop = textarea.scrollTop;
  mirror.scrollLeft = textarea.scrollLeft;

  const before = document.createTextNode(textarea.value.slice(0, start));
  const selected = document.createElement("span");
  selected.textContent = textarea.value.slice(start, end) || " ";
  const after = document.createTextNode(textarea.value.slice(end) || " ");

  mirror.append(before, selected, after);
  document.body.appendChild(mirror);

  const selectedRect = selected.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();

  const rect = new DOMRect(
    textareaRect.left + (selectedRect.left - mirror.getBoundingClientRect().left) - textarea.scrollLeft,
    textareaRect.top + (selectedRect.top - mirror.getBoundingClientRect().top) - textarea.scrollTop,
    Math.max(selectedRect.width, 12),
    Math.max(selectedRect.height, parseFloat(computed.lineHeight || "20"))
  );

  mirror.remove();
  return rect;
};
