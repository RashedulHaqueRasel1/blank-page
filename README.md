# 📝 Blank Notes — Minimalist Writing & Publishing Web App

> A modern, distraction-free note-taking, local-first drafting, real-time collaboration, and cloud-publishing web application built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **TypeScript**, and **IndexedDB**.

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [How It Works](#-how-it-works)
- [Environment Configuration](#-environment-configuration)
- [Getting Started](#-getting-started)
- [Author](#-author)
- [License](#-license)

---

## 🚀 Features

- ✍️ **Distraction-Free Editor**: Ultra-minimalist interface with real-time word counter, customizable typography, and typewriter sound effects.
- 🎨 **Multiple Visual Themes**: Light, Dark, Sepia Paper, Midnight Sky, Forest Deep, Ocean Depths, Rose Noir, and Coffee House.
- 🖋️ **Canvas Drawing Overlay**: Sketch, draw, and annotate directly over notes with custom pen colors and eraser modes.
- 💾 **Local-First IndexedDB Storage**: Automatic instant background saving to browser IndexedDB (`EditorDB`) for 100% offline availability.
- 🌐 **Instant Web Publishing**: Publish notes to custom URLs (slugs) with optional password protection, one-time viewing, editable rooms, and expiration dates.
- ☁️ **Cloud Backup & Restore**: Sync local IndexedDB notes securely to cloud storage using single-use email OTP verification.
- ⌨️ **AI Typing Test Benchmark**: Evaluate typing speed (WPM) and accuracy on AI-generated paragraphs across various languages.
- ⚡ **Real-Time Collaboration**: Multi-user live editing with presence indicators when working on shared editable notes.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: Tailwind CSS v4, Lucide Icons, Framer Motion, Animated CSS
- **State & Local Storage**: Custom React Context & IndexedDB API (`idb`)
- **Fonts**: Geist Sans, Geist Mono, IBM Plex Sans, Lora, Cousine, Poppins
- **Language**: TypeScript

---

## 📁 Project Architecture

```text
blank-page/
├── public/                    # Static brand assets, favicon, and PWA manifest
├── src/
│   ├── app/                   # Next.js App Router (Pages & Proxy Routes)
│   │   ├── (website)/         # Primary user routes
│   │   │   ├── page.tsx       # Main Note Editor page
│   │   │   ├── [customUrl]/   # Published note viewer page
│   │   │   ├── typing-test/   # AI typing benchmark page
│   │   │   ├── about/         # About page
│   │   │   ├── terms/         # Terms of Service
│   │   │   └── updates/       # Changelog & Updates
│   │   ├── api/               # API Proxy routes for server communication
│   │   ├── globals.css        # Tailwind v4 theme variables and design tokens
│   │   └── layout.tsx         # Root layout with Google Fonts
│   ├── components/
│   │   ├── ui/                # Reusable UI primitives
│   │   └── website/
│   │       ├── Common/        # Navbar, Sidebar, Footer, PWA Prompts
│   │       └── PageSections/  # Editor, Publish Modals, Drawing Tools
│   ├── lib/                   # API clients and utility functions
│   └── Providers/             # Theme, Query, and Toast context providers
├── next.config.ts             # Next.js build configuration
├── postcss.config.mjs         # PostCSS plugins
└── package.json               # Package dependencies & scripts
```

---

## 🔄 How It Works

1. **Local Drafting**:
   - As you type, notes are saved instantly to the browser's IndexedDB (`EditorDB`).
   - Notes remain accessible even when completely offline or during browser reloads.

2. **Publishing to Web**:
   - The Publish Modal allows setting a custom URL slug, security password, and editing permissions.
   - The client sends the payload via Next.js API routes (`/api/pages`) to the backend server, persisting the document in MongoDB.

3. **Cloud Backup**:
   - Users enter their email to receive a single-use 6-digit OTP code via Brevo.
   - Upon verification, an encrypted `backupToken` is issued, enabling seamless cloud synchronization between local IndexedDB and MongoDB.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root folder. Do not expose production secrets in client environments.

```env
# Backend API Base URLs
NEXT_PUBLIC_SERVER_URL="http://localhost:5000"
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_key"
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: `>= 20.20.0`
- **pnpm**: `>= 10.x`

### Setup Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Run Development Server (Port 3000)
pnpm dev

# 3. Build for Production
pnpm build

# 4. Start Production Server
pnpm start
```

---

## 🧑‍💻 Author

**Rashedul Haque Rasel**

- 💬 WhatsApp: [+8801772582460](https://wa.me/8801772582460)
- 📧 Email: [rashedulhaquerasel1@gmail.com](mailto:rashedulhaquerasel1@gmail.com)
- 🌐 Portfolio: [rashedul-haque-rasel.vercel.app](https://rashedul-haque-rasel.vercel.app)
- 💼 LinkedIn: [Rashedul Haque Rasel](https://www.linkedin.com/in/rashedul-haque-rasel)

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).
