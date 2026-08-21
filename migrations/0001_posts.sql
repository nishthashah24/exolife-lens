create table if not exists posts (
  id integer primary key autoincrement,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null,
  tags text not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'published')),
  views integer not null default 0,
  author_email text not null default '',
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create index if not exists idx_posts_status_created on posts(status, created_at desc);
