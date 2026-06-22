# Vercel Deployment Plan — Honghao Report

## 1. Prerequisites

- GitHub repo: `https://github.com/jiraaawat/honghao-report.git` (push ให้เรียบร้อยก่อน)
- Vercel account (https://vercel.com)
- PostgreSQL database (แนะนำ **Neon** หรือ **Supabase** — มี free tier)

> โปรเจกต์นี้ใช้ Prisma + PostgreSQL provider อยู่แล้ว จึงไม่ต้องแก้ schema ใหญ่

---

## 2. Database (Production)

### แนะนำ: Neon PostgreSQL

1. ไปที่ https://console.neon.tech
2. สร้าง project → เลือก region ใกล้ Vercel (e.g. `Singapore` หรือ `Tokyo`)
3. Copy **Database URL** ที่ได้รับ รูปแบบ:
   ```
   postgresql://user:password@host/dbname?sslmode=require
   ```

### ทางเลือกอื่น

- **Supabase Postgres**
- **Vercel Postgres** (ถ้ามีใน plan)
- **Railway / Render Postgres**

---

## 3. Vercel Project Setup

### 3.1 Import from GitHub

1. ไปที่ Vercel Dashboard → **Add New Project**
2. เลือก `jiraaawat/honghao-report`
3. ตั้งค่าตามนี้:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Build Command | `pnpm db:generate && next build` |
| Output Directory | (ปล่อย default) |
| Install Command | `pnpm install` |

> หมายเหตุ: `pnpm db:generate` จะรัน `prisma generate` ก่อน build เพื่อให้ Prisma Client มี query engine ถูกต้อง

### 3.2 Environment Variables

เพิ่มตัวแปรใน Vercel → Settings → Environment Variables:

| Name | Value / คำอธิบาย |
|------|------------------|
| `DATABASE_URL` | PostgreSQL connection string จาก Neon |
| `NEXTAUTH_SECRET` | สร้างด้วยคำสั่ง `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Domain ของเว็บ เช่น `https://honghao-report.vercel.app` |

> อย่าลืมกด **Save** และ redeploy หลังจากเพิ่ม env

---

## 4. Prisma Migration

หลังจาก deploy ครั้งแรก ต้องสร้างตารางในฐานข้อมูลจริง:

### วิธีที่ 1: รันผ่าน local (แนะนำ)

1. ตั้งค่า `DATABASE_URL` ในไฟล์ `apps/web/.env.local` ชี้ไปที่ Neon
2. รัน:
   ```bash
   pnpm db:migrate
   ```
3. ถ้าต้องการ seed ข้อมูลเริ่มต้น ให้เพิ่ม `prisma/seed.ts` แล้วรัน `pnpm prisma db seed`

### วิธีที่ 2: รันผ่าน Vercel CLI / Remote

- ใช้ `vercel --prod` แล้วรัน migration ผ่าน Prisma Data Platform หรือ Neon SQL Editor
- หรือเพิ่ม script ใน build step (ไม่แนะนำสำหรับ production บ่อย ๆ)

---

## 5. Build Configuration ที่อาจต้องปรับ

### `apps/web/next.config.ts`

ควรเปิด standalone output เพื่อให้ deploy บน Vercel ได้ optimized:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
}

export default nextConfig
```

### `turbo.json` (optional)

ตรวจสอบว่ามี pipeline `build` และ `lint` ที่ถูกต้องสำหรับ monorepo

---

## 6. Domain (Optional)

1. ใน Vercel Project → Settings → Domains
2. เพิ่ม custom domain ของคุณ
3. อัปเดต `NEXTAUTH_URL` ให้ตรงกับ domain ใหม่
4. Redeploy

---

## 7. Post-Deployment Checklist

- [ ] Deploy สำเร็จไม่มี error
- [ ] หน้า `/auth/signin` เปิดได้
- [ ] สมัคร account / login ได้
- [ ] เพิ่มการ์ด (`/inventory` → add card) ได้
- [ ] บันทึก transaction ได้
- [ ] หน้า dashboard แสดงตัวเลขถูกต้อง
- [ ] filter ทุกหน้าทำงานได้
- [ ] report export ได้

---

## 8. Known Issues / ข้อควรระวัง

### SQLite vs PostgreSQL
- ถ้า local dev ยังใช้ SQLite อยู่ ให้แยก `.env.local` สำหรับ local และ production env vars บน Vercel
- อย่า commit `.env.local`

### NextAuth URL
- ต้องตรงกับ domain จริง ถ้าเปลี่ยน domain ต้องอัปเดต `NEXTAUTH_URL` แล้ว redeploy

### Image Optimization
- ถ้ามีการอัปโหลดรูปการ์ด ต้องใช้ external storage เช่น Cloudinary / AWS S3 / Vercel Blob
- ปัจจุบันรูปเก็บเป็น `imageUrl` string อยู่แล้ว สามารถใช้ URL ภายนอกได้

---

## 9. Recommended Next Steps

1. สร้าง Neon project และได้ `DATABASE_URL`
2. Import project บน Vercel ด้วย root directory `apps/web`
3. ใส่ environment variables
4. รัน `pnpm db:migrate` กับ production database
5. Deploy
6. สร้าง user แรกผ่าน `/auth/register`
7. ทดสอบ flow ทั้งหมด

---

## 10. Useful Commands

```bash
# local production DB test
DATABASE_URL="postgresql://..." pnpm --filter web exec prisma migrate deploy

# generate prisma client
pnpm db:generate

# deploy via Vercel CLI
vercel --prod
```
