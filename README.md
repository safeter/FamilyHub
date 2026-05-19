# FamilyHub

PWA familiale — calendrier partagé, planification des repas, liste d'épicerie collaborative.

## Stack

- **Frontend** : React 18 + Vite + TypeScript + Tailwind CSS + Vite PWA
- **Backend** : Node.js + Express + TypeScript + Prisma ORM
- **DB** : PostgreSQL
- **Temps réel** : Socket.io
- **Auth** : JWT

## Setup local

### Prérequis

- Node.js 18+
- PostgreSQL (local ou Docker)
- npm

### 1. Base de données

```bash
# Avec Docker
docker run -d --name familyhub-db \
  -e POSTGRES_USER=familyhub \
  -e POSTGRES_PASSWORD=familyhub \
  -e POSTGRES_DB=familyhub \
  -p 5432:5432 postgres:16
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Remplir DATABASE_URL et JWT_SECRET dans .env

npx prisma migrate dev --name init
npx prisma db seed

npm run dev   # → http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # → http://localhost:5173
```

### Comptes de test

| Email | Mot de passe |
|---|---|
| moi@familyhub.app | familyhub123 |
| conjointe@familyhub.app | familyhub123 |

### Notifications push (optionnel)

```bash
npx web-push generate-vapid-keys
# Copier les clés dans backend/.env
```

---

## Déploiement

### Railway (backend + DB)

1. Créer un projet Railway
2. Ajouter un service **PostgreSQL**
3. Ajouter un service **Node** depuis le dossier `backend/`
4. Variables d'environnement :
   ```
   DATABASE_URL=<fourni par Railway>
   JWT_SECRET=<secret 32+ chars>
   FRONTEND_URL=<url Vercel>
   PORT=3001
   VAPID_PUBLIC_KEY=<optionnel>
   VAPID_PRIVATE_KEY=<optionnel>
   ```
5. Commande de démarrage : `npm run build && npx prisma migrate deploy && npm run db:seed && npm start`

### Vercel (frontend)

1. Importer le repo, sélectionner le dossier `frontend/`
2. Build command : `npm run build`
3. Output directory : `dist`
4. Variable d'environnement :
   ```
   VITE_API_URL=<url Railway backend>
   ```
5. Ajouter dans `vite.config.ts` si besoin : `server.proxy` → pointer vers Railway en prod

---

## Architecture

```
familyhub/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Modèles DB
│   │   └── seed.ts         # Données initiales
│   └── src/
│       ├── controllers/    # Logique métier
│       ├── routes/         # Endpoints REST
│       ├── middleware/      # Auth JWT
│       ├── socket/         # Événements temps réel
│       └── cron/           # Notification matinale 7h
└── frontend/
    └── src/
        ├── pages/          # Dashboard, Calendar, MealPlan, GroceryList, Recipes
        ├── components/     # BottomNav, DayCard, GroceryItem, CriticalDayBadge
        ├── hooks/          # useSocket, useOfflineCache
        ├── store/          # Zustand — état global
        └── api/            # Client HTTP
```
