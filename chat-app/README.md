# 📦 MERN Chat App – Deployment & DevOps Assignment

This project is a full-stack real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO. It includes support for private and public rooms, authentication, messaging, typing indicators, and real-time updates.

---

## 🌍 Live URLs

- **Frontend (Vercel):** [https://chat-app-phi-two-43.vercel.app](https://chat-app-phi-two-43.vercel.app)
- **Backend (Render):** [https://week-7-devops-deployment-assignment-s8t2.onrender.com](https://week-7-devops-deployment-assignment-s8t2.onrender.com)
- **Health Check Endpoint:** [https://week-7-devops-deployment-assignment-s8t2.onrender.com/health](https://week-7-devops-deployment-assignment-s8t2.onrender.com/health)

---

## ⚙️ Deployment Steps

### Backend Deployment (Render)
1. Created a new web service on [Render](https://render.com)
2. Connected it to GitHub repo
3. Added environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_URL`
   - `JWT_EXPIRES_IN`
4. Build command: `cd server && npm install`
5. Start command: `node server/server.js`

### Frontend Deployment (Vercel)
1. Imported repo into [Vercel](https://vercel.com)
2. Set root directory: `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Added environment variables:
   - `VITE_API_BASE_URL=https://week-7-devops-deployment-assignment-s8t2.onrender.com`
   - `SOCKET_URL=https://week-7-devops-deployment-assignment-s8t2.onrender.com`

---

## 📁 Environment Configuration

### `server/.env.example`
```env
PORT=5000
CLIENT_URL=https://chat-app-phi-two-43.vercel.app
JWT_SECRET=123456
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://mercy:<pasword>@cluster0.61m7tfc.mongodb.net/chatApp?retryWrites=true&w=majority&appName=Cluster0
```

### `client/.env.example`
```env
VITE_API_BASE_URL=https://week-7-devops-deployment-assignment-s8t2.onrender.com
SOCKET_URL=https://week-7-devops-deployment-assignment-s8t2.onrender.com
```

---

## 📊 Monitoring Strategy

### ✅ Health Route
- `/health` endpoint on backend

## ✅ Summary

| Feature                          | Status |
|----------------------------------|--------|
| Backend Deployed on Render       | ✅     |
| Frontend Deployed on Vercel      | ✅     |
| CI/CD Pipeline via GitHub Actions| ✅     |
| Live Health Checks               | ✅     |
| Environment Variables Used       | ✅     |
| Working Real-Time Chat           | ✅     |


![screenshot or chat](image.png)