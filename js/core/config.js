// Discord sign-in and saved recipes use a free Supabase project. Fill these two in from
// Supabase > Project Settings > API (see docs/discord-login.md). Both are meant to be public:
// the table's row-level security stops anyone reading or changing someone else's saves.
// Leave them empty and the site works as before, with saves kept on this device only.
App.SUPABASE={
  url:"https://mmzbgmdmlcivxvrpxvir.supabase.co",
  key:"sb_publishable_RLYb9Rejf8cXzc0X-Q1yIg_9jvkyAsh"// publishable key: public by design
};
