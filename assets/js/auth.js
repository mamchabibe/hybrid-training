(() => {
  const doc = document;
  const cfg = window.MAM_AUTH_CONFIG;
  if (!cfg) {
    return;
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const isConfigured = Boolean(window.MAM_AUTH_ENABLED);
  const protectedPages = new Set(cfg.protectedPages || []);

  const loginPage = "login.html";
  const registerPage = "register.html";

  const setStatus = (id, message, isError = false) => {
    const node = doc.getElementById(id);
    if (!node) {
      return;
    }
    node.classList.toggle("is-error", isError);
    node.textContent = message;
  };

  const getClient = () => {
    if (!window.supabase || !isConfigured) {
      return null;
    }
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  };

  const showAccessBlockedMessage = (message) => {
    const main = doc.querySelector("main");
    if (!main) {
      return;
    }
    main.innerHTML = `
      <section class="section">
        <div class="container">
          <article class="card">
            <p class="section-kicker">Access Setup Required</p>
            <h1 class="section-title">Training Access Is Locked</h1>
            <p>${message}</p>
            <p class="form-note">Set Supabase keys in <code>assets/js/auth-config.js</code> to activate registration and approval workflow.</p>
            <a class="btn btn-outline" href="register.html">Go to Registration</a>
          </article>
        </div>
      </section>
    `;
  };

  const getReturnUrl = () => `${currentPage}${window.location.search || ""}`;

  const redirectToLogin = (reason) => {
    const next = encodeURIComponent(getReturnUrl());
    window.location.href = `${loginPage}?reason=${encodeURIComponent(reason)}&next=${next}`;
  };

  const getProfile = async (client, userId) => {
    const { data, error } = await client
      .from("learner_profiles")
      .select("id, full_name, approved")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  };

  const guardProtectedPages = async () => {
    if (!protectedPages.has(currentPage)) {
      return;
    }

    if (!isConfigured) {
      showAccessBlockedMessage("Authentication is not configured yet. Contact platform admin.");
      return;
    }

    const client = getClient();
    if (!client) {
      showAccessBlockedMessage("Unable to initialize authentication client.");
      return;
    }

    const {
      data: { session }
    } = await client.auth.getSession();

    if (!session || !session.user) {
      redirectToLogin("login-required");
      return;
    }

    try {
      const profile = await getProfile(client, session.user.id);

      if (!profile) {
        await client.auth.signOut();
        window.location.href = `${registerPage}?reason=complete-registration`;
        return;
      }

      if (!profile.approved) {
        await client.auth.signOut();
        window.location.href = `${registerPage}?reason=pending-approval`;
        return;
      }

      if (currentPage === "dashboard.html") {
        const badge = doc.querySelector("[data-demo-guard]");
        if (badge) {
          badge.textContent = `Approved member session: ${profile.full_name || session.user.email}`;
        }
      }
    } catch (error) {
      showAccessBlockedMessage("Access check failed. Please try again or contact support.");
    }
  };

  const initLogoutButtons = () => {
    const buttons = [...doc.querySelectorAll("[data-logout]")];
    if (!buttons.length) {
      return;
    }

    const client = getClient();
    if (!client) {
      return;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", async () => {
        await client.auth.signOut();
        window.location.href = loginPage;
      });
    });
  };
  const setRegisterReasonMessage = () => {
    if (currentPage !== registerPage) {
      return;
    }

    const reason = new URLSearchParams(window.location.search).get("reason");
    if (!reason) {
      return;
    }

    if (reason === "pending-approval") {
      setStatus("register-status", "Your account exists but is pending admin approval. We will notify you once activated.");
    }

    if (reason === "complete-registration") {
      setStatus("register-status", "Please complete registration first to request training access.");
    }
  };

  const initRegistrationForm = () => {
    if (currentPage !== registerPage) {
      return;
    }

    const form = doc.getElementById("register-form");
    if (!form) {
      return;
    }

    const client = getClient();
    if (!client) {
      setStatus("register-status", "Registration backend is not configured yet. Contact platform admin.", true);
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        setStatus("register-status", "Please complete all required fields before submitting.", true);
        form.reportValidity();
        return;
      }

      const payload = Object.fromEntries(new FormData(form).entries());
      const email = (payload.email || "").trim().toLowerCase();
      const password = (payload.password || "").trim();
      const confirmPassword = (payload.confirm_password || "").trim();

      if (password.length < 8) {
        setStatus("register-status", "Password must be at least 8 characters.", true);
        return;
      }

      if (password !== confirmPassword) {
        setStatus("register-status", "Password and confirmation do not match.", true);
        return;
      }

      setStatus("register-status", "Creating account and sending registration request...");

      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: payload.full_name,
            parish_team: payload.parish_team,
            role_type: payload.role_type,
            age_group: payload.age_group,
            phone: payload.phone,
            age: payload.age,
            notes: payload.notes || ""
          }
        }
      });

      if (signUpError || !signUpData.user) {
        setStatus("register-status", signUpError?.message || "Could not create account. Please try again.", true);
        return;
      }

      // Profile row is created in DB trigger from auth user metadata.
      // REPLACE WITH REAL FORM ENDPOINT: optional webhook/email can be called here for admin notification.
      setStatus(
        "register-status",
        "Registration submitted successfully. Please verify your email (if prompted), then wait for admin approval before training access."
      );

      form.reset();
    });
  };

  const setLoginReasonMessage = () => {
    if (currentPage !== loginPage) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");

    if (reason === "login-required") {
      setStatus("login-status", "Please log in with your approved account to access trainings.");
    }
  };

  const initLoginForm = () => {
    if (currentPage !== loginPage) {
      return;
    }

    const form = doc.getElementById("login-form");
    if (!form) {
      return;
    }

    const client = getClient();
    if (!client) {
      setStatus("login-status", "Authentication backend is not configured yet. Contact platform admin.", true);
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        setStatus("login-status", "Enter both email and password to continue.", true);
        form.reportValidity();
        return;
      }

      const email = (form.querySelector("#login-email")?.value || "").trim().toLowerCase();
      const password = form.querySelector("#login-password")?.value || "";

      setStatus("login-status", "Signing in...");

      const { data, error } = await client.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        setStatus("login-status", error?.message || "Login failed.", true);
        return;
      }

      let profile;
      try {
        profile = await getProfile(client, data.user.id);
      } catch (profileError) {
        setStatus("login-status", "Could not validate your access profile. Please try again.", true);
        return;
      }

      if (!profile) {
        await client.auth.signOut();
        setStatus("login-status", "No registration profile found. Please register first.", true);
        window.setTimeout(() => {
          window.location.href = "register.html?reason=complete-registration";
        }, 900);
        return;
      }

      if (!profile.approved) {
        await client.auth.signOut();
        setStatus("login-status", "Your registration is pending approval. Access will open after admin approval.", true);
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next") || "dashboard.html";
      setStatus("login-status", "Access approved. Redirecting...");
      window.setTimeout(() => {
        window.location.href = next;
      }, 500);
    });
  };

  setRegisterReasonMessage();
  setLoginReasonMessage();
  initRegistrationForm();
  initLoginForm();
  initLogoutButtons();
  guardProtectedPages();
})();





