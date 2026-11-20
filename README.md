# TT Ventures — Next.js migration

The storefront keeps the existing TT Ventures HTML, CSS, and browser scripts as its presentation source. The App Router renders the homepage and the existing shop, account, admin, contact, delivery, returns, and payment callback pages at clean Next.js routes.

Customer and order endpoints are implemented as Next.js route handlers under `app/api/[...path]`. Data lives in in-memory arrays and resets when the server restarts. Paystack checkout still requires `PAYSTACK_SECRET_KEY`; the admin order endpoints require `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3001.

The original project remains unchanged in the sibling `TT-ventures-main` folder.

# tt-ventures-new-web
