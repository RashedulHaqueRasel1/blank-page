const CODE_HINT_PATTERNS = [
  /^\s*[{[]/,
  /^\s*<\/?[a-z]/i,
  /^\s*(const|let|var|function|return|if|for|while|class|interface|type|import|export)\b/m,
  /^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/m,
  /=>/,
  /[{;}]/,
  /^\s*#{1,6}\s+/m,
  /^\s*[-*+]\s+/m,
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const highlightJsonLike = (code: string) =>
  code.replace(
    /(&quot;[^&]*&quot;)(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g,
    (match, quoted, colon) => {
      if (quoted) {
        const className = colon ? "token-key" : "token-string";
        return `<span class="${className}">${quoted}</span>${colon || ""}`;
      }

      return `<span class="token-number">${match}</span>`;
    }
  );

const highlightMarkupLike = (code: string) => {
  const withComments = code.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<span class="token-comment">$1</span>'
  );

  return withComments.replace(
    /(&lt;\/?)([A-Za-z][\w:-]*)([\s\S]*?)(\/?&gt;)/g,
    (_, open, tagName, attrs, close) => {
      const highlightedAttrs = attrs.replace(
        /([A-Za-z_:][\w:.-]*)(=)(&quot;.*?&quot;|&#39;.*?&#39;|\{[^}]*\})?/g,
        (_attrMatch: string, attrName: string, equal: string, attrValue = "") => {
          const valueMarkup = attrValue
            ? `<span class="token-string">${attrValue}</span>`
            : "";

          return `<span class="token-attr">${attrName}</span><span class="token-punctuation">${equal}</span>${valueMarkup}`;
        }
      );

      return `<span class="token-punctuation">${open}</span><span class="token-tag">${tagName}</span>${highlightedAttrs}<span class="token-punctuation">${close}</span>`;
    }
  );
};

const highlightCssLike = (code: string) => {
  let highlighted = code;

  highlighted = highlighted.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    '<span class="token-comment">$1</span>'
  );

  highlighted = highlighted.replace(
    /([.#]?[A-Za-z_-][\w-]*\s*)(\{)/g,
    '<span class="token-selector">$1</span><span class="token-punctuation">$2</span>'
  );

  highlighted = highlighted.replace(
    /([A-Za-z-]+)(\s*:)([^;]+)(;?)/g,
    '<span class="token-attr">$1</span><span class="token-punctuation">$2</span><span class="token-string">$3</span><span class="token-punctuation">$4</span>'
  );

  return highlighted.replace(
    /([{}])/g,
    '<span class="token-punctuation">$1</span>'
  );
};

const highlightMarkdownLike = (code: string) => {
  const lines = code.split("\n");
  const highlightedLines = lines.map((line) => {
    if (/^\s*#{1,6}\s+/.test(line)) {
      return `<span class="token-tag font-bold">${line}</span>`;
    }
    if (/^\s*[-*_]{3,}\s*$/.test(line)) {
      return `<span class="token-punctuation font-bold">${line}</span>`;
    }
    let processed = line;
    if (/^\s*&gt;/.test(processed)) {
      processed = processed.replace(/^(\s*&gt;\s*)(.*)/, '<span class="token-comment">$1</span>$2');
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(processed)) {
      processed = processed.replace(/^(\s*)([-*+]|\d+\.)(\s+)/, '$1<span class="token-punctuation">$2</span>$3');
    }
    processed = processed.replace(/(`[^`\n]+`)/g, '<span class="token-string">$1</span>');
    processed = processed.replace(/(\*\*|__)(.*?)\1/g, '<span class="token-keyword font-bold">$1$2$1</span>');
    return processed;
  });

  return highlightedLines.join("\n");
};

const highlightGenericCode = (code: string) => {
  let highlighted = code;

  highlighted = highlighted.replace(
    /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g,
    '<span class="token-comment">$1</span>'
  );

  highlighted = highlighted.replace(
    /(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g,
    '<span class="token-string">$1</span>'
  );

  highlighted = highlighted.replace(
    /\b(const|let|var|function|return|if|else|for|while|class|interface|type|import|export|from|async|await|try|catch|new|true|false|null|undefined|default|extends|implements)\b/g,
    '<span class="token-keyword">$1</span>'
  );

  highlighted = highlighted.replace(
    /\b\d+(?:\.\d+)?\b/g,
    '<span class="token-number">$&</span>'
  );

  return highlighted;
};

const highlightCode = (rawCode: string) => {
  const escapedCode = escapeHtml(rawCode);
  if (/^\s*#\s+|^\s*#{1,6}\s+|\b(README|Table of Contents|Getting Started|Overview)\b/i.test(rawCode)) {
    return highlightMarkdownLike(escapedCode);
  }

  if (/\b(import|export|const|let|var|function|return|interface|type|class|async|await)\b/.test(rawCode)) {
    return highlightGenericCode(escapedCode);
  }

  if ((/^\s*[{[]/.test(rawCode) && /":/.test(rawCode)) || /^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/m.test(rawCode)) {
    return highlightJsonLike(escapedCode);
  }

  if (/^\s*<(?:!DOCTYPE|html|head|body|div|section|svg|script|style|form)\b/im.test(rawCode)) {
    return highlightMarkupLike(escapedCode);
  }

  if (/{[\s\S]*:[\s\S]*;/.test(rawCode) && !/\b(const|let|function|=>|return)\b/.test(rawCode)) {
    return highlightCssLike(escapedCode);
  }

  return highlightGenericCode(escapedCode);
};

const detectCodeLabel = (code: string) => {
  if (/^\s*#\s+|^\s*#{1,6}\s+|^\s*#\s+[\s\S]*\b(README|Table of Contents|Overview|Getting Started|Installation)\b/i.test(code) || /^\s*#\s+/m.test(code)) return "README.md";
  if (/^(\s*#{1,6}\s+|^\s*[-*+]\s+\[[ x]\]|^\s*```)/m.test(code)) return "MARKDOWN";
  if (/\b(interface|type|import|export)\b/.test(code)) return "TS";
  if (/\b(const|let|function|=>|var|async|await)\b/.test(code)) return "JS";
  if (/^\s*[{[]/.test(code) && /":/.test(code)) return "JSON";
  if (/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/m.test(code)) return "API";
  if (/^\s*<(?:!DOCTYPE|html|head|body|div|section|svg)\b/im.test(code)) return "HTML";
  return "Code";
};

const getCodeInput = (container: ParentNode) =>
  container.querySelector<HTMLTextAreaElement>("[data-code-editor]");

const getCodePreview = (container: ParentNode) =>
  container.querySelector<HTMLElement>("[data-code-preview]");

const getCodeLabel = (container: ParentNode) =>
  container.querySelector<HTMLElement>("[data-code-label]");

const syncCodeBlockLayout = (block: HTMLElement) => {
  const codeInput = getCodeInput(block);
  const codePreview = getCodePreview(block);
  if (!codeInput) return;

  codeInput.style.height = "auto";
  const lineCount = (codeInput.value.match(/\n/g) || []).length + 1;
  const computedHeight = Math.max(90, Math.ceil(lineCount * 25.8) + 40);
  const actualHeight = Math.max(computedHeight, codeInput.scrollHeight);

  codeInput.style.height = `${actualHeight}px`;
  if (codePreview) {
    codePreview.style.height = `${actualHeight}px`;
    codePreview.scrollTop = 0;
    codePreview.scrollLeft = codeInput.scrollLeft;
  }
};

export const isLikelyCodeSnippet = (text: string) => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return false;

  // 1. Explicit Markdown Code Block fences: ``` ... ```
  if (/^```[a-z0-9_-]*\n[\s\S]*```$/i.test(normalized) || /```[\s\S]*```/.test(normalized)) {
    return true;
  }

  // 2. README.md structure: starts with # Header and contains markdown README sections
  if (/^\s*#\s+[^\n]+/m.test(normalized)) {
    if (/\b(README|Table of Contents|Getting Started|Installation|Overview|Folder Structure|Environment Variables|Prerequisites|Usage|License|Features|Quick Start)\b/i.test(normalized)) {
      return true;
    }
  }

  // 3. Valid JSON object or array
  if (/^\s*[\{\[]/.test(normalized) && /[\}\]]$/.test(normalized)) {
    try {
      JSON.parse(normalized);
      return true;
    } catch {
      // Continue checks if not valid JSON
    }
  }

  // 4. HTML / XML markup (e.g. <!DOCTYPE, <html>, <div>, <svg>, <script>, etc. with closing tags)
  if (/^\s*<(?:!DOCTYPE|html|head|body|div|section|span|p|a|svg|script|style|table|form|input|button|h[1-6])\b/i.test(normalized)) {
    if (/<\/[a-z0-9]+>/i.test(normalized) || /\/>/.test(normalized)) {
      return true;
    }
  }

  // 5. Explicit code statements & programming language keywords
  const strongCodePatterns = [
    /^\s*(import\s+[\s\S]*?\s+from\s+['"]|export\s+(default\s+)?(const|function|class|type|interface)\b)/m,
    /^\s*(const|let|var)\s+[a-zA-Z_$][\w_$]*\s*=/m,
    /^\s*(async\s+)?function\s*\w*\s*\([^)]*\)\s*\{/m,
    /^\s*class\s+[a-zA-Z_$][\w_$]*\s*(extends\s+[a-zA-Z_$][\w_$]*)?\s*\{/m,
    /^\s*(public|private|protected|static)\s+(final\s+)?(void|int|string|boolean|class|async)\b/im,
    /^\s*#include\s*<[^>]+>/m,
    /^\s*(package|using)\s+[a-zA-Z0-9_.]+\s*;/m,
    /^\s*def\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:/m,
    /^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/[a-zA-Z0-9_/-]+/m,
    /^\s*(git\s+(clone|commit|push|pull|checkout)|npm\s+(install|run|start)|pnpm\s+(add|run|dev)|pip\s+install|docker\s+run)\b/m,
    /^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE)\b/im,
  ];

  if (strongCodePatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return false;
};

export const renderMarkdownToHtml = (markdown: string): string => {
  if (!markdown.trim()) return "<p class='opacity-50 italic'>Empty document</p>";

  const lines = markdown.split("\n");
  const htmlResult: string[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" = "ul";

  const closeList = () => {
    if (inList) {
      htmlResult.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
    }
  };

  const parseInlineMarkdown = (text: string): string => {
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="bn-md-inline-code">$1</code>');
    escaped = escaped.replace(/(\*\*\*|___)(.*?)\1/g, '<strong><em>$2</em></strong>');
    escaped = escaped.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
    escaped = escaped.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    escaped = escaped.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="bn-md-link">$1</a>'
    );
    return escaped;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      closeList();
      if (inCodeBlock) {
        const rawCode = codeBlockBuffer.join("\n");
        const escaped = escapeHtml(rawCode);
        htmlResult.push(`<pre class="bn-md-code-block"><code>${escaped}</code></pre>`);
        inCodeBlock = false;
        codeBlockBuffer = [];
      } else {
        inCodeBlock = true;
        codeBlockBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    if (/^\s*[-*_]{3,}\s*$/.test(line)) {
      closeList();
      htmlResult.push('<hr class="bn-md-hr" />');
      continue;
    }

    const headerMatch = line.match(/^(\s*)(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      closeList();
      const level = headerMatch[2].length;
      const titleText = parseInlineMarkdown(headerMatch[3]);
      htmlResult.push(`<h${level} class="bn-md-h${level}">${titleText}</h${level}>`);
      continue;
    }

    if (/^\s*>\s*(.*)$/.test(line)) {
      closeList();
      const quoteText = parseInlineMarkdown(line.replace(/^\s*>\s*/, ""));
      htmlResult.push(`<blockquote class="bn-md-quote">${quoteText}</blockquote>`);
      continue;
    }

    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        closeList();
        htmlResult.push('<ul class="bn-md-ul">');
        inList = true;
        listType = "ul";
      }
      const itemText = parseInlineMarkdown(ulMatch[3]);
      htmlResult.push(`<li>${itemText}</li>`);
      continue;
    }

    const olMatch = line.match(/^(\s*)(\d+\.)\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        closeList();
        htmlResult.push('<ol class="bn-md-ol">');
        inList = true;
        listType = "ol";
      }
      const itemText = parseInlineMarkdown(olMatch[3]);
      htmlResult.push(`<li>${itemText}</li>`);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    closeList();
    const parsedLine = parseInlineMarkdown(line);
    htmlResult.push(`<p class="bn-md-p">${parsedLine}</p>`);
  }

  closeList();
  return htmlResult.join("");
};

export const handleCodeTabSwitch = (target: HTMLElement) => {
  const tabButton = target.closest<HTMLElement>("[data-code-tab]");
  if (!tabButton) return false;

  const block = tabButton.closest<HTMLElement>("[data-code-block]");
  if (!block) return false;

  const tabMode = tabButton.getAttribute("data-code-tab");
  const codeBtn = block.querySelector<HTMLElement>('[data-code-tab="code"]');
  const previewBtn = block.querySelector<HTMLElement>('[data-code-tab="preview"]');
  const codePreview = getCodePreview(block);
  const codeEditor = getCodeInput(block);
  const renderedPreview = block.querySelector<HTMLElement>("[data-code-rendered-preview]");

  if (!codeEditor || !renderedPreview) return false;

  if (tabMode === "preview") {
    renderedPreview.innerHTML = renderMarkdownToHtml(codeEditor.value);
    renderedPreview.style.display = "block";
    if (codePreview) codePreview.style.display = "none";
    codeEditor.style.display = "none";

    codeBtn?.classList.remove("bn-code-block__toggle-btn--active");
    previewBtn?.classList.add("bn-code-block__toggle-btn--active");
  } else {
    renderedPreview.style.display = "none";
    if (codePreview) codePreview.style.display = "block";
    codeEditor.style.display = "block";

    previewBtn?.classList.remove("bn-code-block__toggle-btn--active");
    codeBtn?.classList.add("bn-code-block__toggle-btn--active");
    updateCodeBlockPresentation(block);
  }

  return true;
};

export const createCodeBlockHtml = (rawCode: string) => {
  const normalized = rawCode.replace(/\r\n/g, "\n").trim();
  const highlightedCode = highlightCode(normalized);
  const codeLabel = detectCodeLabel(normalized);
  const isReadmeOrMarkdown = codeLabel === "README.md" || codeLabel === "MARKDOWN";

  const toggleGroupHtml = isReadmeOrMarkdown
    ? `      <div class="bn-code-block__toggle-group" data-code-toggle-group="true">
        <button class="bn-code-block__toggle-btn bn-code-block__toggle-btn--active" data-code-tab="code" type="button" title="View Code / Markdown">Code</button>
        <button class="bn-code-block__toggle-btn" data-code-tab="preview" type="button" title="View Rendered Preview">Preview</button>
      </div>`
    : "";

  return [
    '<div class="bn-code-block" data-code-block="true">',
    '  <div class="bn-code-block__header" contenteditable="false">',
    '    <div class="bn-code-block__meta">',
    '      <span class="bn-code-block__traffic" aria-hidden="true">',
    '        <i></i><i></i><i></i>',
    "      </span>",
    `      <span class="bn-code-block__label" data-code-label="true">${codeLabel}</span>`,
    "    </div>",
    '    <div class="bn-code-block__actions" contenteditable="false">',
    toggleGroupHtml,
    '      <button class="bn-code-block__copy" data-code-copy-button="true" type="button" aria-label="Copy code" title="Copy code">',
    '        <svg class="bn-code-block__copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    '          <rect x="9" y="9" width="13" height="13" rx="2"></rect>',
    '          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
    "        </svg>",
    "      </button>",
    '      <button class="bn-code-block__delete" data-code-delete-button="true" type="button" aria-label="Delete code block" title="Delete code block">',
    '        <svg class="bn-code-block__delete-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    '          <path d="M3 6h18"></path>',
    '          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path>',
    '          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>',
    '          <path d="M10 11v6"></path>',
    '          <path d="M14 11v6"></path>',
    "        </svg>",
    "      </button>",
    "    </div>",
    "  </div>",
    '  <div class="bn-code-block__surface">',
    `    <pre class="bn-code-block__preview" data-code-preview="true" aria-hidden="true"><code>${highlightedCode}</code></pre>`,
    `    <textarea class="bn-code-block__editor" data-code-editor="true" spellcheck="false" wrap="off">${normalized}</textarea>`,
    '    <div class="bn-code-block__rendered-preview" data-code-rendered-preview="true" style="display: none;"></div>',
    "  </div>",
    "</div>",
    "<p><br></p>",
  ].filter(Boolean).join("\n");
};

export const createReadmeTemplateHtml = () => {
  const readmeContent = `# 📝 Project Title

A concise and compelling description of your project. Explain what it does, why it exists, and the key problems it solves.

---

## 📑 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Folder Structure](#-folder-structure)
4. [Getting Started](#-getting-started)
5. [Environment Variables](#-environment-variables)
6. [License](#-license)

---

## 🚀 Overview

Provide a high-level technical summary of the project architecture, target audience, and primary technologies used.

---

## ✨ Key Features

- **Feature 1**: Detailed explanation of the first awesome feature.
- **Feature 2**: Detailed explanation of the second key capability.
- **Feature 3**: High performance and responsive design out of the box.

---

## 📁 Folder Structure

\`\`\`text
project-root/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Application pages and routes
│   └── utils/         # Helper functions and hooks
├── public/            # Static assets
├── README.md          # Project documentation
└── package.json       # Dependencies and scripts
\`\`\`

---

## ⚡ Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm/pnpm installed.

### Installation
\`\`\`bash
# Clone the repository
git clone https://github.com/username/project-name.git

# Install dependencies
npm install

# Run the development server
npm run dev
\`\`\`

---

## 🔑 Environment Variables

Create a \`.env.local\` file in the root directory and configure:

\`\`\`env
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
\`\`\`

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.`;

  return createCodeBlockHtml(readmeContent);
};

export const copyCodeBlockFromTarget = async (target: HTMLElement) => {
  const codeContainer = target.closest("[data-code-block]");
  const codeInput = codeContainer ? getCodeInput(codeContainer) : null;
  const code = codeInput?.value.replace(/\u00a0/g, " ").trimEnd() || "";
  if (!code) return false;

  await navigator.clipboard.writeText(code);

  target.setAttribute("data-copied", "true");
  window.setTimeout(() => {
    target.removeAttribute("data-copied");
  }, 1800);

  return true;
};

export const deleteCodeBlockFromTarget = (target: HTMLElement) => {
  const codeContainer = target.closest("[data-code-block]") as HTMLElement | null;
  if (!codeContainer) return false;

  const nextSibling = codeContainer.nextElementSibling as HTMLElement | null;
  if (nextSibling?.tagName === "P" && nextSibling.innerHTML.trim().toLowerCase() === "<br>") {
    nextSibling.remove();
  }

  codeContainer.remove();
  return true;
};

export const updateCodeBlockPresentation = (block: HTMLElement) => {
  const codeInput = getCodeInput(block);
  const codePreview = getCodePreview(block);
  const codeLabel = getCodeLabel(block);
  if (!codeInput || !codeLabel) return;

  if (codePreview) {
    codePreview.innerHTML = `<code>${highlightCode(codeInput.value)}</code>`;
  }
  codeLabel.textContent = detectCodeLabel(codeInput.value);

  const renderedPreview = block.querySelector<HTMLElement>("[data-code-rendered-preview]");
  if (renderedPreview && renderedPreview.style.display !== "none") {
    renderedPreview.innerHTML = renderMarkdownToHtml(codeInput.value);
  }

  syncCodeBlockLayout(block);
};

export const setCodeBlocksEditable = (root: HTMLElement, editable: boolean) => {
  const editors = root.querySelectorAll<HTMLTextAreaElement>("[data-code-editor]");
  const deleteButtons = root.querySelectorAll<HTMLElement>("[data-code-delete-button]");

  editors.forEach((editor) => {
    editor.readOnly = !editable;
  });

  deleteButtons.forEach((button) => {
    button.style.display = editable ? "inline-flex" : "none";
  });
};

export const initializeCodeBlocks = (root: HTMLElement, editable: boolean) => {
  const blocks = root.querySelectorAll<HTMLElement>("[data-code-block]");
  blocks.forEach((block) => {
    const codeInput = getCodeInput(block);
    const labelText = getCodeLabel(block)?.textContent?.trim() || (codeInput ? detectCodeLabel(codeInput.value) : "");
    const isReadmeOrMarkdown = labelText === "README.md" || labelText === "MARKDOWN";

    let actions = block.querySelector<HTMLElement>(".bn-code-block__actions");
    let toggleGroup = actions?.querySelector<HTMLElement>("[data-code-toggle-group]");

    if (isReadmeOrMarkdown) {
      if (actions && !toggleGroup) {
        toggleGroup = document.createElement("div");
        toggleGroup.className = "bn-code-block__toggle-group";
        toggleGroup.setAttribute("data-code-toggle-group", "true");
        toggleGroup.innerHTML = `
          <button class="bn-code-block__toggle-btn bn-code-block__toggle-btn--active" data-code-tab="code" type="button" title="View Code / Markdown">Code</button>
          <button class="bn-code-block__toggle-btn" data-code-tab="preview" type="button" title="View Rendered Preview">Preview</button>
        `;
        actions.insertBefore(toggleGroup, actions.firstChild);
      }
    } else {
      if (toggleGroup) {
        toggleGroup.remove();
      }
    }

    // Ensure rendered preview element exists
    let surface = block.querySelector<HTMLElement>(".bn-code-block__surface");
    if (surface && !surface.querySelector("[data-code-rendered-preview]")) {
      const rendered = document.createElement("div");
      rendered.className = "bn-code-block__rendered-preview";
      rendered.setAttribute("data-code-rendered-preview", "true");
      rendered.style.display = "none";
      surface.appendChild(rendered);
    }

    const editor = getCodeInput(block);
    if (editor && !editor.dataset.isolated) {
      editor.dataset.isolated = "true";
      editor.addEventListener("keydown", (e) => {
        e.stopPropagation();
      });
      editor.addEventListener("keyup", (e) => {
        e.stopPropagation();
      });
      editor.addEventListener("select", (e) => {
        e.stopPropagation();
      });
    }

    updateCodeBlockPresentation(block);
  });
  setCodeBlocksEditable(root, editable);
};

export const syncCodeBlockScroll = (editor: HTMLTextAreaElement) => {
  const block = editor.closest("[data-code-block]") as HTMLElement | null;
  if (!block) return;

  const preview = getCodePreview(block);
  if (!preview) return;

  preview.scrollTop = editor.scrollTop;
  preview.scrollLeft = editor.scrollLeft;
};
