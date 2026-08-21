# Blog Backend Plan

The public site can stay on Cloudflare Pages. The creator backend can use Cloudflare Pages Functions, D1, and Cloudflare Access with Google login.

## Public Version

- `/creator` is public.
- `/api/posts` returns only published posts.
- `/api/posts/:slug` returns one published post and increments its private view count.
- Public responses do not include `views`.

## Creator Version

- `/admin` should be protected with Cloudflare Access.
- `/api/admin/posts` should also be protected with Cloudflare Access.
- Cloudflare Access can use Google as an identity provider.
- Set an `ADMIN_EMAIL` environment variable in Cloudflare so only your sister's email can use admin APIs.

## Cloudflare Setup

1. Deploy the Pages project from GitHub.
2. Create a D1 database named `exolife-lens`.
3. Replace `database_id` in `wrangler.toml` with the real D1 database ID.
4. Run the migration:

```bash
npx wrangler d1 migrations apply exolife-lens
```

5. In Cloudflare Pages, add a D1 binding:
   - Binding name: `DB`
   - Database: `exolife-lens`

6. Add an environment variable:
   - `ADMIN_EMAIL=your-sister-email@example.com`

7. In Cloudflare Zero Trust, create an Access application for:
   - `/admin*`
   - `/api/admin/*`

8. Add Google as the identity provider and allow only your sister's email.

## Why This Design

Cloudflare D1 is available on Free and Paid plans and is suitable for small serverless SQL-backed features. Cloudflare Pages Functions can run API endpoints beside the static site. Cloudflare Access can integrate with Google login and gate the admin area without building a custom password system.
