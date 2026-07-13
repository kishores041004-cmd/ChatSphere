# ChatSphere - Standalone Frontend 🚀

This folder contains the complete, standalone frontend code for **ChatSphere** (HTML, CSS, and JS). You can host this folder directly on **Render** as a **Static Site** for free.

---

## 🛠️ Configuration (Connecting to your Deployed Backend)

Before deploying the frontend, you must update it to point to your deployed Spring Boot backend URL:

1. Open the file [js/main.js](js/main.js).
2. Locate the `BACKEND_URL` definition at the top of the file (around line 5):
   ```javascript
   const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
       ? 'http://localhost:8080'
       : 'https://chatsphere-backend-xyz.onrender.com'; // <-- CHANGE THIS URL!
   ```
3. Change `'https://chatsphere-backend-xyz.onrender.com'` to the HTTPS URL of your deployed Spring Boot backend on Render (e.g., `https://your-backend-service.onrender.com`).
4. Save the file.

---

## 📦 How to Deploy on Render (Static Site)

1. Push your project files (including the `frontend` folder) to a GitHub or GitLab repository.
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Static Site**.
4. Connect your GitHub/GitLab repository.
5. In the creation form, configure the following settings:
   - **Name**: `chatsphere-chat` (or any name you prefer)
   - **Branch**: `master` (or your active branch)
   - **Root Directory**: `frontend`
   - **Build Command**: *Leave empty* (no build command is needed)
   - **Publish Directory**: `.` (which means the root of the `frontend` folder)
6. Click **Create Static Site**. Render will deploy your frontend in seconds!

---

## ⚙️ Backend Requirements (Already Implemented)

Because your frontend and backend run on different domains, we have already updated the Spring Boot backend to support this setup:
1. **CORS Configuration**: The backend has been configured to accept cross-origin requests from any origin dynamically while allowing session credentials (`allowCredentials(true)`).
2. **Session Cookies**: In production, the backend is configured to use `SameSite=None` and `Secure=true` for session cookies (defined in `application-prod.properties`) so that your login state is preserved across domains.

> **Note**: For local development, simply run your Spring Boot app on port `8080`, and double-click `index.html` (or serve it locally). The frontend will automatically detect `localhost` and connect to the local backend.
