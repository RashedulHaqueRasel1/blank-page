# 📝 Blank Notes — Frontend (Next.js)

**Blank Notes** একটি আধুনিক, মিনিমালিস্ট এবং ডিস্ট্র্যাকশন-ফ্রি নোট-টেকিং ও পাবলিশিং ওয়েব অ্যাপ্লিকেশন। এটি Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript এবং IndexedDB দিয়ে তৈরি করা হয়েছে।

---

## 📑 বিষয়সূচি (Table of Contents)
1. [প্রজেক্ট ওভারভিউ (Overview)](#-প্রজেক্ট-ওভারভিউ-overview)
2. [প্রধান ফিচারসমূহ (Key Features)](#-প্রধান-ফিচারসমূহ-key-features)
3. [প্রজেক্ট ফোল্ডার স্ট্রাকচার (Folder Structure)](#-প্রজেক্ট-ফোল্ডার-স্ট্রাকচার-folder-structure)
4. [ডেটা ফ্লো ও কীভাবে কাজ করে (How It Works)](#-ডেটা-ফ্লো-ও-কীভাবে-কাজ-করে-how-it-works)
5. [এনভায়রনমেন্ট ভ্যারিয়েবল (Environment Variables)](#-এনভায়রনমেন্ট-ভ্যারিয়েবল-environment-variables)
6. [ইনস্টলেশন ও রান করার উপায় (Setup & Run)](#-ইনস্টলেশন-ও-রান-করার-উপায়-setup--run)

---

## 🚀 প্রজেক্ট ওভারভিউ (Overview)

এই ফ্রন্টএন্ড অ্যাপ্লিকেশনটি ইউজারকে কোন ঝামেলা ছাড়াই দ্রুত নোট লিখতে, ডাফট ব্রাউজারে সেভ করে রাখতে (IndexedDB), রিয়েল-টাইম ক্যানভাসে ছবি আঁকতে/দাগাতে, এবং চাইলে ১-ক্লিকে নোট কাস্টম URL দিয়ে অনলাইনে পাবলিশ করতে সাহায্য করে।

---

## ✨ প্রধান ফিচারসমূহ (Key Features)

- **মিনিমালিস্ট ও কাস্টমাইজেবল এডিটর**:
  - **Themes**: Light, Dark, Sepia Paper, Midnight Sky, Forest Deep, Ocean Depths, Rose Noir, Coffee House।
  - **Fonts**: Draft Sans, Classic Serif, Modern Mono।
  - **Drawing Overlay**: নোটের ওপর রিয়েল-টাইম পেন ও ইরেজার দিয়ে ড্রয়িং করার সুবিধা।
  - **Typewriter Sound**: লেখার সময় সাউন্ড ইফেক্ট অন/অফ করার সুবিধা।
  - **Floating Toolbar**: টেক্সট সিলেক্ট করলে টেক্সট ফরম্যাটিং ও অনুবাদ করার টুলবার।

- **অফলাইন-ফার্স্ট IndexedDB স্টোরেজ (`EditorDB`)**:
  - প্রতিটি নোট ব্রাউজারের IndexedDB তে সেভ হয় (অটো-সেভ)।
  - ড্রাফট পিন করা, রিনেম করা, ডিলিট করা এবং ফিল্টার/সার্চ করার সুবিধা।

- **লাইভ পাবলিশিং (Publish Modal)**:
  - কাস্টম URL (slug) দিয়ে নোট অনলাইনে পাবলিশ করা।
  - **Password Protection**: পাসওয়ার্ড সেট করে পেজ সুরক্ষিত রাখা।
  - **Editable Mode**: অন্য কেউ লিঙ্ক থেকে পেজ এডিট করতে পারবে কি না সিলেক্ট করা।
  - **One-time View & Expiration**: নির্দিষ্ট সময় পর পেজ অটো-মেয়াদোত্তীর্ণ হওয়া।

- **ক্লাউড ব্যাকআপ (Cloud Backup & Verification)**:
  - ইমেইল অ্যাড্রেসে OTP ভেরিফিকেশন কোড পাঠিয়ে IndexedDB-র সমস্ত ড্রাফট ব্যাকআপ ও রিস্টোর করা।

- **টাইপিং টেস্ট (Typing Test)**:
  - AI দিয়ে জেনারেট করা বা কাস্টম টেক্সটেটাইপিং স্পিড (WPM), একুরেসি টেস্ট করার সুবিধা।

---

## 📁 প্রজেক্ট ফোল্ডার স্ট্রাকচার (Folder Structure)

```text
blank-page/
├── public/                    # স্ট্যাটিক অ্যাসেট (ইমেজ, আইকন)
├── src/
│   ├── app/                   # Next.js App Router (Pages & API Routes)
│   │   ├── (website)/         # মেইন ওয়েব রুটসমূহ
│   │   │   ├── page.tsx       # হোমপেজ (নোট এডিটর)
│   │   │   ├── [customUrl]/   # পাবলিশড নোট দেখার ডায়নামিক রুট
│   │   │   ├── typing-test/   # টাইপিং টেস্ট পেজ
│   │   │   ├── about/         # অ্যাবাউট পেজ
│   │   │   ├── terms/         # টার্মস পেজ
│   │   │   └── updates/       # প্রোডাক্ট আপডেট পেজ
│   │   ├── api/               # Next.js Proxy API Routes (Backend API Forwarder)
│   │   │   ├── auth/          # NextAuth সেশন কনফিগারেশন
│   │   │   ├── backups/       # ব্যাকআপ API প্রক্সি
│   │   │   ├── pages/         # পাবলিশড পেজ API প্রক্সি
│   │   │   ├── subscribers/   # ইমেইল ব্যাকআপ/ওটিপি প্রক্সি
│   │   │   ├── sync/          # IP সেশন প্রক্সি
│   │   │   └── typing-test/   # টাইপিং টেস্ট প্রক্সি
│   │   ├── globals.css        # Tailwind v4 ও গ্লোবাল ডিজাইন থিম
│   │   └── layout.tsx         # মেইন রুট লেআউট
│   ├── components/
│   │   ├── ui/                # Shadcn UI রি-ইউজেবল কম্পোনেন্ট
│   │   └── website/
│   │       ├── Common/        # Navbar, Footer ইত্যাদি
│   │       └── PageSections/  # হোমপেজ, এডিটর, পাবলিশ মোডাল কম্পোনেন্ট
│   ├── lib/                   # Axios API ক্লায়েন্ট ও ইউটিলিটি
│   └── Providers/             # React Query, NextAuth ও থিম প্রোভাইডার
├── next.config.ts             # Next.js কনফিগারেশন
├── postcss.config.mjs         # Tailwind CSS v4 PostCSS প্লাগইন
└── package.json               # ডিলাইন্ডেন্সিজ ও স্ক্রিপ্টসমূহ
```

---

## 🔄 ডেটা ফ্লো ও কীভাবে কাজ করে (How It Works)

1. **লোকাল এডিটিং (Local Editing)**:
   - ইউজার ব্রাউজারে টাইপ করলে `Banner.tsx` কম্পোনেন্টটি ডেটা `EditorDB` (IndexedDB) তে `Documents` অবজেক্ট স্টোরে অটো-সেভ করে।
2. **পাবলিশিং ফ্লো (Publishing Flow)**:
   - ইউজার `PublishModal` খুললে কাস্টম URL, পাসওয়ার্ড, মেয়াদের তারিখ ইনপুট দেন।
   - এটি Next.js API প্রক্সি (`/api/pages`) হয়ে Backend Server (`http://localhost:5000/api/v1/pages/publish`) এ ডেটা পাঠায় এবং MongoDB তে সেভ হয়।
3. **পাবলিশড নোট ভিউ (`/[customUrl]`)**:
   - সার্ভার সাইড রেন্ডারিং (SSR)-এর মাধ্যমে Backend থেকে পাবলিশড নোট ফেচ করে ইউজারকে প্রদর্শন করে।
4. **সকেট রিয়েল-টাইম সিঙ্ক (Socket.IO Sync)**:
   - এডিটেবল পাবলিশড পেজে একাধিক ইউজার একসাথে টাইপ করলে `socket.io-client` এর মাধ্যমে রিয়েল-টাইম কন্টেন্ট সিঙ্ক হয়।

---

## ⚙️ এনভায়রনমেন্ট ভ্যারিয়েবল (Environment Variables)

আপনার `.env` ফাইলে নিচের ভ্যারিয়েবলগুলো থাকতে হবে:

```env
# ব্যাকএন্ড সার্ভারের URL
NEXT_PUBLIC_SERVER_URL="http://localhost:5000"
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"

# NextAuth কনফিগারেশন
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="blank_page_nextauth_secret_key_2026"
```

---

## 🛠️ ইনস্টলেশন ও রান করার উপায় (Setup & Run)

```bash
# ১. ডিপেন্ডেন্সি ইনস্টল করুন
pnpm install

# ২. ডেভেলপমেন্ট সার্ভার চালু করুন (Port 3000)
pnpm dev

# ৩. প্রোডাকশন বিল্ড তৈরি করতে
pnpm build

# ৪. প্রোডাকশন সার্ভার রান করতে
pnpm start
```
