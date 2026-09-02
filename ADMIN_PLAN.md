# CareVisit Admin plan

Internal operations portal for [CareVisit](https://github.com/syedsaqlain2122) — on-demand home healthcare in Pakistan. The patient/nurse apps submit visits and pharmacy orders; **this portal is how operators triage, assign staff, and review identity**.

## Surfaces

| Surface | Who | This repo |
|---|---|---|
| Patient + nurse apps | Clients and field staff | Expo app (`carevisit_project`) |
| **Admin portal** | Founder / ops | **This site** (static, GitHub Pages) |
| Supabase | Shared data | Same backend as the apps |

## v1 scope (shipped)

Aligned with `PROJECT_SPEC.md` Phase 3, minus a live GPS map (status tracker only, same as the mobile app).

1. **Login** — founder account `saqlain@gmail.com` / `123123`. Additional admins can be created in-app.
2. **Overview** — pending requests, live visits, ID reviews, COD outstanding.
3. **Visit queue** — assign a nurse + time window, advance status (`pending` → `completed` / `cancelled`).
4. **ID review** — approve or reject patient verification so they can book.
5. **Staff roster** — nurses, specialty, license, accepting jobs.
6. **Patients** — directory of app users.
7. **Pharmacy** — dispatch orders, mark delivered + COD collected.
8. **Payments** — cash-on-delivery only (no card gateway in v1).
9. **Reports** — volume by service, GMV snapshot.
10. **Admin users** — add/remove operators who can sign into this portal.

## Auth model (GitHub Pages)

GitHub Pages is static hosting. The portal **cannot** hold a Supabase `service_role` key (it would be public). Admin login is therefore **local to the browser** (`localStorage`):

- Seed operator: Saqlain (the credentials above).
- New admins are stored in the same browser workspace.
- Clearing site data resets to the seed account.

When we later attach a real admin `profiles.role = 'admin'` user in Supabase Auth, swap `src/lib/store.tsx` login for `supabase.auth.signInWithPassword` and keep the same screens.

## Design

Matches the mobile design system: primary `#2451F0`, deep `#131B4D`, care teal `#17B897`, surface `#FAF9F6`, Plus Jakarta Sans + Inter.

## Out of scope for this drop

- Live ops map / GPS
- Card payments
- Sending SMS OTP from the portal (that stays in the mobile app + Edge Functions)
- Writing to production Supabase from the browser without an admin JWT
