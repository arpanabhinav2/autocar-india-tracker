# AutoCar India Tracker 🚗⚡

![AutoCar India Tracker Banner](https://i.imgur.com/kYZR248.png) <!-- *Placeholder for an actual screenshot* -->

**AutoCar India Tracker** is a modern, high-performance web application that serves as the ultimate automotive database. By autonomously scraping, transcribing, and utilizing AI Large Language Models (LLMs) on recent YouTube car reviews from Autocar India, it provides enthusiasts with a premium, easily filterable, and comparable database of the latest vehicles in the Indian market.

---

## ✨ Key Features

- **Autonomous Data Engine:** A Node.js backend that routinely fetches the newest car review videos from YouTube.
- **Dual-Source Extraction:** 
  - *Source A:* YouTube Data API (Video metadata, thumbnails)
  - *Source B:* `yt-dlp` + Groq Whisper AI (Audio transcription fallback to bypass YouTube's strict anti-bot measures)
- **AI-Powered Specifications:** Feeds pristine audio transcripts into **Groq Llama 3** (with Gemini fallback) to perfectly structure and extract complex automotive specifications (BHP, Torque, Range, Ground Clearance, etc.) to a `.json` format.
- **Premium Frontend:** Built with React, TypeScript, and TailwindCSS featuring a beautiful, slick, dark-themed "glassmorphism" aesthetic.
- **Comparison Matrix:** State management allows users to select up to 3 cars and compare them side-by-side on performance, efficiency, practicality, and safety.
- **Instant Filtering:** Filter the database dynamically by segment (SUV, EV, Sedan) and budget (Under 10L, 10L-20L, 20L+).

---

## 🛠 Tech Stack

**Frontend Framework:** React 18 + Vite  
**Language:** TypeScript  
**Styling:** Tailwind CSS + Lucide React (Icons)  
**Backend/Data Engine:** Node.js, Axios, `youtube-transcript`, `yt-dlp`  
**AI Integration:** Groq API (Llama 3.3 70B & Whisper Large v3), Google Gemini API  

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp/releases) (Must be present in `data-engine` directory for audio transcription)

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/autocar-india-tracker.git
cd autocar-india-tracker
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
cd data-engine
npm install
cd ..
\`\`\`

### 3. Environment Variables
To run the Data Engine, you need API keys. Create a `.env` file in the `data-engine` folder:
\`\`\`env
# Autocar India YouTube Channel ID
YOUTUBE_CHANNEL_ID=UCxPCOQ5h3y5tTq_q56Zg8jQ

# YouTube Data API v3 key
YOUTUBE_API_KEY=YOUR_YOUTUBE_KEY

# Groq API Key (Primary Llama 3 & Whisper)
GROQ_API_KEY=YOUR_GROQ_KEY

# Google Gemini API Key (Fallback)
GEMINI_API_KEY=YOUR_GEMINI_KEY
\`\`\`

### 4. Fetch the Latest Data
Run the scraping and AI-extraction script to generate `cars.json`:
\`\`\`bash
cd data-engine
node fetchCars.js
\`\`\`

### 5. Run the Frontend
\`\`\`bash
npm run dev
\`\`\`
The application will be available at `http://localhost:5173`.

---

## 🌩 Deployment

This application is configured for seamless deployment on **Vercel**. Since the heavy-lifting (the AI extraction) is done locally via the data engine to output a static `cars.json`, the frontend acts as a lightning-fast static site.

1. Install Vercel CLI: \`npm i -g vercel\`
2. Run \`vercel --prod\` in the root directory.

---

## 📜 License & Disclaimers
This project is for educational and portfolio purposes. It is not affiliated with, endorsed by, or sponsored by Autocar India or Haymarket SAC Publishing. All video content, thumbnails, and quotes belong to their respective owners.
