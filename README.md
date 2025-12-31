# NanoBanana Ad Generator 🍌

Aplicación SaaS para generar anuncios personalizados usando IA (Google Gemini) a través de n8n.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Base de Datos
1. Accede a tu **Adminer** en `https://adminer.tu-dominio.com`
2. Copia el contenido de `database/init.sql` y ejecútalo en la pestaña "SQL command"

### 3. Configurar variables de entorno
Copia `env.template` a `.env` y rellena los valores:

```bash
cp env.template .env
```

Variables requeridas:
- `DATABASE_URL` - URL de conexión a PostgreSQL (formato: `postgresql://user:pass@host:5432/db`)
- `AUTH_SECRET` - Generar con `npx auth secret`
- `AUTH_URL` - URL de tu app (ej: `http://localhost:3000` o dominio pro)
- `N8N_WEBHOOK_URL` - URL del webhook de n8n

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
app/
├── app/                  # App Router (Pages & API)
├── components/           # Componentes UI
├── lib/
│   ├── auth.ts           # Configuración NextAuth
│   ├── prisma.ts         # Cliente Prisma + Adapter
├── database/
│   └── init.sql          # Script SQL para Adminer
├── prisma/
│   └── schema.prisma     # Schema Prisma
└── types/                # TypeScript Types
```

## 🔧 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js v5 (Credentials)
- **IA**: Google Gemini (vía n8n)

## 🚢 Deploy

1. Construir el proyecto:
```bash
npm run build
```

2. Configurar variables de entorno en tu panel de hosting (Vercel/Dokploy).

3. Desplegar.
