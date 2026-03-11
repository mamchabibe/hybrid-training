(() => {
  const doc = document;
  const usesManagedAuth = Boolean(window.MAM_AUTH_ENABLED);
  const completionTarget = 20;

  const moduleTitles = {
    "1": "المحور الأول: المدخل الشخصاني في التربية",
    "2": "المحور الثاني: التكوين النفسي للمسؤولين عن الشبيبة",
    "3": "المحور الثالث: القيادة في العمل الرعوي مع الشباب",
    "4": "المحور الرابع: ديناميكية الجماعة وبناء الوحدة",
    "5": "المحور الخامس: الشهادة للمسيح في خدمة الشبيبة"
  };

  let managedClient;

  const getManagedClient = () => {
    if (!usesManagedAuth || !window.supabase || !window.MAM_AUTH_CONFIG) {
      return null;
    }
    if (!managedClient) {
      managedClient = window.supabase.createClient(
        window.MAM_AUTH_CONFIG.supabaseUrl,
        window.MAM_AUTH_CONFIG.supabaseAnonKey
      );
    }
    return managedClient;
  };

  const getManagedUser = async () => {
    const client = getManagedClient();
    if (!client) {
      return null;
    }

    const {
      data: { session }
    } = await client.auth.getSession();

    return session?.user || null;
  };

  const formatDate = (isoDate) => {
    if (!isoDate) {
      return "";
    }
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const setActiveNavLink = () => {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    doc.querySelectorAll(".site-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === currentPath) {
        link.classList.add("is-active");
      }
    });
  };

  const initMobileMenu = () => {
    const toggle = doc.querySelector("[data-menu-toggle]");
    const menu = doc.querySelector("[data-menu]");
    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  };

  const initSmoothScroll = () => {
    doc.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") {
          return;
        }
        const target = doc.querySelector(id);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  };

  const initFooterYear = () => {
    const yearNode = doc.getElementById("current-year");
    if (yearNode) {
      yearNode.textContent = String(new Date().getFullYear());
    }
  };

  const initResourceFilters = () => {
    const filterButtons = [...doc.querySelectorAll("[data-filter-btn]")];
    const cards = [...doc.querySelectorAll("[data-resource-category]")];
    if (!filterButtons.length || !cards.length) {
      return;
    }

    const applyFilter = (value) => {
      cards.forEach((card) => {
        const categories = (card.dataset.resourceCategory || "").split(" ");
        const show = value === "all" || categories.includes(value);
        card.classList.toggle("hidden", !show);
      });
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        applyFilter(button.dataset.filterBtn || "all");
      });
    });
  };

  const initFaqBehavior = () => {
    const faqItems = [...doc.querySelectorAll(".faq-list details")];
    if (!faqItems.length) {
      return;
    }

    faqItems.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) {
          return;
        }
        faqItems.forEach((other) => {
          if (other !== item) {
            other.open = false;
          }
        });
      });
    });
  };

  const getCompletedTrainings = () => {
    try {
      const raw = localStorage.getItem("mam_completed_trainings");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const saveCompletedTrainings = (items) => {
    localStorage.setItem("mam_completed_trainings", JSON.stringify(items));
  };

  const getTrainingContext = () => {
    const trainingIdInput = doc.getElementById("training-id");
    const trainingTitleNode = doc.getElementById("training-title");
    const moduleParam = new URLSearchParams(window.location.search).get("module") || "1";

    const trainingTitle = trainingTitleNode ? trainingTitleNode.textContent.trim() : "Unnamed Training";
    const trainingId = trainingIdInput ? trainingIdInput.value : trainingTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return {
      trainingId,
      trainingTitle,
      moduleId: moduleParam,
      moduleTitle: moduleTitles[moduleParam] || moduleTitles["1"],
      badgeCode: `badge-${trainingId}`
    };
  };

  const initTrainingTemplateData = () => {
    if (doc.body.dataset.page !== "training-template") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const title = params.get("title") || "Training Title Placeholder";
    const module = params.get("module") || "1";

    const titleNode = doc.getElementById("training-title");
    const moduleNode = doc.getElementById("training-module-badge");

    if (titleNode) {
      titleNode.textContent = title;
    }

    if (moduleNode) {
      moduleNode.textContent = moduleTitles[module] || moduleTitles["1"];
    }

    const hiddenTrainingId = doc.getElementById("training-id");
    if (hiddenTrainingId) {
      hiddenTrainingId.value = `${module}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    }
  };

  const setCompletionUi = (button, statusText) => {
    const status = doc.querySelector(".completion-status");
    if (status) {
      status.textContent = statusText;
    }
    button.disabled = true;
    button.textContent = "Completed";
  };

  const setProgressVisual = (completedCount) => {
    const progressValue = doc.querySelector("[data-progress-value]");
    const progressFill = doc.querySelector("[data-progress-fill]");
    const percentage = Math.min(Math.round((completedCount / completionTarget) * 100), 100);

    if (progressValue) {
      progressValue.textContent = `${percentage}%`;
    }
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
  };

  const renderBadgeWall = (completions) => {
    const badgeCount = doc.querySelector("[data-badge-count]");
    const badgeList = doc.querySelector("[data-badge-list]");

    if (badgeCount) {
      badgeCount.textContent = String(completions.length);
    }

    if (!badgeList) {
      return;
    }

    badgeList.innerHTML = "";
    if (!completions.length) {
      const p = doc.createElement("p");
      p.className = "placeholder-note";
      p.textContent = "No badges yet. Complete your first training to earn one.";
      badgeList.appendChild(p);
      return;
    }

    completions.slice(0, 12).forEach((item) => {
      const badge = doc.createElement("span");
      badge.className = "badge badge--gold";
      badge.textContent = item.module_title ? `Badge - ${item.module_title}` : "Course Badge";
      badgeList.appendChild(badge);
    });
  };

  const initCompletionFlow = () => {
    const buttons = [...doc.querySelectorAll(".js-complete-training")];
    if (!buttons.length) {
      return;
    }

    const button = buttons[0];

    const markCompletedLocally = () => {
      const context = getTrainingContext();
      const completed = getCompletedTrainings();
      const existing = completed.find((item) => item.id === context.trainingId);

      if (!existing) {
        completed.push({
          id: context.trainingId,
          title: context.trainingTitle,
          completedAt: new Date().toISOString()
        });
        saveCompletedTrainings(completed);
      }

      setCompletionUi(button, "Marked as completed in demo mode.");
    };

    const initManagedCompletionState = async () => {
      const client = getManagedClient();
      const user = await getManagedUser();
      if (!client || !user) {
        return;
      }

      const context = getTrainingContext();
      const { data, error } = await client
        .from("learner_course_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("training_id", context.trainingId)
        .maybeSingle();

      if (!error && data) {
        setCompletionUi(button, "Already completed. Badge already earned for this training.");
      }
    };

    if (usesManagedAuth) {
      initManagedCompletionState();
    }

    button.addEventListener("click", async () => {
      if (!usesManagedAuth) {
        markCompletedLocally();
        return;
      }

      const client = getManagedClient();
      const user = await getManagedUser();
      const context = getTrainingContext();
      const status = doc.querySelector(".completion-status");

      if (!client || !user) {
        if (status) {
          status.textContent = "Session not found. Please log in again.";
        }
        return;
      }

      if (status) {
        status.textContent = "Saving completion and badge...";
      }

      const payload = {
        user_id: user.id,
        training_id: context.trainingId,
        training_title: context.trainingTitle,
        module_id: context.moduleId,
        module_title: context.moduleTitle,
        badge_code: context.badgeCode
      };

      const { error } = await client
        .from("learner_course_completions")
        .upsert(payload, { onConflict: "user_id,training_id" });

      if (error) {
        if (status) {
          status.textContent = `Could not save completion: ${error.message}`;
        }
        return;
      }

      setCompletionUi(button, "Completed and badge earned for your dashboard.");
    });
  };

  const initDashboardData = async () => {
    if (doc.body.dataset.page !== "dashboard") {
      return;
    }

    const completedList = doc.querySelector("[data-completed-list]");
    const inProgressList = doc.querySelector("[data-in-progress-list]");
    const authMessage = doc.querySelector("[data-demo-guard]");
    const welcomeName = doc.querySelector("[data-welcome-name]");

    if (!usesManagedAuth) {
      const completed = getCompletedTrainings();

      if (completedList) {
        completedList.innerHTML = "";
        if (!completed.length) {
          const li = doc.createElement("li");
          li.textContent = "No completed trainings yet. Start from the catalogue.";
          completedList.appendChild(li);
        } else {
          completed.forEach((item) => {
            const li = doc.createElement("li");
            li.textContent = item.title;
            completedList.appendChild(li);
          });
        }
      }

      setProgressVisual(completed.length);

      if (inProgressList) {
        inProgressList.innerHTML = "";
        const li = doc.createElement("li");
        li.textContent = completed.length
          ? "Continue with the next training in the catalogue to earn more badges."
          : "No progress started yet. Open any training and mark completion to begin.";
        inProgressList.appendChild(li);
      }

      if (authMessage) {
        const isDemoLoggedIn = localStorage.getItem("mam_demo_auth") === "true";
        authMessage.textContent = isDemoLoggedIn
          ? "Demo member session active."
          : "You are viewing a front-end preview. Real access control will be added later.";
      }

      renderBadgeWall([]);
      return;
    }

    const client = getManagedClient();
    const user = await getManagedUser();

    if (!client || !user) {
      return;
    }

    const { data: profile } = await client
      .from("learner_profiles")
      .select("full_name,email,parish_team,role_type,age_group")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      if (welcomeName) {
        welcomeName.textContent = profile.full_name || "Learner";
      }

      const map = {
        "[data-profile-name]": profile.full_name || "-",
        "[data-profile-email]": profile.email || user.email || "-",
        "[data-profile-parish]": profile.parish_team || "-",
        "[data-profile-role]": profile.role_type || "-",
        "[data-profile-age-group]": profile.age_group || "-"
      };

      Object.entries(map).forEach(([selector, value]) => {
        const node = doc.querySelector(selector);
        if (node) {
          node.textContent = String(value);
        }
      });
    }

    const { data: completions, error: completionError } = await client
      .from("learner_course_completions")
      .select("training_id,training_title,module_title,completed_at,badge_code")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    const completionRows = completionError || !Array.isArray(completions) ? [] : completions;

    if (completionError) {
      if (completedList) {
        completedList.innerHTML = "";
        const li = doc.createElement("li");
        li.textContent = `Progress table issue: ${completionError.message}`;
        completedList.appendChild(li);
      }
      renderBadgeWall([]);
      setProgressVisual(0);
      return;
    }

    if (completedList) {
      completedList.innerHTML = "";
      if (!completionRows.length) {
        const li = doc.createElement("li");
        li.textContent = "No completed trainings yet. Start from the catalogue.";
        completedList.appendChild(li);
      } else {
        completionRows.forEach((item) => {
          const li = doc.createElement("li");
          const dateText = formatDate(item.completed_at);
          li.textContent = dateText
            ? `${item.training_title} (${dateText})`
            : item.training_title;
          completedList.appendChild(li);
        });
      }
    }

    if (inProgressList) {
      inProgressList.innerHTML = "";
      const li = doc.createElement("li");
      li.textContent = completionRows.length
        ? "Continue with the next training in the catalogue to earn more badges."
        : "No progress started yet. Open any training and mark completion to begin.";
      inProgressList.appendChild(li);
    }

    setProgressVisual(completionRows.length);
    renderBadgeWall(completionRows);

    if (authMessage) {
      authMessage.textContent = `Approved member session: ${profile?.full_name || user.email}`;
    }
  };

  const initContactForm = () => {
    if (doc.body.dataset.page !== "contact") {
      return;
    }

    const form = doc.getElementById("contact-form");
    const statusNode = doc.getElementById("contact-status");

    if (!form || !statusNode) {
      return;
    }

    const setStatus = (message, isError = false) => {
      statusNode.classList.toggle("is-error", isError);
      statusNode.textContent = message;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        setStatus("Please complete all required fields before sending.", true);
        form.reportValidity();
        return;
      }

      const client = getManagedClient();
      if (!client) {
        setStatus("Contact backend is not configured yet. Please use WhatsApp or email above.", true);
        return;
      }

      const payload = Object.fromEntries(new FormData(form).entries());
      const user = await getManagedUser();

      setStatus("Sending your message...");

      const { error } = await client.from("contact_messages").insert({
        user_id: user?.id || null,
        full_name: String(payload.full_name || "").trim(),
        email: String(payload.email || "").trim().toLowerCase(),
        topic: String(payload.topic || "").trim(),
        message: String(payload.message || "").trim()
      });

      if (error) {
        setStatus(`Could not send your message: ${error.message}`, true);
        return;
      }

      setStatus("Message sent successfully. The formation team will get back to you soon.");
      form.reset();
    });
  };
  setActiveNavLink();
  initMobileMenu();
  initSmoothScroll();
  initFooterYear();
  initResourceFilters();
  initFaqBehavior();
  initTrainingTemplateData();
  initCompletionFlow();
  initDashboardData();
  initContactForm();
})();




