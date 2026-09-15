# Tracking system

Run these commands from this root folder to install dependencies:

```sh
npm install
npm run setup
```

Configure `tracking-system-backend-main/.env` using its `.env.example`, including a valid `MONGODB_CLOUD_URI` and `JWT_SECRET`. Set the frontend `.env` to `VITE_API_URL=http://localhost:5050` for local development.

Start both frontend and backend in one terminal:

```sh
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5050

Press Ctrl+C to stop both. Backend uses nodemon and frontend uses Vite for automatic reloads. MongoDB must be configured for backend requests to work.

If PowerShell blocks `npm.ps1`, use `npm.cmd run dev` or run the command in Command Prompt.
