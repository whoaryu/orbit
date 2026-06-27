# 🌌 Orbit

Orbit is a state-of-the-art WebRTC video chat application featuring real-time matchmaking based on custom interest tags and skills. By pairing users instantly through a WebSocket signaling server and matching algorithm, Orbit brings a seamless, interactive, and beautiful conversational experience directly to your browser.

---

## ✨ Features

- **Real-Time Matchmaking**: Queue up with specific tags (interests, skills, topics) and get matched with relevant peers instantly.
- **High-Quality WebRTC Video/Audio**: Low-latency direct peer-to-peer communication for clear and fluid calls.
- **In-Call Text Chat**: Exchange messages, links, and code snippets in real-time alongside your video call.
- **Skip & Re-queue**: Instantly skip the current call and return to the queue to find another partner.
- **Dynamic & Responsive UI**: Premium look and feel crafted with Tailwind CSS v4, smooth animations with Framer Motion, and micro-interactions powered by GSAP.
- **Auto-reconnection & Queue Management**: Robust backend handling of user disconnections, socket lifecycles, and matchmaking queues.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP (GreenSock)](https://gsap.com/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) with [TypeScript](https://www.typescriptlang.org/) and `tsx` execution
- **Server Framework**: [Express](https://expressjs.com/)
- **WebSockets**: [ws](https://github.com/websockets/ws) for real-time WebRTC signaling and messaging
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)

---

## 📁 Directory Structure

```text
orbit/
├── backend/            # Express & WebSockets signaling server
│   ├── config/         # Database and server configuration
│   ├── controllers/    # API controllers
│   ├── models/         # Database models
│   ├── routes/         # Express API routes (e.g. matchmaking info)
│   ├── singletons/     # Singletons (matchmaking queue logic)
│   ├── server.ts       # Server entry point (HTTP + WebSocket)
│   └── package.json    # Backend dependencies & scripts
│
├── frontend/           # Vite + React client application
│   ├── public/         # Static assets
│   ├── src/            # React components, pages, context, and styles
│   └── package.json    # Frontend dependencies & scripts
│
├── package.json        # Root workspace package.json (concurrent script runner)
└── README.md           # Project documentation
```

---

## 🚀 Getting Started

Follow these steps to set up and run Orbit locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A running [MongoDB](https://www.mongodb.com/) database

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd orbit
   ```

2. **Configure Environment Variables**
   Create a `.env` file in both `backend/` and `frontend/` directories. Refer to [.env.example](.env.example) in the root directory.

   - **For backend (`./backend/.env`)**:
     ```env
     MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/orbitDB?retryWrites=true&w=majority
     PORT=3001
     NODE_ENV=development
     ```
   - **For frontend (`./frontend/.env`)**:
     ```env
     VITE_WS_URL=ws://localhost:3001
     ```

3. **Install Dependencies**
   Run the installation command in the root folder to install dependencies for both frontend and backend projects:
   ```bash
   npm run install:all
   ```

4. **Run the Application**
   Start both the backend signaling server and the React dev server simultaneously:
   ```bash
   npm run dev
   ```
   - The frontend app will be running at `http://localhost:5173`.
   - The backend server will be listening at `http://localhost:3001`.

---

## 📡 API & Signaling Details

- **Health Check**: `GET http://localhost:3001/health`
- **Queue Status**: `GET http://localhost:3001/queue-status`
- **WebSocket Protocol**:
  - `join-queue`: Sent by the client to register interest tags/skills and enter matchmaking.
  - `match-found`: Sent by the server when two compatible clients are paired.
  - `offer` / `answer` / `ice-candidate`: WebRTC SDP negotiation messages.
  - `chat-message`: Live chat message exchange.
  - `skip-call`: Sent to instantly end a session and search for a new partner.
  - `partner-disconnected` / `partner-skipped`: Event notifications for state changes.
