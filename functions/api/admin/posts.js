function getAdminEmail(request, env) {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  const allowed = env.ADMIN_EMAIL;

  if (!allowed || !email) return null;
  return email.toLowerCase() === allowed.toLowerCase() ? email : null;
}

export async function onRequestGet({ request, env }) {
  const adminEmail = getAdminEmail(request, env);
  if (!adminEmail) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await env.DB.prepare(
    `select slug, title, excerpt, body, tags, status, views, created_at, updated_at
     from posts
     order by updated_at desc
     limit 50`,
  ).all();

  return Response.json({
    adminEmail,
    posts: result.results.map((post) => ({
      ...post,
      tags: JSON.parse(post.tags || "[]"),
    })),
  });
}

export async function onRequestPost({ request, env }) {
  const adminEmail = getAdminEmail(request, env);
  if (!adminEmail) {
    return new Response("Unauthorized", { status: 401 });
  }

  const input = await request.json();
  const title = String(input.title || "").trim().slice(0, 140);
  const slug = String(input.slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
  const excerpt = String(input.excerpt || "").trim().slice(0, 320);
  const body = String(input.body || "").trim().slice(0, 20000);
  const status = input.status === "published" ? "published" : "draft";
  const tags = Array.isArray(input.tags) ? input.tags.map((tag) => String(tag).trim().slice(0, 32)).filter(Boolean).slice(0, 6) : [];

  if (!title || !slug || !body) {
    return Response.json({ error: "title, slug, and body are required" }, { status: 400 });
  }

  await env.DB.prepare(
    `insert into posts (slug, title, excerpt, body, tags, status, author_email, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     on conflict(slug) do update set
       title = excluded.title,
       excerpt = excluded.excerpt,
       body = excluded.body,
       tags = excluded.tags,
       status = excluded.status,
       author_email = excluded.author_email,
       updated_at = datetime('now')`,
  )
    .bind(slug, title, excerpt, body, JSON.stringify(tags), status, adminEmail)
    .run();

  return Response.json({ ok: true, slug });
}
