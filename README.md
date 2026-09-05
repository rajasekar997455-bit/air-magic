# ✨ AIR MAGIC

> **Real-Time Hand Tracking • Air Writing • GPU Visual Effects & Spatial Computing**

AIR MAGIC is an interactive, browser-based spatial computing application built with **Three.js**, **WebAssembly**, and **MediaPipe**. It turns your webcam into a magical gesture-controlled canvas where you can write in mid-air, cast elemental spells, spawn 3D creatures, and open portals into alternate dimensions.

---

## 🌟 Features

- ✍️ **Air Writing & Drawing**: Write glowing neon words and sketch in the air with real-time particle ribbons and fingertip tracking.
- 🌀 **Multiverse Portals**: Open 8 unique dimension portals (Galaxy, Cyber, Nature, Golden, Ice, Void, Lava, and Neon) with custom GPU shaders and audio feedback.
- 🦋 **Interactive 3D Swarms**: Summon holographic butterflies and procedural flowers that react to hand positions and gestures.
- ⚡ **Elemental Spells**: Lightning arcs, burst explosions, and Jarvis-style holographic HUD overlays.
- 🕹️ **Demo Mode**: Test and preview all visual effects and portals without needing a webcam.
- ⚡ **Ultra-Low Latency**: High-performance rendering pipeline using custom GLSL shaders, point cloud geometry, and WebGL optimization.

---

## 🖐️ Gesture Guide

| Gesture | Action | Description |
| :--- | :--- | :--- |
| ☝️ **Point Index** | **Air Draw** | Draw glowing particles and ribbons in 3D air |
| 🤏 **Pinch** | **Open Portal** | Hold pinch for 1.5s to tear open a dimensional portal |
| 🖐️ **Open Palm** | **Move & Control** | Orbit effects, disperse particles, and manipulate objects |
| 🤟 **3 Fingers** | **Close Portal** | Dismiss any active portal effect |
| 🤞 **Crossed Hands** | **Perch Creatures** | Summon butterflies to land directly on your fingertips |
| ✌️ **Two Fingers** | **Smile Aura** | Cast an ethereal particle smile aura |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **3D Graphics & Shaders**: Three.js, Custom GLSL Shaders, WebGL
- **Computer Vision**: Google MediaPipe Tasks Vision (`hand_landmarker.task`), WebAssembly (WASM)
- **Styling**: Tailwind CSS, Lucide Icons

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- A modern web browser with WebGL & Webcam support

### Installation

```bash
# Clone repository
git clone https://github.com/rajasekar997455-bit/air-magic.git

# Navigate into project directory
cd air-magic

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📦 Production Build & Deployment

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

Deployable with 1-click on **Vercel**, **Netlify**, or **Cloudflare Pages**.

---

## 📄 License

MIT License &copy; 2026 Rajasekar
