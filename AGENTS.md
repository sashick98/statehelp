# Project: Tamil Nadu State Helpline and Citizen Grievance Portal

## Full-Stack Architecture Scope
- **AI Assistant Role**: Senior Full-Stack MERN Developer, UI/UX Designer, and Software Architect.
- **Goal**: Build a modern, accessible, responsive full-stack prototype for the **Tamil Nadu State Helpline and Citizen Grievance Management Portal**.
- **User Role**: Learning Developer studying React, Express, MongoDB, REST APIs, and system architecture.

---

## Technical Standards & Folder Structure

```
statehelp/
├── client/                     # React frontend (Vite, Bootstrap 5, Lucide Icons, Router, i18n)
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       └── utils/
└── server/                     # Express.js REST API with MongoDB & Mongoose
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── services/
    ├── utils/
    └── validators/
```

---

## Pedagogical & Code Quality Standards
- Clear, educational code comments explaining data flow (React form -> Axios -> Express route -> Validator -> Controller -> Mongoose Model -> Database).
- Strict separation of concerns (no business logic in route definitions).
- Real MongoDB connection with local fallback support.
- Role-based authorization (Citizen, Officer, Admin) and object-level complaint access checks.
- Dual-language support (English & Tamil: தமிழ்).
- Clean government portal visual styling (navy blue `#0b2545`, clean white `#ffffff`, subtle green accent `#137547`).
