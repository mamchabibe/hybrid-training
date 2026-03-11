(() => {
  const doc = document;
  const usesManagedAuth = Boolean(window.MAM_AUTH_ENABLED);

  const moduleTitles = {
    "1": "المحور الأول: المدخل الشخصاني في التربية",
    "2": "المحور الثاني: التكوين النفسي للمسؤولين عن الشبيبة",
    "3": "المحور الثالث: القيادة في العمل الرعوي مع الشباب",
    "4": "المحور الرابع: ديناميكية الجماعة وبناء الوحدة",
    "5": "المحور الخامس: الشهادة للمسيح في خدمة الشبيبة"
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

    // FUTURE PROGRESS TRACKING: replace this with a real backend training id.
    const hiddenTrainingId = doc.getElementById("training-id");
    if (hiddenTrainingId) {
      hiddenTrainingId.value = `${module}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    }
  };

  const initCompletionFlow = () => {
    const buttons = [...doc.querySelectorAll(".js-complete-training")];
    if (!buttons.length) {
      return;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const trainingIdInput = doc.getElementById("training-id");
        const trainingTitleNode = doc.getElementById("training-title");
        const trainingTitle = trainingTitleNode ? trainingTitleNode.textContent.trim() : "Unnamed Training";
        const trainingId = trainingIdInput ? trainingIdInput.value : trainingTitle.toLowerCase();

        const completed = getCompletedTrainings();
        const existing = completed.find((item) => item.id === trainingId);

        if (!existing) {
          completed.push({
            id: trainingId,
            title: trainingTitle,
            completedAt: new Date().toISOString()
          });
          saveCompletedTrainings(completed);
        }

        const status = doc.querySelector(".completion-status");
        if (status) {
          status.textContent = "Marked as completed in demo mode.";
        }

        // FUTURE QUIZ VALIDATION: call backend endpoint to verify quiz score before completion.
        // FUTURE PROGRESS TRACKING: persist completion to learner record in database.
        button.disabled = true;
        button.textContent = "Completed";
      });
    });
  };

  const initDashboardData = () => {
    if (doc.body.dataset.page !== "dashboard") {
      return;
    }

    const completed = getCompletedTrainings();
    const completedList = doc.querySelector("[data-completed-list]");
    const progressValue = doc.querySelector("[data-progress-value]");
    const progressFill = doc.querySelector("[data-progress-fill]");

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

    const percentage = Math.min(Math.round((completed.length / 10) * 100), 100);
    if (progressValue) {
      progressValue.textContent = `${percentage}%`;
    }
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    const authMessage = doc.querySelector("[data-demo-guard]");
    if (authMessage && !usesManagedAuth) {
      const isDemoLoggedIn = localStorage.getItem("mam_demo_auth") === "true";
      authMessage.textContent = isDemoLoggedIn
        ? "Demo member session active."
        : "You are viewing a front-end preview. Real access control will be added later.";
    }
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
})();










