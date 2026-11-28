// Discord sign-in and saved recipes use a free Supabase project. Fill these two in from
// Supabase > Project Settings > API (see docs/discord-login.md). Both are meant to be public:
// the table's row-level security stops anyone reading or changing someone else's saves.
// Leave them empty and the site works as before, with saves kept on this device only.
App.SUPABASE={
  url:"",// e.g. "https://abcdefghijkl.supabase.co"
  key:""// the "anon public" key (or "publishable" key)
};
