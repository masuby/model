# ⚠️ Legacy SQL — DO NOT RUN

These files are kept for historical reference only. They had drifted from the
shipped frontend code (wrong committee column names, a NOT NULL `indicator_id`
the app never sends, and RLS that assumed Supabase Auth while the app uses the
anon key with app-level auth).

**The single source of truth is [`../setup.sql`](../setup.sql).** Run that, and
nothing in this folder.
