# Element CRM — Next.js

Staff portal for Element Barbershop.  
URL: `https://crm.element-barbershop.com`

## Stack
- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- TanStack Query
- Vercel hosting

## Local dev

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/element-crm.git
git push -u origin main
```

### 2. Connect Vercel
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://element-crm-api-431945333485.us-central1.run.app`
4. Click Deploy

### 3. Add custom domain
1. Vercel → Your project → Settings → Domains
2. Add `crm.element-barbershop.com`
3. In your DNS provider add:
   ```
   CNAME  crm  cname.vercel-dns.com
   ```

## Roles
| Role | Access |
|------|--------|
| owner | Everything |
| admin | No payroll, no settings |
| barber | Calendar only (own bookings) |

## API
Backend: `https://element-crm-api-431945333485.us-central1.run.app`
Auth: httpOnly cookie `element_token` (set on login)
