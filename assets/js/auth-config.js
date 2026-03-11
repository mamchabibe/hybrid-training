// MAM Access Control Configuration
// Replace with your Supabase project values.
window.MAM_AUTH_CONFIG = Object.freeze({
  supabaseUrl: "https://kswefxwizaujbtmgdemo.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd2VmeHdpemF1amJ0bWdkZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDQ4MjAsImV4cCI6MjA4ODc4MDgyMH0.APN3KLIUNHiQma6WRIZ1vNsg7s4pgaic1yYpl0pO7X4",
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
