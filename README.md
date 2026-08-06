# RFID Student Attendance System

Next.js 16, TypeScript, Supabase Auth, PostgreSQL, RFID attendance, and asynchronous parent/guardian SMS notifications.

## Configuration

Copy `.env.example` to `.env.local` and supply the Supabase and Turnstile values. `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, and `AUTH_RATE_LIMIT_SECRET` are server-only. They must never be placed in browser code, public environment variables, or ESP32 firmware.

Apply the initial migration and seed only to a disposable/local database first:

```bash
supabase db reset
```

The initial migration is edited in place because this repository has no evidence that it was applied to a Supabase project. If it is applied elsewhere before deployment, freeze it and create a new corrective migration instead.

In Supabase Auth, configure the Custom Access Token hook. Configure the Password Verification Attempt hook only on Teams/Enterprise, then set `SUPABASE_PASSWORD_VERIFICATION_HOOK_ENABLED=true`; ordinary plans keep it `false` and use the Next.js best-effort counter.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The login Server Action signs in through Supabase Auth, creates/touches the application session, reads the profile role, and redirects to `/admin`, `/teacher`, or `/student`. Protected routes use Next.js `proxy.ts`; PostgreSQL RLS remains the final authorization boundary.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
