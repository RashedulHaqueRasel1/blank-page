# Blank Page — Minimalist AI-Powered Writing Editor & Publishing Platform

**Blank Page** is a distraction-free, privacy-first writing application built for creators who want to write, publish, and share their work instantly — with zero logins required. It combines a local-first offline editor with a powerful real-time publishing engine, AI translation, optional password protection, and self-destructing one-time view pages.

---

## 🚀 Feature Overview

### ✍️ 1. Local-First Offline Editor
- **IndexedDB (v4)** — Every keystroke is saved directly to the browser's native IndexedDB. Zero cloud dependency. Zero data loss.
- **Multi-Tab Document Management** — Create, switch, pin, rename, and delete unlimited local drafts from a sleek sidebar panel.
- **Premium Customizer** — 8 built-in themes (Light, Dark, Sepia, Midnight, Forest, Ocean, Rose, Coffee), 3 font styles (Draft, Classic, Mono), and optional typewriter sound effects.
- **Floating Context Toolbar** — Select any text to get an instant AI-powered toolbar: Copy, Translate, and Apply Color — all without leaving the page.

### 🌐 2. Instant Web Publishing
- **One-Click Publish** — Exports a draft to the cloud instantly, generating a unique shareable URL (e.g. `yoursite.com/bp-xyz123`).
- **Configurable Access Mode** — Authors choose `View Only` or `Editable` (real-time collaborative) mode per page.
- **Flexible Expiration** — Set auto-expiry from 1 Hour to 30 Days, or publish indefinitely.
- **🔥 One Time View** — A special expiration mode where the page is permanently deleted from the database after the first visitor loads it. The viewer sees a red warning banner: *"This is a One Time View page — save what you need now."* Authors cannot "Update Live" a one-time view page — they must republish.
- **🔐 Optional Password Protection** — Authors can set a `Secret Key` during publishing. Protected pages never leak content to the network — the server completely strips the content from the response and returns only `{ isProtected: true }`. Visitors must pass a verified password check to unlock the page.

### 🛡️ 3. Author Identity & Page Management
- **Persistent Identity (No Login)** — A `writer-id` (e.g. `user-x8f9a`) is generated once and stored in `localStorage`. This acts as the author's permanent identity across sessions.
- **Author-Only Bypass** — Authors can import and edit their own password-protected pages without needing to enter the password. One-time view pages are also exempt from self-destruction when fetched by their author.
- **Published Pages Sidebar** — View all published pages with their status (Editable/View Only), expiry indicator, and live URL badge.
- **Sidebar Actions:**
  - **Click a page row** → directly imports it into the editor for editing
  - **Hover** → reveals an `↗` icon to open the live URL in a new tab
  - **3-dot menu** → opens a fixed-position compact dropdown (no clipping) with: **Pin to top**, **Rename**, **Import/Edit**, **View Live Page**, **Delete**
- **Update Live** — When a local draft is linked to a live published page, the Publish button becomes a glowing **Update Live** button to push changes instantly. This button is hidden for one-time view pages.
- **Word-Level Edit Audit** — Every update is logged server-side with a computed word diff (added vs. removed words), timestamp, and title changes.

### 🤖 4. AI-Powered Translation
- Select any text in a shared document → floating toolbar appears → click **Translate**.
- Choose from 7 languages: English, Bengali, Arabic, Hindi, Spanish, French, German.
- Two AI models: **Fast Mode** and **Pro Mode** (powered by OpenRouter).
- Provides custom instruction input and a result panel with **Copy** and **Apply** actions.

### ⚡ 5. Real-Time Live Collaboration
- Editable shared pages use **Socket.IO** for real-time sync. Multiple users editing the same page see each other's changes immediately.
- Cursor position is intelligently preserved after receiving live updates.

### 🔒 6. Extreme Security & Privacy
- **Network Tab Protection** — The frontend never exposes the backend URL. All requests are proxied through Next.js API routes (`/api/pages/...`). Viewers cannot see the server address.
- **Strict Data Masking** — Server responses only expose non-sensitive fields. Internal MongoDB IDs, author logs, and raw edit histories are never included in public responses.
- **Content Shielding** — Password-protected pages have their `content` field nullified server-side before any response is sent to unauthorized viewers.
- **One-Time Destruction** — Self-destructing pages are soft-deleted immediately after the first successful GET, before the response is even returned to the client.

---

## 🛠️ Tech Stack

### Frontend (`/blank-page`)
| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Styling | Vanilla CSS + Tailwind CSS |
| Icons | Lucide React |
| Local Storage | IndexedDB (Browser-native, v4) |
| Real-time | Socket.IO Client |
| AI | OpenRouter API (via server proxy) |

### Backend (`/blank-page-server`)
| Layer | Technology |
|---|---|
| Framework | Express.js + Node.js |
| Language | TypeScript |
| ORM | Prisma Client |
| Database | MongoDB Atlas |
| Real-time | Socket.IO |
| Security | CORS, API Secret Middleware |

---

## 📦 Installation & Setup

Both the frontend and backend must run concurrently.

### Step 1 — Backend Setup

```bash
cd blank-page-server
npm install
```

**Create `.env`:**
```env
DATABASE_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/blank-page"
PORT=5000
JWT_SECRET=your_jwt_secret
```

```bash
npx prisma generate
npx prisma db push
npm run dev
```

---

### Step 2 — Frontend Setup

```bash
cd blank-page
npm install
```

**Create `.env.local`:**
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5000
OPENROUTER_API_KEY=your_openrouter_key
MODEL_M1=openai/gpt-4o-mini
MODEL_M2=openai/gpt-4o
INTERNAL_API_SECRET=your_secure_secret_token
```

```bash
npm run dev
```

The app runs at **http://localhost:3000**

---

## 📁 Project Structure (Frontend)

```
blank-page/
├── src/
│   ├── app/
│   │   ├── (website)/
│   │   │   └── [customUrl]/                  # Shared page viewer
│   │   │       ├── page.tsx                  # SSR page shell
│   │   │       └── ClientPublishedPage.tsx   # Full interactive client
│   │   └── api/
│   │       ├── pages/                        # Proxy routes to backend
│   │       │   ├── [customUrl]/
│   │       │   │   ├── route.ts              # GET, PATCH, PUT, DELETE
│   │       │   │   └── verify/route.ts       # POST password verification
│   │       │   └── author/
│   │       │       └── fetch/[customUrl]/    # POST author bypass fetch
│   │       └── translate/                    # AI translation proxy
│   └── components/
│       └── website/
│           ├── Common/
│           │   └── Navbar.tsx                # Sidebar, publish controls, modals
│           └── PageSections/HomePage/Editor/
│               ├── PublishModal.tsx          # Publish settings (URL, expiry, password, one-time)
│               ├── FloatingToolbar.tsx
│               └── TranslationModal.tsx
```

---

## 🔐 Password Protection Flow

```
Author publishes with Secret Key
         ↓
Backend stores password in MongoDB
         ↓
Visitor loads /[customUrl]
         ↓
Backend detects password → strips content → returns { isProtected: true }
         ↓
Frontend shows "Protected Page" modal
  • Wrong password → input turns red + modal shakes
  • Correct password → POST /verify → content unlocks
         ↓
Author fetches own page → POST /author/fetch → bypasses password entirely
```

---

## 🔥 One Time View Flow

```
Author publishes with "🔥 One Time View" selected
         ↓
oneTimeView: true stored in MongoDB
         ↓
First visitor loads /[customUrl]
         ↓
Backend serves content → immediately soft-deletes (isDeleted: true)
         ↓
Visitor sees red banner: "One Time View — save what you need now"
         ↓
Any subsequent visitor → 404 Page Not Found
         ↓
Author sidebar: "Update Live" button hidden → must republish
```

---

## 👨‍💻 Author

**Rashedul Haque Rasel** — Frontend Developer & WordPress Expert

| Platform | Link |
|---|---|
| 📧 Email | [rashedulhaquerasel1@gmail.com](mailto:rashedulhaquerasel1@gmail.com) |
| 🌐 Portfolio | [rashedul-haque-rasel.vercel.app](https://rashedul-haque-rasel.vercel.app) |
| 💼 LinkedIn | [Rashedul Haque Rasel](https://www.linkedin.com/in/rashedul-haque-rasel) |
| 📘 Facebook | [Rashedul Haque Rasel](https://www.facebook.com/Rashedul.haque.Rase1) |
| 💬 WhatsApp | [+8801772582460](https://wa.me/8801772582460) |

---

## 📄 License

This project is licensed under the **MIT License**.
