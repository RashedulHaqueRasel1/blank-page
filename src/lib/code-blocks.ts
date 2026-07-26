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
  let highlighted = code;

  // Highlight headers (# Header)
  highlighted = highlighted.replace(
    /^(&gt;|\s*)*(#{1,6}\s+[^\n]+)/gm,
    '<span class="token-tag font-bold">$2</span>'
  );

  // Highlight bold (**bold**)
  highlighted = highlighted.replace(
    /(\*\*|__)(.*?)\1/g,
    '<span class="token-keyword font-bold">$2</span>'
  );

  // Highlight inline code (`code`)
  highlighted = highlighted.replace(
    /(`[^`\n]+`)/g,
    '<span class="token-string">$1</span>'
  );

  // Highlight links [text](url)
  highlighted = highlighted.replace(
    /(\[[^\]]+\])(\([^)]+\))/g,
    '<span class="token-attr">$1</span><span class="token-comment">$2</span>'
  );

  // Highlight list bullets (- item, * item, 1. item)
  highlighted = highlighted.replace(
    /^(\s*)([-*+]|\d+\.)(\s+)/gm,
    '$1<span class="token-punctuation">$2</span>$3'
  );

  // Highlight horizontal rules (--- or ***)
  highlighted = highlighted.replace(
    /^(\s*[-*_]{3,}\s*)$/gm,
    '<span class="token-punctuation">$1</span>'
  );

  return highlighted;
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
    /\b(const|let|var|function|return|if|else|for|while|class|interface|type|import|export|async|await|try|catch|new|true|false|null|undefined)\b/g,
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

  if ((/^\s*[{[]/.test(rawCode) && /":/.test(rawCode)) || /^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/m.test(rawCode)) {
    return highlightJsonLike(escapedCode);
  }

  if (/^\s*<\/?[a-z]/im.test(rawCode) || /\bclassName=|<div\b|<section\b|<span\b/.test(rawCode)) {
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
  if (/^\s*[{[]/.test(code) && /":/.test(code)) return "JSON";
  if (/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/m.test(code)) return "API";
  if (/^\s*<\/?[a-z]/im.test(code)) return "HTML";
  if (/\b(interface|type|import)\b/.test(code)) return "TS";
  if (/\b(const|let|function|=>)\b/.test(code)) return "JS";
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
  if (!codeInput || !codePreview) return;

  codeInput.style.height = "0px";
  codeInput.style.height = `${Math.max(codeInput.scrollHeight, codePreview.scrollHeight)}px`;
  codePreview.scrollTop = codeInput.scrollTop;
  codePreview.scrollLeft = codeInput.scrollLeft;
};

export const isLikelyCodeSnippet = (text: string) => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return false;

  if (/^#\s+|^\s*#{1,6}\s+|\b(README|Table of Contents|Getting Started|Overview)\b/i.test(normalized) && normalized.split("\n").length >= 2) {
    return true;
  }

  const lines = normalized.split("\n");
  if (lines.length >= 2) {
    return CODE_HINT_PATTERNS.some((pattern) => pattern.test(normalized));
  }

  return /[{}();<>]/.test(normalized) && /[:=]/.test(normalized);
};

export const createCodeBlockHtml = (rawCode: string) => {
  const normalized = rawCode.replace(/\r\n/g, "\n").trim();
  const highlightedCode = highlightCode(normalized);
  const codeLabel = detectCodeLabel(normalized);

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
    "  </div>",
    "</div>",
    "<p><br></p>",
  ].join("");
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
  if (!codeInput || !codePreview || !codeLabel) return;

  codePreview.innerHTML = `<code>${highlightCode(codeInput.value)}</code>`;
  codeLabel.textContent = detectCodeLabel(codeInput.value);
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
  blocks.forEach((block) => updateCodeBlockPresentation(block));
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
