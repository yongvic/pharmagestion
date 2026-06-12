# PharmaGestion Pro

Application desktop de gestion de pharmacie — stock, ventes, assurances et équipe. Fonctionne **100 % en local**, sans connexion internet.

![Version](https://img.shields.io/badge/version-2.0.4-blue)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6)
![Stack](https://img.shields.io/badge/stack-Electron%20%2B%20React%20%2B%20Django-61DAFB)

---

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Médicaments** | Catalogue, recherche, code-barres, alertes stock, **import Excel/CSV** |
| **Catégories** | Classification des produits (CRUD admin, compteur par catégorie) |
| **Stock** | Entrées, sorties, ajustements, historique |
| **POS** | Vente directe ou préparation de commande |
| **Caisse** | Validation et encaissement des commandes en attente |
| **Assurances** | Taux de couverture (INAM, NSIA, etc.) |
| **Utilisateurs** | Rôles Admin, Pharmacien, Caissier |
| **Notifications** | Alertes stock, commandes, ventes |
| **Paramètres** | Identité pharmacie, tickets, TVA |

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| **Desktop** | Electron 35, electron-builder |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Zustand, React Query |
| **Backend** | Django 6, Django REST Framework, SimpleJWT |
| **Base de données** | SQLite |
| **Auth** | JWT (access + refresh token) |

---

## Prérequis

- **Windows 10/11** (64 bits)
- **Node.js** 20+
- **Python** 3.12+
- **Git** (optionnel)

---

## Installation (développement)

### 1. Cloner le projet

```bash
git clone https://github.com/yongvic/pharmagestion.git
cd pharmagestion
```

### 2. Installer les dépendances

```powershell
# Installation automatique (recommandé)
npm run setup

# Ou manuellement :
npm install
cd backend
py -3.12 -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python manage.py migrate
.\venv\Scripts\python seed_data.py
cd ..
```

### 3. Configuration (optionnel)

Copiez `backend/.env.example` vers `backend/.env` et adaptez :

```env
DJANGO_SECRET_KEY=votre-cle-secrete-unique
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
PHARMAGESTION_ADMIN_PASSWORD=admin
```

---

## Lancer l'application

### Mode développement (hot reload)

```bash
npm run dev
```

Démarre automatiquement :
- Backend Django → `http://127.0.0.1:8765`
- Frontend Vite → `http://localhost:5173`
- Fenêtre Electron

### Connexion par défaut

| Champ | Valeur |
|-------|--------|
| Utilisateur | `admin` |
| Mot de passe | `admin` |

> Changez le mot de passe admin dès la première connexion.

---

## Build installateur Windows

```bash
npm run dist:win
```

Génère : `release/PharmaGestion Setup 2.0.4.exe` (~110 Mo)

L'installateur inclut le backend compilé (`backend.exe`) — **aucune dépendance** requise sur le PC client.

### Distribuer au client

Envoyez uniquement le fichier `PharmaGestion Setup X.X.X.exe`.

Si Windows affiche un avertissement : **Plus d'infos → Exécuter quand même**.

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run setup` | Installe Python venv + dépendances + migrations |
| `npm run dev` | Lance backend + frontend + Electron |
| `npm run build` | Compile backend.exe + frontend |
| `npm run dist:win` | Crée l'installateur Windows |
| `npm run build:backend` | Compile uniquement backend.exe (PyInstaller) |
| `npm run build:frontend` | Compile uniquement le frontend (Vite) |

---

## Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| **ADMIN** | Accès complet : utilisateurs, paramètres, assurances, dashboard |
| **PHARMACIST** | Médicaments, stock, préparation de commandes (POS) |
| **CASHIER** | POS vente directe, caisse, consultation catalogue |

---

## Architecture

```
pharmagestion/
├── electron/              # Process principal Electron
│   ├── main.cjs           # Fenêtre + cycle de vie
│   ├── preload.cjs        # API sécurisée renderer
│   └── backend-manager.cjs # Démarrage backend.exe
├── backend/               # API Django REST
│   ├── config/            # Settings, URLs, health check
│   ├── users/             # Auth JWT + rôles
│   ├── medications/       # Catalogue produits
│   ├── inventory/         # Mouvements de stock
│   ├── sales/             # Ventes + caisse
│   ├── insurance/         # Assurances
│   ├── notifications/     # Alertes temps réel
│   ├── app_settings/      # Paramètres pharmacie
│   ├── requirements.txt
│   └── run_backend.py     # Point d'entrée serveur
├── frontend/              # Interface React
│   └── src/
│       ├── pages/         # Écrans de l'app
│       ├── components/    # UI réutilisable
│       ├── api/           # Client HTTP (axios)
│       └── store/         # État global (Zustand)
├── scripts/
│   └── setup-backend.ps1  # Script d'installation Windows
├── release/               # Installateurs générés (gitignored)
└── package.json           # Scripts Electron & build
```

---

## API

Base URL : `http://127.0.0.1:8765/api/`

| Endpoint | Description |
|----------|-------------|
| `POST /api/token/` | Connexion (JWT) |
| `POST /api/token/refresh/` | Renouveler le token |
| `GET /api/health/` | Santé du serveur |
| `GET /api/users/me/` | Profil connecté |
| `GET/POST /api/medications/` | Médicaments |
| `GET/POST /api/sales/` | Ventes |
| `GET /api/sales/stats/` | Statistiques dashboard |

Authentification : header `Authorization: Bearer <token>`

---

## Données en production

Les données sont stockées localement :

```
%APPDATA%\PharmaGestion\data\
├── db.sqlite3      # Base de données
├── media/          # Images uploadées
└── staticfiles/    # Fichiers statiques Django
```

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `ENOENT backend.exe` | Réinstallez avec la dernière version de l'installateur |
| Serveur injoignable | Vérifiez que le port 8765 est libre |
| Antivirus bloque l'app | Ajoutez une exception pour `PharmaGestion` |
| `venv` corrompu | Relancez `npm run setup` |
| Port 5173 occupé | Fermez les autres instances de `npm run dev` |

---

## Licence

Projet propriétaire — usage commercial selon accord avec l'éditeur.

---

## Auteur

Développé pour la gestion de pharmacies au Togo (FCFA, timezone Africa/Lomé).
