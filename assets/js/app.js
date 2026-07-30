/* ============================================================
   Who is a Jain Sadhu? — app.js
   Shared across ALL pages
   Reduced + fade transition for video and caption
   ============================================================ */
(() => {
  const LANG_KEY = "selectedLanguage";
  const DEFAULT_LANG = "English";
  let translations = null;

  const isHomepage = () => !!document.querySelector(".topic-card");
  const isTopicPage = () => !!document.querySelector(".topic-swiper");

  const langSelectorMap = {
    English: ".english-button",
    Hindi: ".hindi-button",
    Gujarati: ".gujrati-button",
  };

  /* ── Get saved language (falls back to default) ── */
  function getSavedLanguage() {
    return localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
  }

  /* ── Load translations ── */
  async function loadTranslations() {
    if (translations) return translations;

    try {
      const res = await fetch("assets/json/data.json");
      if (!res.ok) throw new Error("JSON not found");
      translations = await res.json();
    } catch (err) {
      console.warn("Translation load failed:", err);
      translations = {};
    }

    return translations;
  }

  /* ── Active language UI ── */
  function setActiveUI(lang) {
    document.querySelectorAll(".navbar-language > div").forEach((btn) => {
      btn.classList.remove("lang-active");
    });

    document.querySelector(langSelectorMap[lang])?.classList.add("lang-active");
  }

  /* ── Caption frame width based on visible caption text ── */
  function updateCaptionFrameWidth() {
    const captionFrame = document.querySelector(".stable-caption-frame");
    const frameImg = document.querySelector(".stable-caption-frame-img");
    const activeCaption = document.querySelector("#topicCaption");

    if (!captionFrame || !frameImg || !activeCaption) return;

    requestAnimationFrame(() => {
      const measurer = document.createElement("span");
      const computed = window.getComputedStyle(activeCaption);

      Object.assign(measurer.style, {
        position: "absolute",
        visibility: "hidden",
        pointerEvents: "none",
        left: "-9999px",
        top: "-9999px",
        whiteSpace: "nowrap",
        width: "max-content",
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        letterSpacing: computed.letterSpacing,
        lineHeight: computed.lineHeight,
      });

      measurer.className = activeCaption.className;
      measurer.textContent = activeCaption.textContent.trim();

      document.body.appendChild(measurer);
      const textWidth = measurer.getBoundingClientRect().width;
      document.body.removeChild(measurer);

      const minWidth = window.innerWidth * 0.14;
      const maxWidth = window.innerWidth * 0.42;
      const sidePadding = window.innerWidth * 0.06;
      const finalWidth = Math.max(
        minWidth,
        Math.min(textWidth + sidePadding, maxWidth),
      );

      captionFrame.style.width = `${finalWidth}px`;
      frameImg.style.width = `${finalWidth}px`;
    });
  }

  /* ── Get translated caption text ── */
  function getCaptionText(slideIndex = 0) {
    const sourceCaption = document.querySelector(
      `.caption-source-item[data-slide-index="${slideIndex}"]`,
    );
    if (!sourceCaption) return null;

    const key = sourceCaption.getAttribute("data-lang-key");
    const currentLang = getSavedLanguage();

    return {
      key,
      text:
        translations?.[currentLang]?.[key] ?? sourceCaption.textContent.trim(),
    };
  }

  /* ── Update caption instantly ── */
  function updateTopicCaption(slideIndex = 0) {
    const visibleCaption = document.querySelector("#topicCaption");
    const data = getCaptionText(slideIndex);

    if (!visibleCaption || !data) return;

    visibleCaption.setAttribute("data-lang-key", data.key);
    visibleCaption.textContent = data.text;
    updateCaptionFrameWidth();
  }

  /* ── Update caption with fade ── */
  function updateTopicCaptionWithFade(slideIndex = 0) {
    const visibleCaption = document.querySelector("#topicCaption");
    const data = getCaptionText(slideIndex);

    if (!visibleCaption || !data) return;

    visibleCaption.classList.remove("caption-fade-in");
    visibleCaption.classList.add("caption-fade-out");

    setTimeout(() => {
      visibleCaption.setAttribute("data-lang-key", data.key);
      visibleCaption.textContent = data.text;
      updateCaptionFrameWidth();

      visibleCaption.classList.remove("caption-fade-out");
      visibleCaption.classList.add("caption-fade-in");

      setTimeout(() => {
        visibleCaption.classList.remove("caption-fade-in");
      }, 450);
    }, 220);
  }

  /* ── Apply language ── */
  function applyLanguage(lang, save = true) {
    document.documentElement.setAttribute("lang", lang);
    document.body.setAttribute(
      "data-lang",
      lang === "Hindi" ? "hi" : lang === "Gujarati" ? "gu" : "en",
    );

    setActiveUI(lang);

    if (translations?.[lang]) {
      document.querySelectorAll("[data-lang-key]").forEach((el) => {
        const key = el.getAttribute("data-lang-key");
        const value = translations[lang][key];
        if (value == null) return;

        if (String(value).includes("<br")) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      });
    }

    if (save) {
      localStorage.setItem(LANG_KEY, lang);
    }

    if (isTopicPage()) {
      const activeIndex =
        document.querySelector(".topic-swiper")?.swiper?.activeIndex || 0;
      updateTopicCaption(activeIndex);
    }

    setTimeout(updateCaptionFrameWidth, 120);
    document.fonts?.ready?.then(updateCaptionFrameWidth);
  }

  /* ── Page navigation ── */
  function navigateTo(href) {
    document.body.classList.add("page-exit");
    setTimeout(() => {
      window.location.href = href;
    }, 420);
  }

  /* ── Language button listeners ── */
  function initLanguageButtons() {
    Object.entries(langSelectorMap).forEach(([lang, selector]) => {
      document.querySelector(selector)?.addEventListener("click", () => {
        applyLanguage(lang);
      });
    });
  }

  /* ── Homepage ── */
  function initHomepage() {
    // Restore saved language on homepage (do NOT reset to default)
    const lang = getSavedLanguage();
    applyLanguage(lang, false);

    // Re-apply after first paint to prevent flash
    requestAnimationFrame(() => applyLanguage(lang, false));

    document.querySelectorAll(".topic-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(card.getAttribute("href"));
      });
    });
  }

  /* ── Topic page ── */
  function initTopicPage() {
    // Restore saved language on topic page (do NOT reset to default)
    const lang = getSavedLanguage();
    applyLanguage(lang, false);

    // Re-apply after first paint to prevent flash
    requestAnimationFrame(() => applyLanguage(lang, false));

    document.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(link.getAttribute("href"));
      });
    });

    if (typeof Swiper === "undefined") return;

    const prevBtn = document.querySelector(".swiper-ctrl-prev");
    const nextBtn = document.querySelector(".swiper-ctrl-next");
    const allVideos = document.querySelectorAll(".topic-swiper .slide-video");

    const toggleDisplay = (el, show) => {
      if (el) el.style.display = show ? "flex" : "none";
    };

    function updateNavButtons(swiper) {
      toggleDisplay(prevBtn, !swiper.isBeginning);
      toggleDisplay(nextBtn, !swiper.isEnd);
    }

    function pauseAllVideos(reset = true) {
      allVideos.forEach((video) => {
        video.pause();
        if (reset) video.currentTime = 0;
      });
    }

    function playActiveVideo(swiper) {
      const activeVideo =
        swiper.slides[swiper.activeIndex]?.querySelector(".slide-video");

      if (!activeVideo) return;

      activeVideo.play().catch(() => {});
    }

    function initFirstSlide(swiper) {
      updateNavButtons(swiper);
      updateTopicCaption(swiper.activeIndex);
      pauseAllVideos();
      playActiveVideo(swiper);
    }

    new Swiper(".topic-swiper", {
      slidesPerView: 1,
      speed: 1000,
      loop: false,
      allowTouchMove: false,
      effect: "fade",
      fadeEffect: {
        crossFade: true,
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      pagination: {
        el: ".topic-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-ctrl-next",
        prevEl: ".swiper-ctrl-prev",
      },
      on: {
        init() {
          initFirstSlide(this);
        },
        slideChangeTransitionStart() {
          updateNavButtons(this);
          updateTopicCaptionWithFade(this.activeIndex);
        },
        slideChangeTransitionEnd() {
          pauseAllVideos();
          playActiveVideo(this);
        },
      },
    });

    window.addEventListener("resize", updateCaptionFrameWidth);
  }

  /* ── Init ── */
  async function init() {
    await loadTranslations();
    initLanguageButtons();

    // Apply saved language immediately after translations load — before page-specific init
    const lang = getSavedLanguage();
    applyLanguage(lang, false);

    if (isHomepage()) initHomepage();
    if (isTopicPage()) initTopicPage();

    window.setLanguage = applyLanguage;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
