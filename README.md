# 🏥 Patient Case-Taking Software - AI-Powered Clinical History Platform

> Smart India Hackathon 2026 | Problem Statement 26047 | Ministry of Ayush

[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.9-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Electron](https://img.shields.io/badge/Electron-28.3.3-47848F?logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Solution Architecture](#-solution-architecture)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Overview

**Patient Case-Taking Software** is an AI-powered clinical history-taking platform designed for Indian hospitals and AYUSH institutions. It solves the critical "first-mile" problem by enabling patients to record their complete medical history through natural voice conversation and guided touchscreen interaction **before** they meet the doctor.

The system uses AI to convert patient conversations into structured, physician-ready clinical summaries, digitizes old medical documents via OCR, and integrates with the ABDM/ABHA ecosystem — all while maintaining strict privacy and consent controls.

### Key Highlights

- 🗣️ **Multilingual Voice & Touch** - Patients can speak or tap in their preferred language
- 🤖 **AI-Powered History Taking** - Adaptive questioning mirrors clinical reasoning
- 🏥 **AYUSH Support** - Complete Dashavidha Pariksha assessment
- 📄 **Document Digitization** - OCR for handwritten & printed medical documents
- 🔐 **ABDM/ABHA Integration** - Mock health record interoperability
- 👤 **Face Recognition** - Secure patient identification
- 📊 **Doctor Dashboard** - Complete patient history in one view

---

## 📌 Problem Statement

### The Challenge

| Issue | Impact |
|-------|--------|
| **2-5 minute consultations** | Systematic under-elicitation of history |
| **4,000-10,000 OPD patients/day** | Overburdened healthcare system |
| **Fragmented paper records** | Manual scanning of unstructured documents |
| **AYUSH complexity** | 10+ parameters cannot be captured in OPD time |

### Our Solution

> "A purpose-built, patient-facing software platform that enables patients to independently record their medical history, digitize existing documents, and generate a structured, physician-ready clinical summary integrated with the hospital information system and ABDM ecosystem."

---

## 🏗️ Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PATIENT JOURNEY                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │  ARRIVE  │───▶│  IDENTIFY│───▶│  CONSENT │───▶│  CONVERSE│        │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘        │
│       │                │                │                │              │
│       ▼                ▼                ▼                ▼              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │   SCAN   │───▶│ SUMMARIZE│───▶│  ROUTE   │───▶│ CONSULT  │        │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Patient Kiosk│  │  Doctor App  │  │  Web Portal  │             │
│  │   (Electron) │  │  (React/TS)  │  │   (React)    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                           │                                        │
│                    ┌──────▼───────┐                                │
│                    │   Backend    │                                │
│                    │   (Express)  │                                │
│                    └──────┬───────┘                                │
│                           │                                        │
│         ┌─────────────────┼─────────────────┐                      │
│         │                 │                 │                      │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐             │
│  │   MongoDB    │  │  AI Service  │  │ Mock ABDM/   │             │
│  │   Database   │  │   (Python)   │  │ ABHA Service │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend (Patient App)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.8 | UI Framework |
| TypeScript | 5.0 | Type Safety |
| Tailwind CSS | 4.1.9 | Styling |
| Vite | 8.2.2 | Build Tool |
| React Router | 7.x | Routing |
| React Hook Form | 7.x | Form Handling |
| Zod | 4.x | Validation |
| Axios | 1.x | API Calls |
| React Query | 5.x | Data Fetching |

### Desktop App
| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 28.3.3 | Cross-platform Desktop |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| Express | 4.x | API Server |
| MongoDB | 8.x | Database |
| Mongoose | 8.x | ODM |
| JWT | - | Authentication |
| Bcrypt | - | Password Hashing |

---

## ✨ Features

### 🏥 Patient Kiosk

| Feature | Description |
|---------|-------------|
| **Face Recognition** | Secure patient identification with FaceNet embeddings |
| **ABHA Authentication** | Mock Aadhaar/ABHA verification flow |
| **Multilingual Support** | Voice & touch in Hindi, English, and regional languages |
| **General OPD History** | Complete clinical history with adaptive questioning |
| **AYUSH History** | Full Dashavidha Pariksha assessment |
| **Document Upload** | Scan & digitize old prescriptions, lab reports |
| **OCR Processing** | Extract text from handwritten & printed documents |
| **AI Summary** | Generate structured physician-ready summary |
| **Emergency Flags** | Red-flag detection & priority triage |
| **Consent Management** | ABDM-compliant consent with audio guidance |

### 👨‍⚕️ Doctor App

| Feature | Description |
|---------|-------------|
| **Dashboard** | Patient queue & appointment management |
| **Patient History** | Complete medical timeline in one view |
| **AI Summary** | Physician-ready clinical summary |
| **AYUSH View** | Detailed Ayurvedic assessment |
| **Document Viewer** | OCR-extracted information from uploaded documents |
| **Lab Reports** | Structured lab data with abnormal highlighting |
| **Prescription Management** | Digital prescription creation |
| **Consent View** | Patient consent status |
| **Profile Management** | Doctor profile & settings |

### 🔧 Backend API

| Feature | Description |
|---------|-------------|
| **Authentication** | JWT-based doctor login/registration |
| **Patient Management** | CRUD operations for patient records |
| **Visit Management** | General OPD & AYUSH visits |
| **HIS Integration** | Hospital information system records |
| **Document Processing** | OCR & medical information extraction |
| **Consent Management** | Granular consent with expiry |
| **Face Data** | Face embedding storage & verification |
| **Lab Reports** | Structured test results |
| **Prescriptions** | Digital prescription history |

---

## 📁 Project Structure

```
Ai_Clinical/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── Hospital.js
│   │   └── HIS.js
│   ├── controllers/
│   │   └── doctorController.js
│   ├── routes/
│   │   └── doctorRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── generateSecret.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── patient/                    # React + Electron Desktop App
│   ├── electron/
│   │   └── main.js
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.ts
│   │   │   └── endpoints.ts
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   └── auth/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PatientList.tsx
│   │   │   ├── PatientDetail.tsx
│   │   │   └── Profile.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── tokenManager.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   └── icon.png
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env
│
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or higher)
- [MongoDB](https://www.mongodb.com/) (v8.x or higher)
- [Git](https://git-scm.com/)

### Clone Repository

```bash
git clone https://github.com/your-username/Ai_Clinical.git
cd Ai_Clinical
```

### Backend Setup

```bash
cd backend
npm install
```

### Create .env file

```env
MONGO_URI=mongodb://localhost:27017/clinic
PORT=4000
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
NODE_ENV=development
```

### Start Backend

```bash
npm run dev
# Server runs on http://localhost:4000
```

### Frontend (Patient App) Setup

```bash
cd ../patient
npm install
```

### Create .env file

```env
VITE_API_URL=http://localhost:4000/api
```

### Start Frontend

```bash
npm start
# Opens React + Electron together!
```

---

## 🏃 Running the Application

### Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd patient
npm start
```

### Production Build

```bash
# Build React app
cd patient
npm run build

# Build Electron app
npm run electron:build
```

### Access Points

| Application | URL |
|-------------|-----|
| Backend API | http://localhost:4000 |
| React Dev Server | http://localhost:5174 |
| Electron App | Opens automatically |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctors/register` | Doctor Registration |
| POST | `/api/doctors/login` | Doctor Login |
| GET | `/api/doctors/profile` | Get Profile |
| PUT | `/api/doctors/profile` | Update Profile |
| PUT | `/api/doctors/change-password` | Change Password |
| POST | `/api/doctors/logout` | Logout |

### Patient Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | Get All Patients |
| GET | `/api/patients/:abhaId` | Get Patient by ID |
| POST | `/api/patients` | Create Patient |
| PUT | `/api/patients/:abhaId` | Update Patient |

### HIS (Hospital Information System)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/his` | Get All Records |
| GET | `/api/his/patient/:abhaId` | Get Patient Records |
| GET | `/api/his/hospital/:hospitalId` | Get Hospital Records |
| GET | `/api/his/doctor/:doctorId` | Get Doctor Records |
| POST | `/api/his` | Create Record |
| PUT | `/api/his/:id` | Update Record |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get Dashboard Stats |

---

## 👥 Team

| Role | Name | GitHub |
|------|------|--------|
| Team Lead | [Your Name] | [@yourusername](https://github.com/yourusername) |
| Backend Developer | [Name] | [@username](https://github.com/username) |
| Frontend Developer | [Name] | [@username](https://github.com/username) |
| AI/ML Engineer | [Name] | [@username](https://github.com/username) |
| UI/UX Designer | [Name] | [@username](https://github.com/username) |

---

## 📄 License

This project is developed for **Smart India Hackathon 2026** - Problem Statement 26047.

**Organization:** Ministry of Ayush  
**Department:** All India Institute of Ayurveda  
**Theme:** Smart Automation

---

## 🙏 Acknowledgments

- **Ministry of Ayush** for the problem statement
- **All India Institute of Ayurveda** for guidance
- **Smart India Hackathon** for this opportunity
- **AYUSH Digital Mission** for ABDM/ABHA framework

---

## 📞 Contact

For any queries or collaboration:

- 📧 Email: team@ayushclinical.com
- 🌐 Website: ayushclinical.com

---

## ⭐ Support

If you find this project useful, please give it a ⭐ on GitHub!