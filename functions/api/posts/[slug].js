export async function onRequestGet({ env, params }) {
  if (!env.DB) {
    return new Response("Not configured", { status: 503 });
  }

  const post = await env.DB.prepare(
    `select slug, title, excerpt, body, tags, created_at, updated_at
     from posts
     where slug = ? and status = 'published'
     limit 1`,
  )
    .bind(params.slug)
    .first();

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  await env.DB.prepare("update posts set views = views + 1 where slug = ?").bind(params.slug).run();

  return Response.json({
    post: {
      ...post,
      tags: JSON.parse(post.tags || "[]"),
    },
  });
}
