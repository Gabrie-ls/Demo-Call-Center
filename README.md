# 📞 CallCenter Pro — Enterprise Platform

> Sistema integral de gestión para Call Centers. SaaS-ready, modular, seguro.

---

## 🏗️ Arquitectura

```
callcenter-platform/
├── backend/                 # Node.js + Express API
│   └── src/
│       ├── app.js           # Entry point
│       ├── config/          # DB connection
│       ├── controllers/     # Lógica de negocio
│       ├── middleware/       # Auth JWT, roles
│       └── routes/          # Endpoints REST
├── frontend/                # HTML + CSS + JS puro
│   ├── assets/
│   │   ├── css/main.css     # Design System completo
│   │   └── js/              # API client, sidebar
│   └── pages/               # Login, dashboard, CRM, etc.
├── sql/
│   ├── schema.sql           # DDL tablas PostgreSQL
│   └── seed.sql             # Datos de prueba
├── docker/
│   └── nginx.conf           # Reverse proxy
└── docker-compose.yml       # Stack completo
```

---

## ⚡ Inicio Rápido con Docker (Recomendado)

### Requisitos
- Docker Desktop instalado
- Puertos 3000, 5432 y 8080 libres

### Pasos

```bash
# 1. Clona o descarga el proyecto
cd callcenter-platform

# 2. Levanta todo el stack
docker compose up --build -d

# 3. Espera ~15 segundos para que la DB esté lista

# 4. Abre el navegador
open http://localhost:8080
```

> ✅ El `docker-compose.yml` crea automáticamente la base de datos, carga el schema y el seed.

---

## 🛠️ Inicio Manual (Sin Docker)

### Requisitos
- Node.js v18+
- PostgreSQL 14+
- Un servidor HTTP para el frontend (live-server, http-server, etc.)

### 1. Configurar Base de Datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE callcenter_db;"

# Ejecutar el schema
psql -U postgres -d callcenter_db -f sql/schema.sql

# Cargar datos de prueba
psql -U postgres -d callcenter_db -f sql/seed.sql
```

### 2. Configurar Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de DB

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev     # Desarrollo (nodemon)
# o
npm start       # Producción
```

El API estará disponible en: `http://localhost:3000`

### 3. Servir Frontend

```bash
# Opción A: npx http-server (recomendado)
cd frontend
npx http-server -p 8080

# Opción B: npx live-server
cd frontend
npx live-server --port=8080

# Opción C: Python
cd frontend
python3 -m http.server 8080
```

Abre: `http://localhost:8080`

> ⚠️ **Importante:** El frontend necesita servirse desde un servidor HTTP (no abrir el .html directamente) para que las rutas funcionen correctamente.

---

## 🔐 Credenciales de Demo

| Rol           | Email                     | Contraseña |
|---------------|---------------------------|------------|
| Administrador | admin@callcenter.com      | password   |
| Supervisor    | laura@callcenter.com      | password   |
| Supervisor    | miguel@callcenter.com     | password   |
| Agente        | ana@callcenter.com        | password   |
| Agente        | pedro@callcenter.com      | password   |
| Agente        | sofia@callcenter.com      | password   |

---

## 📋 Endpoints de la API

### Autenticación
| Método | Ruta              | Acceso   |
|--------|-------------------|----------|
| POST   | /api/auth/login   | Público  |
| GET    | /api/auth/me      | JWT      |

### Usuarios
| Método | Ruta                         | Roles           |
|--------|------------------------------|-----------------|
| GET    | /api/users                   | admin,supervisor|
| POST   | /api/users                   | admin           |
| PUT    | /api/users/:id               | admin           |
| PATCH  | /api/users/:id/toggle-status | admin           |
| DELETE | /api/users/:id               | admin           |
| GET    | /api/users/agents            | all             |

### Clientes
| Método | Ruta                      | Roles           |
|--------|---------------------------|-----------------|
| GET    | /api/clients              | all             |
| POST   | /api/clients              | all             |
| PUT    | /api/clients/:id          | all             |
| DELETE | /api/clients/:id          | admin,supervisor|
| GET    | /api/clients/template     | all             |
| POST   | /api/clients/import/excel | admin,supervisor|

### Llamadas
| Método | Ruta           | Roles           |
|--------|----------------|-----------------|
| GET    | /api/calls     | all (filtrado)  |
| POST   | /api/calls     | all             |
| PUT    | /api/calls/:id | all             |
| DELETE | /api/calls/:id | admin,supervisor|

### Dashboard
| Método | Ruta                     | Roles |
|--------|--------------------------|-------|
| GET    | /api/dashboard/metrics   | all   |

### Reportes
| Método | Ruta                           | Roles           |
|--------|--------------------------------|-----------------|
| GET    | /api/reports/calls/excel       | admin,supervisor|
| GET    | /api/reports/calls/pdf         | admin,supervisor|
| GET    | /api/reports/productivity/excel| admin,supervisor|
| GET    | /api/reports/productivity/pdf  | admin,supervisor|

---

## 🔒 Seguridad

- **JWT** con expiración configurable (default 8h)
- **bcrypt** para hash de contraseñas (10 rounds)
- **Autorización por roles** en todos los endpoints sensibles
- **Agentes** solo ven sus propias llamadas
- **Supervisores** ven datos de sus agentes asignados
- **Variables de entorno** para configuración sensible
- **CORS** configurable por dominio

---

## 🚀 Despliegue en la Nube

### Railway / Render / Fly.io (Backend)
1. Conecta el repositorio
2. Configura las variables de entorno del `.env.example`
3. Deploy command: `npm start`
4. Provision una base de datos PostgreSQL

### Vercel / Netlify (Frontend)
1. Sube la carpeta `frontend/`
2. Cambia `API_BASE` en `assets/js/app.js` a la URL del backend en producción

### Variables de Entorno en Producción
```env
NODE_ENV=production
JWT_SECRET=<secreto-seguro-largo-256bits>
DB_PASSWORD=<password-segura>
CORS_ORIGIN=https://tudominio.com
```

---

## 📦 Stack Tecnológico

**Backend**
- Node.js 20 + Express 4
- PostgreSQL 16
- JWT (jsonwebtoken)
- bcrypt (seguridad de contraseñas)
- xlsx (importación/exportación Excel)
- pdfkit (generación de PDFs)
- multer (upload de archivos)

**Frontend**
- HTML5 + CSS3 + JavaScript ES6+ puro
- Chart.js (gráficos del dashboard)
- Fetch API (cliente HTTP)
- Design System propio (dark theme enterprise)

**Infraestructura**
- Docker + Docker Compose
- Nginx (reverse proxy + static files)
- PostgreSQL (con healthchecks)

---

## 📈 Próximas Funcionalidades (Roadmap)

- [ ] WebSockets para métricas en tiempo real
- [ ] Notificaciones push
- [ ] Integración con telefonía (Twilio / Asterisk)
- [ ] Multi-tenant (múltiples empresas)
- [ ] App móvil (PWA)
- [ ] Integración con WhatsApp Business API

---

*CallCenter Pro v1.0 — Construido como base real de un SaaS empresarial*
