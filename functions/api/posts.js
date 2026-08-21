export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json({ posts: [] });
  }

  const result = await env.DB.prepare(
    `select slug, title, excerpt, body, tags, created_at, updated_at
     from posts
     where status = 'published'
     order by created_at desc
     limit 20`,
  ).all();

  return Response.json({
    posts: result.results.map((post) => ({
      ...post,
      tags: JSON.parse(post.tags || "[]"),
    })),
  });
}
