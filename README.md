# Blank Page - Minimalist AI-Powered Writing Editor

Blank Page is a distraction-free, minimalist writing interface designed for high-fidelity writing and seamless AI-powered translations. Built with Next.js, it combines elegant design with professional-grade security and advanced AI capabilities.

![Blank Page Editor](/public/banner-preview.png)

## 🚀 Key Features

### 🤖 AI-Powered Translation
- **OpenRouter Integration**: Securely leverages world-class AI models (like GPT-4o-mini and Llama 3.1) via OpenRouter.
- **Custom Prompts**: Beyond simple translation, users can provide 1-line instructions (e.g., "make it more professional", "translate with humor") to guide the AI's output.
- **Model Selection**: Switch between **Fast Mode** (efficiency) and **Pro Mode** (advanced reasoning).
- **In-Place Replacement**: Preview translations in a beautiful modal and replace original text with one click.

### 🛡️ Security Hardening
- **Server-Side Proxy**: All AI API calls are handled server-side to keep API keys private.
- **Security Handshake**: Implemented a secret token verification (`x-api-secret`) between the client and server to prevent unauthorized API abuse.
- **Model Obfuscation**: Internal AI model names are hidden from the frontend via mapping (e.g., `m1`, `m2`).

### ✍️ Premium Writing Experience
- **Floating Context Toolbar**: Appears on text selection for quick formatting and AI actions.
- **Visual Selection Retention**: Keeps your selected text highlighted even while you're typing AI instructions.
- **Clean Paste Logic**: Automatically extracts plain text from the clipboard, preventing messy HTML formatting from external websites.
- **Typewriter Sounds**: Immersive auditory feedback for every keystroke (optional).
- **Auto-Save**: Powered by **IndexedDB (v4)** for robust, offline-first document persistence.

### 🎨 Design & Aesthetics
- **Glassmorphic UI**: Modern, translucent interfaces with smooth animations.
- **Themes**: Support for Light, Dark, Sepia, and various premium dark modes (Midnight, Forest, etc.).
- **Responsive Design**: Optimized for both desktop and mobile writing.

## 🛠️ Tech Stack
- **Framework**: Next.js 14+
- **Styling**: Vanilla CSS / Tailwind CSS
- **Icons**: Lucide React
- **Database**: IndexedDB (Browser-native)
- **AI Backend**: OpenRouter API (via secure Next.js Route Handlers)

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RashedulHaqueRasel1/blank-page.git
   cd blank-page
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root:
   ```env
   OPENROUTER_API_KEY=your_openrouter_key
   MODEL_M1=openai/gpt-4o-mini
   MODEL_M2=meta-llama/llama-3.1-8b-instruct:free
   INTERNAL_API_SECRET=your_secure_secret_token
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure
- `src/components/website/PageSections/HomePage/Banner.tsx`: Core Editor Logic.
- `src/components/website/PageSections/HomePage/Editor/FloatingToolbar.tsx`: Formatting & AI UI.
- `src/components/website/PageSections/HomePage/Editor/TranslationModal.tsx`: AI Result Handling.
- `src/app/api/translate/route.ts`: Secure AI API Gateway.

## 📄 License
This project is licensed under the MIT License.
