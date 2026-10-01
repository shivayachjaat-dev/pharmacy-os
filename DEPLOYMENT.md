# DEPLOYMENT.md — Production Deployment & Operations Guide

## 1. Hosting Options

PharmacyOS is a container-ready Next.js application that can be deployed across various production environments:
1. **Self-Hosted / VPS (Docker Compose)**: Full control over database, assets, and compute (Ideal for Indian private cloud or local data sovereignty).
2. **Cloud Managed (Vercel / AWS ECS / Railway)**: Standard Next.js server runtime with managed PostgreSQL (Supabase / Neon / AWS RDS).

---

## 2. Environment Variables (.env.example)

```env
# Application
NODE_ENV=production
APP_URL=https://pharmacyos.in
PORT=3000

# Database
# For SQLite (default development): file:./dev.db
# For PostgreSQL (production): postgresql://user:password@host:5432/pharmacyos?schema=public
DATABASE_URL="file:./dev.db"

# Authentication & Security
AUTH_SECRET="your-super-secret-random-32-byte-key"
NEXTAUTH_URL="https://pharmacyos.in"

# Storage
STORAGE_PROVIDER="local" # "local" or "s3"
LOCAL_UPLOAD_DIR="./uploads"

# Integrations (Optional in sandbox)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
WHATSAPP_API_TOKEN="your_meta_whatsapp_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_id"
```

---

## 3. Production Build & Execution

```bash
# 1. Install production dependencies
npm ci

# 2. Run migrations
npx prisma migrate deploy

# 3. Build application
npm run build

# 4. Start production server
npm start
```

---

## 4. Backup & Disaster Recovery
- **Database Backup**: Daily automated SQLite/PostgreSQL dumps.
- **Prescription Uploads**: Encrypted volume snapshots.
