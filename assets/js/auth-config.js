// MAM Access Control Configuration
// Replace with your Supabase project values.
window.MAM_AUTH_CONFIG = Object.freeze({
  supabaseUrl: "REPLACE_WITH_SUPABASE_URL",
  supabaseAnonKey: "REPLACE_WITH_SUPABASE_ANON_KEY",
  protectedPages: [
    "catalogue.html",
    "module-1.html",
    "module-2.html",
    "module-3.html",
    "module-4.html",
    "module-5.html",
    "training-template.html",
    "resources.html",
    "dashboard.html"
  ]
});

window.MAM_AUTH_ENABLED =
  Boolean(window.MAM_AUTH_CONFIG?.supabaseUrl) &&
  Boolean(window.MAM_AUTH_CONFIG?.supabaseAnonKey) &&
  !window.MAM_AUTH_CONFIG.supabaseUrl.startsWith("REPLACE_") &&
  !window.MAM_AUTH_CONFIG.supabaseAnonKey.startsWith("REPLACE_");
