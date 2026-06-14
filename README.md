# StudySpace LM - NotebookLM Clone for Studying

A full-stack, dockerized development blueprint for a **NotebookLM Clone** designed for studying. This project is optimized for local development with fast hot-reloading / HMR enabled for both the NestJS backend and the Vite-React-Tailwind frontend.

---

## 🚀 Tech Stack & Architecture

- **Frontend:** React, TypeScript, Tailwind CSS v4, Vite (for fast compilation & HMR).
- **Backend:** Node.js, NestJS framework, Mongoose, and TypeScript.
- **Database:** MongoDB (official Docker image).
- **Orchestration:** Docker Compose with mapped volume mounts.

---

## 🛠️ Prerequisites

Before launching the project, make sure you have the following installed on your machine:
- **Docker & Docker Compose** (Docker Desktop recommended on macOS/Windows)
- **Node.js v20+** (only if you wish to run/build packages locally outside Docker)

---

## ⚙️ Port Mappings

Once running, the services will be mapped to your local machine as follows:

| Service | Container Port | Host Port | Local URL |
| :--- | :--- | :--- | :--- |
| **Frontend (React)** | `5173` | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend (NestJS)** | `3000` | `3000` | [http://localhost:3000](http://localhost:3000) (API root: `/api`) |
| **Database (MongoDB)** | `27017` | `27017` | `mongodb://localhost:27017/notebooklm` |

---

## 🏁 Step-by-Step Launch Instructions

Follow these simple commands from the root directory to spin up the ecosystem:

### 1. Build and Start the Services
Run the following command to build the Docker images and start the database, backend, and frontend containers:
```bash
docker compose up --build
```

### 2. Verify Startup
Ensure the container logs show:
- **MongoDB** is listening on port `27017`
- **NestJS** compiles successfully and connects to MongoDB (`MongooseModule` initialized)
- **Vite** binds to `0.0.0.0:5173` and starts the HMR server.

### 3. Open the Dashboard
Navigate to [http://localhost:5173](http://localhost:5173) in your browser. If the NestJS backend is offline or starting up, the frontend is built to fall back onto an **Offline Mode** with local-storage-synced mock data, ensuring you can test the UI at all times. Once the backend starts, refresh the page or click the connection refresh icon in the header to switch to live MongoDB persistence!

---

## 🔥 How Hot-Reloading / HMR Works

The system is configured with Docker volume mappings to allow instantaneous local development updates.

### Frontend Hot Module Replacement (HMR)
- **Volume Mount**: `./frontend:/app` links your local frontend folder inside the container.
- **Anonymous Volume**: `/app/node_modules` guarantees that container-installed npm packages aren't overwritten by empty or incompatible local folders.
- **Vite Config (`vite.config.ts`)**:
  - `server.host = '0.0.0.0'` ensures Vite listens on all network interfaces inside the container.
  - `server.watch.usePolling = true` forces Vite to use filesystem polling. This is **critical** for macOS/Windows hosts running Docker, where standard file system event notifications (`inotify`) fail to propagate across the virtualization layer to the Linux container.
- *Try it*: Modify any text or color in `frontend/src/App.tsx` and watch the updates reflect in your browser in milliseconds without losing your app state!

### Backend Live Reload
- **Volume Mount**: `./backend:/app` maps the backend source folder.
- **Anonymous Volume**: `/app/node_modules` keeps backend dependencies isolated.
- **NestJS CLI Watcher**:
  - The backend runs `npm run start:dev`, which initiates the Nest CLI compiler in watch mode.
  - Whenever a backend file (e.g., controllers, services, schemas) is edited, the compiler detects the change, rebuilds the TS compilation, and re-initializes the application context.
- *Try it*: Modify a response string in `backend/src/chat/chat.controller.ts` and watch the container console output restart the application automatically.

---

## 📂 Project Structure

```
.
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.module.ts            # Mongoose connections & modules config
│   │   ├── main.ts                  # Global prefix /api & CORS config
│   │   ├── sources/                 # Sources module (Mongoose Schema & REST controller)
│   │   ├── notes/                   # Sticky Notes module (Polymorphic schema & CRUD)
│   │   └── chat/                    # Mock AI Chat controller (Source citation grounded)
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.ts               # Custom Vite & HMR configurations
│   ├── src/
│   │   ├── main.tsx
│   │   ├── index.css                # Tailwind CSS v4 imports
│   │   ├── App.tsx                  # Core React 3-panel UI & API Integration
│   │   └── App.css
│   └── package.json
├── docker-compose.yml               # Service orchestrator
└── README.md                        # Documentation
```
