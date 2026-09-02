# CareVisit Admin

Operations portal for CareVisit home healthcare. Triage visit requests, assign nurses, review IDs, track cash-on-delivery, and manage admin operators.

Uses the **same Supabase project** as the patient/nurse app (`mgomkwhyrcriwlysjphm`). Empty lists mean nobody has signed up or booked yet — not dummy seed data.

**Live:** [https://syedsaqlain2122.github.io/CareVisit-Admin/](https://syedsaqlain2122.github.io/CareVisit-Admin/)

## Sign in

| Email | Password |
|---|---|
| `saqlain@gmail.com` | `123123` |

Add more admins from **Admin users** after you sign in.

## Local development

```bash
npm install
cp env.example .env   # optional; defaults match the CareVisit project
npm run dev
```

## Production build

```bash
npm run build
```

The site is a static Vite app with HashRouter so it works on GitHub Pages (`/CareVisit-Admin/`).

See [ADMIN_PLAN.md](./ADMIN_PLAN.md) for scope and how this relates to the mobile apps.
