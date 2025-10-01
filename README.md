# 🗳️ Voting Platform Backend

This is the backend for the **Voting Platform**, built with **Node.js**, **Express**, and **MongoDB**.  
It provides REST APIs for **user authentication**, **role-based access control (Admin vs Voter)**, and **voting management**.

---

## 🚀 Features
- 🔑 **Authentication & Authorization**
  - JWT-based login & signup
  - Role-based access control (Admin, Voter)
- 👤 **User Management**
  - Voter registration & login
  - Admin-only access to create/manage elections
- 🗳️ **Voting System**
  - Admins can create elections and add candidates
  - Voters can cast their votes (one vote per election)
- 📊 **Results**
  - Real-time vote counts per candidate
  - Admin-only access to final results

---

## 🛠️ Tech Stack
- **Node.js** + **Express.js** – backend framework
- **MongoDB Atlas** – cloud database
- **Mongoose** – ODM for MongoDB
- **JWT (JSON Web Tokens)** – authentication
- **Bcrypt.js** – password hashing
- **CORS** – secure API access

---

## 📂 Project Structure
voting-platform-backend/
├── config/ # Database connection
├── controllers/ # Business logic
├── middlewares/ # Authentication & role checks
├── models/ # Mongoose schemas
├── routes/ # API routes
├── server.js # Entry point
└── package.json



---

## ⚡ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/voting-platform-backend.git
cd voting-platform-backend
