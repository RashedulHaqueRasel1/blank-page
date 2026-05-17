# Blank Page - Minimalist AI-Powered Writing Editor & Publishing Platform

Blank Page is a distraction-free, minimalist writing interface designed for high-fidelity writing, seamless AI-powered translations, and instant web publishing. Built with a modern micro-services architecture, it combines an elegant Next.js frontend with a robust Express + Prisma + MongoDB backend.

![Blank Page Editor](/public/banner-preview.png)

## 🚀 Core Features & Logic Flow

The platform's architecture is divided into two deeply integrated systems: the **Next.js Frontend** and the **Express Server Backend**.

### 1. Local-First Editing (Frontend)
- **IndexedDB (v4)**: Every keystroke is instantly saved to the browser's native IndexedDB. This ensures a 100% offline-first capability and ultra-fast load times.
- **Floating Context Toolbar**: Highlights trigger a sleek, absolute-positioned toolbar for bold, italic, and AI interactions without disrupting the writing flow.
- **Glassmorphic Aesthetic**: A premium UI featuring dynamic themes (Light, Dark, Forest, Sepia), interactive carousels, and typewriter auditory feedback.

### 2. Instant Publishing Engine (Backend)
- **MongoDB Atlas + Prisma**: We bypass local MongoDB entirely. The server connects directly to MongoDB Atlas. Prisma manages the schema for the `PublishedPage` models.
- **Dynamic Page Generation**: When "Publish" is clicked, the backend creates a highly secure, unique slug (e.g. `bp-xyz123`).
- **Next.js Route Proxies**: To maintain total security, the frontend never talks to the backend directly from the client. Next.js API Routes (e.g., `/api/pages/[customUrl]/route.ts`) act as secure proxies, hiding the backend URL from the network tab.

### 3. Advanced Author Capabilities & Sync Logic
- **Persistent Author Identity**: When a user visits the app, a permanent `writer-id` (e.g., `user-x8f9a`) is generated in `localStorage`. This acts as their secure authorization key for published documents.
- **Live Syncing**: When a user publishes a local draft, the draft is tagged with a `publishedUrl`. The frontend then transforms the "Publish" button into a glowing **"Update Live"** button.
- **3-Dot Action Menu**: Authors have complete control over their published pages via a sleek 3-dot dropdown menu in the sidebar. They can **Pin**, **Rename**, **Import**, or **Delete** live pages directly from the frontend.
- **Author Audit History (Word-Level Diffing)**:
  - Every time an author updates a published page, the backend performs a real-time word-level diff calculation (Added vs Removed words).
  - This change log is securely appended to an `authorEditsLog` JSON array in MongoDB, tracking exactly *what* changed, *when* it changed, and the IP address of the editor.

### 4. Extreme Network Security & Data Masking
- **Strict Data Masking**: Viewers inspecting the browser's Network Tab cannot see sensitive backend data. The backend Prisma queries use strict `select` projections to only return non-sensitive fields (like `title`, `isEditable`, `pinned`). Internal IDs, IP logs, and revision histories are locked securely on the server.
- **Environment Isolation**: No hardcoded API keys or localhost fallback logic (`||`). Everything (OpenRouter keys, MongoDB URIs, Internal API secrets, Server URLs) is strictly pulled from the `.env` file.

---

## 🛠️ Tech Stack

### Frontend Application (`/blank-page`)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Vanilla CSS + Tailwind CSS
- **Icons**: Lucide React
- **Local DB**: IndexedDB (Browser-native)

### Backend Server (`/blank-page-server`)
- **Framework**: Express.js + Node.js
- **Database ORM**: Prisma Client
- **Database**: MongoDB Atlas
- **Security**: CORS, IP Tracking, Authorization Middleware

---

## 📦 Installation & Setup

You need to run both the Frontend and the Backend concurrently.

### 1. Backend Setup
```bash
cd blank-page-server
npm install
```
**Environment Variables (`.env`)**:
```env
# MongoDB Atlas Connection
DATABASE_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/blank-page"
PORT=5000
```
**Run Server**:
```bash
npx prisma generate
npm run dev
```

### 2. Frontend Setup
```bash
cd blank-page
npm install
```
**Environment Variables (`.env.local`)**:
```env
OPENROUTER_API_KEY=your_openrouter_key
MODEL_M1=******
MODEL_M2=********
INTERNAL_API_SECRET=your_secure_secret_token
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```
**Run Frontend**:
```bash
npm run dev
```

---

## 👨‍💻 About the Author

Hi, I'm **Rashedul Haque Rasel** — a Frontend Developer & WordPress Expert passionate about building modern, user-friendly, and scalable web applications.

### 🔗 Connect with Me
- 📧 **Email**: [rashedulhaquerasel1@gmail.com](mailto:rashedulhaquerasel1@gmail.com)
- 🌐 **Portfolio**: [rashedul-haque-rasel.vercel.app](https://rashedul-haque-rasel.vercel.app)
- 💼 **LinkedIn**: [Rashedul Haque Rasel](https://www.linkedin.com/in/rashedul-haque-rasel)
- 📘 **Facebook**: [Rashedul Haque Rasel](https://www.facebook.com/Rashedul.haque.Rase1)
- 💬 **WhatsApp**: [+8801772582460](https://wa.me/8801772582460)

### 💡 Ideas & Contributions
I love hearing new ideas! If you have any suggestions to make this editor even better, or if you'd like to contribute to the code, feel free to reach out to me. Let's build something amazing together!

## 📄 License
This project is licensed under the MIT License.
