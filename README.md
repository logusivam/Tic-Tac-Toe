# Neon Tic-Tac-Toe Multiplayer 🎮

A real-time, ultra-fast, cross-platform multiplayer Tic-Tac-Toe web application. Built with low-latency rendering and professional decoupled architecture ensuring a premium gaming experience mapped perfectly to cloud statistics.

**Designed and Licensed by Loganathan**.

![Gameplay Screenshot](https://github.com/user-attachments/assets/9f45ba67-cfc6-46ca-a100-5b0e64215d6e) *(Note: Add your gameplay screenshots into the assets directory)*

---

## ⚡ Core Features & Concepts

### 🏎️ Low Latency WebSockets
Instead of relying on standard HTTP polling, the entire gameplay engine leverages **Socket.io**. Connections are continuously held open leveraging raw RAM matrices. Moves instantly translate to the backend where validation checks return in miliseconds avoiding slow payload serialization guaranteeing esports-level responsiveness. 

### ☁️ Persistent Cloud Profiles 
Every player registers a local caching profile referencing their name and age. This natively injects into **MongoDB MongoDB Atlas**. While playing, victorious matches automatically sync and calculate `Victories` on your global profile ensuring your stats persist across all devices.

### 🛡️ Decoupled Secure Architecture
The Frontend operates completely independently from the Backend. 
- **The API Node Server** uses an internal locking array, strictly blocking arbitrary network requests leveraging `.env` bounded CORS restrictions. 
- **The React-Like Vanilla Frontend** pulls dependencies from decentralized CDNs (like CloudFlare) keeping the payload incredibly lightweight, fetching data explicitly through configurable API targets.

---

## 👥 Advanced Matchmaking Systems

### 1. Private Hosting (2-Player Strict Cap)
Creating a match instantly issues a highly-secure **4-Character Alphanumeric Code**. 
- **Player Caps**: The Node server natively intercepts connections. If a 3rd person attempts to enter a full lobby, the WebSocket immediately issues a rejection boundary bouncing them natively back into their frontend throwing a local `Room Full` Toast Notification without risking loading conflicts.
- **Dynamic Leaving**: If a user cancels the match, the room is completely wiped from active memory to prevent "ghost" matches scaling server RAM costs.

### 2. Random Lobby Broadcasting 
When clicking `Play Random`, the engine bypasses traditional queuing!
- It shoots a **Toast Notification** directly into the screens of every other active User sitting on the main URL. 
- If someone clicks Accept, the engine routes their payload silently mapping the origin room! 
- **Spam Protections**: The server natively locks the broadcast button firing a 20-second active cooldown counting down sequentially directly on the screen!

### 3. Manual 2-Player (Local Co-op)
Share a singular device without sacrificing stats! 
- The system ingeniously chains 2 separate Database registrations querying both profiles independently. 
- It then builds a localized session explicitly ignoring strict IP-lock checks allowing a single mouse to click for both Player X and Player O continuously, ensuring both sides retain exact stat-tracking parameters up into the cloud!

---

## 💻 Tech Stack

**Frontend UI:**
- HTML5 / Vanilla JavaScript (ES Module Formats)
- Vanilla CSS3 (Neon / Dark-mode / Glassmorphism)
- Google Fonts (Inter/Outfit)
- Decentralized CDN Socket Instances

**Backend API:**
- Node.js & Express.js
- Socket.IO (Real-time TCP logic)
- CORS (Domain Security Modules)
- Mongoose / MongoDB Atlas (Cloud Relational Data)

---

## ⚙️ Installation & Setup (Cross-Platform)

Given the highly professional detached environment, you must spin up both elements securely.

### Step 1: Configure the Environment
Inside your terminal navigate to the project directory and install the necessary frameworks:
```bash
npm install express socket.io cors mongoose dotenv
```
Create a `.env` file in the root directory mapping your cloud credentials:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=3000
FRONTEND_URL=http://127.0.0.1:5500
```
> *Ensure your FRONTEND_URL accurately targets whatever local address you are hosting the UI from.*

### Step 2: Initialize the Backend Server
```bash
node server.js
```
*Your CLI should return `Server running on http://localhost:3000` & `MongoDB Connected`.*

### Step 3: Initialize the Frontend Render
Since this is completely detached, **do not** view it through the Node string.
1. Open the project inside VS Code.
2. Ensure you have the `Live Server` plugin installed.
3. Right-click the `public/index.html` file and select **Open with Live Server**. 
4. The game will automatically render and dynamically bind to your actively running Node instance!

---

## ⚖️ License
This project architecture, layout, design, and code repository are strictly the intellectual property of **Loganathan**. All rights reserved. Do not distribute without explicit authorization.
