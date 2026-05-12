# 📝 Blank Page — Distraction-Free Writing Interface

**Blank Page** is a premium, minimalist, multi-document writing interface designed for authors who seek a focused, distraction-free environment. Built with a local-first architecture, it ensures your data stays securely on your browser at all times.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://blank-page-v1.vercel.app/)
![Premium UI](https://img.shields.io/badge/UI-Premium-blueviolet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwind-css)

---

## 🔗 Live Link
Experience the app here: **[https://blank-page-v1.vercel.app/](https://blank-page-v1.vercel.app/)**

---

## ✨ Key Features

### 🖋️ Distraction-Free Editor
- **Minimalist Design:** A clean, uncluttered writing space with no unnecessary menus or buttons.
- **Dynamic Auto-height:** The editor automatically adjusts its height based on your content for a seamless flow.
- **Typography Styles:** Choose from three professional font styles: Draft Sans, Classic Serif, and Modern Mono.

### 📂 Multi-Document Management
- **IndexedDB Powered:** All your drafts are stored in your browser's robust IndexedDB, ensuring no data loss even after a refresh.
- **Persistent Sidebar:** Easily pin, rename, and delete your drafts with a persistent navigation menu.
- **Real-time Sync:** Uses the `BroadcastChannel` API to synchronize data instantly across different tabs or components.

### 🎨 Premium Theme System
- **8 High-End Themes:** Light, Dark, Sepia, Midnight, Forest, Ocean, Rose, and Coffee.
- **Circular Transition:** A stunning circular expand animation effect when switching between themes.
- **OKLCH Colors:** Each theme is meticulously crafted using the modern OKLCH color space for superior visual fidelity.

### 📊 Writer's Utilities
- **Word Counter:** Monitor your progress with a real-time word count.
- **Full Screen Mode:** Stay deeply focused with a dedicated full-screen writing mode.
- **Auto-save:** Your work is automatically saved with every single word you type.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (OKLCH based)
- **Database:** IndexedDB (Client-side)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** View Transitions API & Tailwind Animate

---

## 🚀 Getting Started

Follow these steps to run the project on your local machine:

1. Clone the repository:
```bash
git clone https://github.com/RashedulHaqueRasel1/blank-page.git
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open in your browser: `http://localhost:3000`

---

## 📁 Project Structure

```text
src/
├── app/               # Next.js App Router (Globals CSS & Layouts)
├── components/        # UI Components (Navbar, Banner, Sidebar)
├── hooks/             # Custom React Hooks
└── lib/               # Database Helpers & Utilities
```

---

## 🔒 Privacy & Security

**Blank Page** prioritizes your privacy above all else. Your writings are never sent to any server; everything is stored locally on your device (IndexedDB) and remains completely under your control.

---

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ by **Rashedul Haque Rasel**
