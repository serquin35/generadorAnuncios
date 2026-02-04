# halloBanana 🍌

AI-powered ad generator using fal.ai's NanoBanana model. Create stunning advertisements by combining character and product images with AI-generated compositions.

## ✨ Features

- 🎨 **AI-Generated Ads**: Combine character + product images with custom instructions
- 🔐 **Secure Authentication**: NextAuth.js v5 with credential-based login
- 🍌 **Credit System**: 3 free credits per user, 1 credit per generation
- 📱 **Mobile-Responsive**: "Vibrant Tech" theme optimized for all devices
- ⚡ **Hybrid Processing**: 15s sync timeout + async callback for reliability
- 🎯 **Ad Copy Generation**: AI-generated marketing text alongside images

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
1. Access your **Adminer** at `https://adminer.your-domain.com`
2. Copy the content of `database/init.sql` and execute it in the "SQL command" tab
3. Add the `credits` column manually:
```sql
ALTER TABLE "User" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Job" ADD COLUMN "adCopy" TEXT;
```

### 3. Configure Environment Variables
Copy `env.template` to `.env` and fill in the values:

```bash
cp env.template .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection URL (format: `postgresql://user:pass@host:5432/db`)
- `AUTH_SECRET` - Generate with `npx auth secret`
- `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000` or production domain)
- `N8N_WEBHOOK_URL` - n8n webhook URL for fal.ai integration
- `NEXT_PUBLIC_BASE_URL` - Public URL for image serving

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
app/
├── app/                  # Next.js App Router
│   ├── api/              # API Routes
│   │   ├── jobs/         # Job creation & retrieval
│   │   └── webhooks/     # n8n callback endpoint
│   ├── dashboard/        # Main dashboard & job detail
│   ├── login/            # Authentication pages
│   └── signup/
├── components/           # React Components
│   ├── JobForm.tsx       # Ad creation form
│   └── JobList.tsx       # Job history
├── lib/
│   ├── auth.ts           # NextAuth.js configuration
│   └── prisma.ts         # Prisma client + adapter
├── prisma/
│   └── schema.prisma     # Database schema
└── types/                # TypeScript definitions
```

## 🔧 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, Tailwind CSS 4
- **Backend**: Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js v5 (Credentials Provider)
- **AI Processing**: fal.ai NanoBanana model (via n8n)
- **Hosting**: Dokploy (Contabo VPS)

## 🍌 Credit System

- **New Users**: Start with 3 free credits
- **Cost**: 1 credit per ad generation
- **Display**: Credits shown in dashboard navbar (🍌 icon)
- **Enforcement**: Form disabled when credits = 0
- **Backend**: Transactional credit deduction in `POST /api/jobs`

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables (Production)
Configure these in your hosting panel (Dokploy/Vercel):
- All variables from `.env.template`
- Ensure `NEXTAUTH_URL` matches your production domain
- Update `N8N_WEBHOOK_URL` to production n8n instance

### Database Migration
After deployment, run in production database (Adminer):
```sql
ALTER TABLE "User" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Job" ADD COLUMN "adCopy" TEXT;
```

## 📚 Documentation

- [ARQUITECTURA.md](../ARQUITECTURA.md) - Complete architecture documentation
- [n8n Workflow](../generadorAnunciosFalAi.json) - Import this into n8n for fal.ai integration

## 🐛 Troubleshooting

**Issue**: "Property 'credits' does not exist on type 'User'"
- **Solution**: Run `npx prisma generate` after adding credits to schema

**Issue**: Jobs stuck in "pending" status
- **Solution**: Verify n8n webhook is active and `N8N_WEBHOOK_URL` is correct

**Issue**: 403 "No credits" error
- **Solution**: Check user credits in database, add manually if needed:
```sql
UPDATE "User" SET credits = 3 WHERE email = 'user@example.com';
```

## 📄 License

Private project - All rights reserved
