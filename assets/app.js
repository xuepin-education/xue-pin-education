(function () {
  const data = window.SITE_DATA;
  const page = document.body.dataset.page || "home";
  const storedLang = localStorage.getItem("siteLang");
  let lang = storedLang || data.defaultLang || "zh";
  let statsHaveAnimated = false;
  let statsObserver = null;
  let headingRevealObserver = null;
  let trustCarouselCleanup = () => {};
  let daycareCarouselCleanup = () => {};
  let courseCarouselCleanup = () => {};

  const text = (value) => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.zh || value.en || "";
  };

  const copyByPath = (path) => {
    return path.split(".").reduce((current, key) => current && current[key], data.copy);
  };

  const create = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  };

  const renderBrand = () => {
    document.querySelectorAll("[data-brand-home]").forEach((brand) => {
      brand.innerHTML = "";
      brand.setAttribute("aria-label", text(data.brand.name));
      const logo = create("img", "brand-logo");
      logo.src = data.brand.logo;
      logo.alt = text(data.brand.logoAlt);
      logo.width = 58;
      logo.height = 70;
      logo.decoding = "async";
      const words = create("span", "brand-words");
      words.append(create("strong", "", text(data.brand.name)));
      words.append(create("small", "", text(data.brand.tagline)));
      brand.append(logo, words);
    });
    document.querySelectorAll("[data-hero-logo]").forEach((logo) => {
      logo.src = data.brand.logo;
      logo.alt = text(data.brand.logoAlt);
    });
  };

  const renderNav = () => {
    document.querySelectorAll("[data-nav]").forEach((nav) => {
      nav.innerHTML = "";
      const items = nav.hasAttribute("data-home-nav") ? data.homeNav : data.nav;
      items.forEach((item) => {
        const isActive = item.page ? item.page === page : item.href === "#home";
        const link = create("a", isActive ? "active" : "", text(item.label));
        link.href = item.href;
        nav.append(link);
      });
    });
  };

  const renderAdvisors = () => {
    const target = document.querySelector("[data-advisors]");
    if (!target) return;
    target.innerHTML = "";
    data.advisorGroups.forEach((group) => {
      const branch = create("section", "advisor-group");
      const links = create("div", "advisor-links");
      group.advisors.forEach((advisor) => {
        const link = create("a", "advisor-pill");
        link.href = advisor.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.append(create("strong", "", text(advisor.name)), create("span", "", advisor.phone));
        links.append(link);
      });
      branch.append(create("h2", "advisor-branch", text(group.branch)), links);
      target.append(branch);
    });
  };

  const renderCopy = () => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = text(copyByPath(element.dataset.i18n));
    });
    document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
      button.textContent = lang === "zh" ? "EN" : "中文";
      button.setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换到中文");
    });
  };

  const renderHeadingMotion = () => {
    const trustHeading = document.querySelector("[data-text-reveal]");
    const trustTitle = trustHeading && trustHeading.querySelector(".trust-reveal-title");

    if (headingRevealObserver) {
      headingRevealObserver.disconnect();
      headingRevealObserver = null;
    }

    if (trustHeading && trustTitle) {
      const titleText = text(data.copy.home.trust.title);
      trustTitle.innerHTML = "";
      trustTitle.setAttribute("aria-label", titleText);
      Array.from(titleText).forEach((character, index) => {
        const span = create("span", "reveal-char", character === " " ? "\u00a0" : character);
        span.setAttribute("aria-hidden", "true");
        span.style.setProperty("--char-index", String(index));
        trustTitle.append(span);
      });

      trustHeading.classList.remove("is-revealed");
      const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion || typeof window.IntersectionObserver !== "function") {
        trustHeading.classList.add("is-revealed");
      } else {
        headingRevealObserver = new IntersectionObserver((entries, observer) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          trustHeading.classList.add("is-revealed");
          observer.disconnect();
          headingRevealObserver = null;
        }, { threshold: 0.35 });
        headingRevealObserver.observe(trustHeading);
      }
    }

    const primaryTitle = text(data.copy.home.process.title);
    const alternateTitle = lang === "zh" ? data.copy.home.process.title.en : data.copy.home.process.title.zh;
    document.querySelectorAll("[data-progress-marquee-track]").forEach((track) => {
      track.innerHTML = "";
      const group = create("span", "progress-marquee-group");
      for (let index = 0; index < 3; index += 1) {
        const item = create("span", "progress-marquee-item", `${primaryTitle} · ${alternateTitle}`);
        group.append(item);
      }
      track.append(group, group.cloneNode(true));
    });
  };

  const syncMotionVisibility = () => {
    document.documentElement.classList.toggle("motion-paused", document.hidden);
  };

  const setStatValue = (element, value) => {
    element.textContent = String(Math.round(value));
  };

  const showFinalStats = (target) => {
    statsHaveAnimated = true;
    target.querySelectorAll("[data-stat-value]").forEach((element) => {
      setStatValue(element, Number(element.dataset.statValue));
    });
  };

  const animateStatValue = (element, target, delay) => {
    window.setTimeout(() => {
      const startedAt = window.performance.now();
      const duration = 1500;
      const tick = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setStatValue(element, target * eased);
        if (progress < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    }, delay);
  };

  const revealStats = (target) => {
    statsHaveAnimated = true;
    target.querySelectorAll("[data-stat-value]").forEach((element, index) => {
      animateStatValue(element, Number(element.dataset.statValue), index * 90);
    });
  };

  const observeStats = (target) => {
    if (statsObserver) statsObserver.disconnect();
    if (statsHaveAnimated) {
      showFinalStats(target);
      return;
    }

    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof window.IntersectionObserver !== "function") {
      showFinalStats(target);
      return;
    }

    statsObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      statsObserver = null;
      revealStats(target);
    }, { threshold: 0.35 });
    statsObserver.observe(target);
  };

  const renderStats = () => {
    const target = document.querySelector("[data-stats]");
    if (!target) return;
    target.innerHTML = "";
    data.stats.forEach((item) => {
      const group = create("div", "stat-item");
      const term = create("dt", "");
      const number = create("span", "stat-number", statsHaveAnimated ? String(item.target) : "0");
      number.setAttribute("data-stat-value", String(item.target));
      term.append(number, create("span", "stat-unit", text(item.unit)));
      group.append(term, create("dd", "", text(item.label)));
      target.append(group);
    });
    observeStats(target);
  };

  const renderTrustShowcase = () => {
    const trophyTarget = document.querySelector("[data-trust-trophy]");
    const carouselTarget = document.querySelector("[data-trust-carousel]");
    const awardsTarget = document.querySelector("[data-trust-awards]");
    trustCarouselCleanup();
    if (!trophyTarget || !carouselTarget || !awardsTarget) return;

    trophyTarget.innerHTML = "";
    const trophyCopy = create("div", "trust-trophy-copy");
    trophyCopy.append(
      create("span", "trust-award-kicker", text(data.trustShowcase.label)),
      create("h3", "", text(data.trustShowcase.headline)),
      create("p", "", text(data.trustShowcase.description))
    );
    const trophyImage = create("img", "trust-trophy-image");
    trophyImage.src = data.trustShowcase.trophyImage;
    trophyImage.alt = text(data.trustShowcase.trophyAlt);
    trophyImage.decoding = "async";
    trophyTarget.append(trophyCopy, trophyImage);

    carouselTarget.innerHTML = "";
    carouselTarget.setAttribute("aria-label", lang === "zh" ? "学品奖项图片轮播" : "XP Education awards gallery");
    const slides = create("div", "trust-slides");
    const track = create("div", "trust-slide-track");
    const slideElements = [];
    const slideCount = data.trustShowcase.slides.length;
    const motionQuery = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false, addEventListener() {}, removeEventListener() {} };
    let selectedIndex = 0;
    let autoplayTimer = null;

    const selectSlide = (index) => {
      selectedIndex = (index + slideCount) % slideCount;
      track.style.transform = `translate3d(-${selectedIndex * 100}%, 0, 0)`;
      slideElements.forEach((slide, index) => {
        const isActive = index === selectedIndex;
        slide.classList.toggle("active", isActive);
        slide.tabIndex = isActive ? 0 : -1;
        slide.setAttribute("aria-current", isActive ? "true" : "false");
      });
    };

    const stopAutoplay = () => {
      if (autoplayTimer === null) return;
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (motionQuery.matches || document.hidden || slideCount < 2) return;
      autoplayTimer = window.setInterval(
        () => selectSlide(selectedIndex + 1),
        data.trustShowcase.autoplayMs
      );
    };

    const handleVisibility = () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    };

    data.trustShowcase.slides.forEach((item, index) => {
      const slide = create("button", "trust-slide");
      slide.type = "button";
      slide.setAttribute("data-carousel-next", "");
      slide.setAttribute("aria-label", lang === "zh" ? "点击查看下一张奖项图片" : "View the next award image");
      slide.style.setProperty("--slide-scale", String(item.displayScale || 1));
      const backdrop = create("span", "trust-slide-backdrop");
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.style.backgroundImage = `url("${item.image}")`;
      const image = create("img", "");
      image.src = item.image;
      image.alt = text(item.alt);
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";
      slide.append(backdrop, image);
      slide.addEventListener("click", () => {
        selectSlide(selectedIndex + 1);
        startAutoplay();
      });
      slideElements.push(slide);
      track.append(slide);
    });
    slides.append(track);
    carouselTarget.append(slides);
    slides.addEventListener("mouseenter", stopAutoplay);
    slides.addEventListener("mouseleave", startAutoplay);
    slides.addEventListener("focusin", stopAutoplay);
    slides.addEventListener("focusout", startAutoplay);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", startAutoplay);
    selectSlide(0);
    startAutoplay();

    trustCarouselCleanup = () => {
      stopAutoplay();
      slides.removeEventListener("mouseenter", stopAutoplay);
      slides.removeEventListener("mouseleave", startAutoplay);
      slides.removeEventListener("focusin", stopAutoplay);
      slides.removeEventListener("focusout", startAutoplay);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", startAutoplay);
    };

    awardsTarget.innerHTML = "";
    data.trustShowcase.awards.forEach((item) => {
      const card = create("article", "trust-award-card");
      const logo = create("figure", ["trust-award-logo", item.logoClass].filter(Boolean).join(" "));
      const image = create("img", "");
      image.src = item.image;
      image.alt = text(item.alt);
      image.loading = "lazy";
      image.decoding = "async";
      logo.append(image);
      const body = create("div", "trust-award-copy");
      body.append(
        create("span", "", text(item.name)),
        create("h3", "", text(item.headline)),
        create("p", "", text(item.detail))
      );
      card.append(logo, body);
      awardsTarget.append(card);
    });
  };

  const renderPromises = (selector, items) => {
    const target = document.querySelector(selector);
    if (!target) return;
    target.innerHTML = "";
    items.forEach((item) => {
      const row = create("article", "promise-item");
      row.append(create("h3", "", text(item.title)), create("p", "", text(item.text)));
      target.append(row);
    });
  };

  const renderPromiseShowcase = () => {
    const poster = document.querySelector("[data-promise-poster]");
    if (!poster) return;
    poster.src = data.promiseShowcase.image;
    poster.alt = text(data.promiseShowcase.alt);
    poster.loading = "lazy";
    poster.decoding = "async";
  };

  const createSubjectList = (subjects) => {
    const list = create("ul", "course-subjects");
    subjects.forEach((subject) => list.append(create("li", "", subject)));
    return list;
  };

  const createSubjectBlock = (subjects) => {
    const block = create("div", "course-subject-block");
    block.append(
      create("span", "course-subject-label", lang === "zh" ? "开设科目" : "Subjects"),
      createSubjectList(subjects)
    );
    return block;
  };

  const renderCourseNavigation = () => {
    document.querySelectorAll("[data-course-navigation]").forEach((target) => {
      target.innerHTML = "";
      data.courses.forEach((item, index) => {
        const link = create("a", index === 0 ? "active" : "", text(item.grades));
        link.href = `#course-${item.id}`;
        link.addEventListener("click", () => {
          [...target.children].forEach((child) => child.classList.remove("active"));
          link.classList.add("active");
        });
        target.append(link);
      });
    });
  };

  const renderCourseShowcase = (item) => {
    const showcase = create("div", "course-showcase");
    const viewport = create("div", "course-showcase-viewport");
    const track = create("div", "course-showcase-track");
    const counter = create("span", "course-showcase-counter");
    const slides = item.showcase.slides;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let currentIndex = 0;
    let autoplayTimer = null;

    slides.forEach((slide, index) => {
      const figure = create("figure", "course-showcase-slide");
      figure.setAttribute("aria-hidden", String(index !== 0));
      const image = create("img", "");
      image.src = slide.image;
      image.alt = text(slide.alt);
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";
      figure.append(image);
      track.append(figure);
    });

    const selectCourseShowcaseSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
      [...track.children].forEach((slide, slideIndex) => {
        slide.setAttribute("aria-hidden", String(slideIndex !== currentIndex));
      });
      counter.textContent = `${currentIndex + 1} / ${slides.length}`;
    };
    const advanceCourseShowcase = () => selectCourseShowcaseSlide(currentIndex + 1);
    const stopCourseAutoplay = () => {
      if (autoplayTimer) window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    };
    const startCourseAutoplay = () => {
      stopCourseAutoplay();
      if (!motionQuery.matches && !document.hidden) {
        autoplayTimer = window.setInterval(advanceCourseShowcase, 2000);
      }
    };
    const handleCourseVisibility = () => {
      if (document.hidden) stopCourseAutoplay();
      else startCourseAutoplay();
    };
    const handleCourseMotion = () => startCourseAutoplay();

    viewport.append(track, counter);
    showcase.append(viewport);

    const instagram = item.showcase.instagram;
    const instagramBlock = create("section", "course-instagram-post");
    instagramBlock.append(
      create("div", "course-instagram-heading", lang === "zh" ? "课堂动态" : "Classroom Post")
    );
    const instagramCard = create("div", "course-instagram-card");
    const fallback = create("div", "course-instagram-fallback");
    fallback.append(
      create("strong", "", "Instagram"),
      create("span", "", lang === "zh" ? "点击查看 5岁 6岁课程动态" : "View the Age 5 & 6 classroom post")
    );
    const frame = create("iframe", "");
    frame.src = instagram.embedUrl;
    frame.title = lang === "zh" ? "学品 5岁 6岁课程 Instagram 帖子" : "XP Education Age 5 & 6 Instagram post";
    frame.loading = "lazy";
    frame.setAttribute("allowtransparency", "true");
    frame.setAttribute("allow", "encrypted-media");
    const instagramLink = create("a", "course-instagram-link");
    instagramLink.href = instagram.url;
    instagramLink.target = "_blank";
    instagramLink.rel = "noopener";
    instagramLink.setAttribute("aria-label", lang === "zh" ? "在 Instagram 查看课程帖子" : "View course post on Instagram");
    instagramLink.dataset.label = lang === "zh" ? "在 Instagram 查看" : "View on Instagram";
    instagramCard.append(fallback, frame, instagramLink);
    instagramBlock.append(instagramCard);
    showcase.append(instagramBlock);

    viewport.addEventListener("mouseenter", stopCourseAutoplay);
    viewport.addEventListener("mouseleave", startCourseAutoplay);
    viewport.addEventListener("focusin", stopCourseAutoplay);
    viewport.addEventListener("focusout", startCourseAutoplay);
    document.addEventListener("visibilitychange", handleCourseVisibility);
    motionQuery.addEventListener("change", handleCourseMotion);
    selectCourseShowcaseSlide(0);
    startCourseAutoplay();

    courseCarouselCleanup = () => {
      stopCourseAutoplay();
      viewport.removeEventListener("mouseenter", stopCourseAutoplay);
      viewport.removeEventListener("mouseleave", startCourseAutoplay);
      viewport.removeEventListener("focusin", stopCourseAutoplay);
      viewport.removeEventListener("focusout", startCourseAutoplay);
      document.removeEventListener("visibilitychange", handleCourseVisibility);
      motionQuery.removeEventListener("change", handleCourseMotion);
    };
    return showcase;
  };

  const renderStudentProgress = () => {
    const target = document.querySelector("[data-student-progress]");
    if (!target) return;
    target.innerHTML = "";
    data.studentProgressStories.forEach((item) => {
      const poster = create("figure", "student-progress-poster");
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = text(item.alt);
      image.loading = "lazy";
      image.decoding = "async";
      poster.append(image);
      target.append(poster);
    });
  };

  const renderInstagramReels = () => {
    const target = document.querySelector("[data-instagram-reels]");
    const title = document.querySelector("[data-instagram-reels-title]");
    if (!target || !title) return;

    title.textContent = lang === "zh" ? "真实课堂与进步记录" : "Real Classes & Progress";
    target.innerHTML = "";

    data.instagramReels.forEach((item, index) => {
      const accessibleTitle = `${lang === "zh" ? "Instagram 学生进步影片" : "Instagram student progress Reel"} ${index + 1}`;
      const card = create("article", "instagram-reel-card");
      const fallback = create("div", "instagram-reel-fallback");
      fallback.append(
        create("span", "instagram-reel-mark", "Instagram"),
        create("strong", "", lang === "zh" ? "点击前往 Instagram 播放" : "Watch on Instagram")
      );

      const frame = document.createElement("iframe");
      frame.src = item.embedUrl;
      frame.title = accessibleTitle;
      frame.loading = "lazy";
      frame.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.tabIndex = -1;
      frame.setAttribute("aria-hidden", "true");
      frame.setAttribute("scrolling", "no");

      const link = create("a", "instagram-reel-link");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.dataset.label = lang === "zh" ? "在 Instagram 播放" : "Watch on Instagram";
      link.setAttribute("aria-label", accessibleTitle);

      card.append(fallback, frame, link);
      target.append(card);
    });
  };

  const renderDaycareShowcase = () => {
    const slogan = document.querySelector("[data-daycare-slogan]");
    const target = document.querySelector("[data-daycare-carousel]");
    if (!slogan || !target) return;

    daycareCarouselCleanup();
    slogan.textContent = text(data.daycareShowcase.slogan);
    target.innerHTML = "";
    target.setAttribute("aria-label", lang === "zh" ? "学品托育班图片轮播" : "XP Education daycare gallery");

    const viewport = create("div", "daycare-carousel-viewport");
    viewport.tabIndex = 0;
    const track = create("div", "daycare-slide-track");
    const counter = create("span", "daycare-carousel-count");
    const slideElements = [];
    const slideCount = data.daycareShowcase.slides.length;
    let selectedIndex = 0;
    let intervalId = null;
    let observer = null;
    let isVisible = typeof window.IntersectionObserver !== "function";
    let isPaused = false;

    const selectSlide = (index) => {
      selectedIndex = index;
      const activeIndex = selectedIndex % slideCount;
      track.style.transform = `translate3d(-${selectedIndex * 100}%, 0, 0)`;
      counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slideCount).padStart(2, "0")}`;
      slideElements.forEach((slide, slideIndex) => {
        slide.setAttribute("aria-hidden", slideIndex === activeIndex ? "false" : "true");
      });
    };

    const stopAutoplay = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };

    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startAutoplay = () => {
      if (prefersReducedMotion || isPaused || !isVisible || slideCount < 2 || intervalId !== null) return;
      intervalId = window.setInterval(() => {
        selectSlide(selectedIndex + 1);
      }, data.daycareShowcase.autoplayMs);
    };

    data.daycareShowcase.slides.forEach((item, index) => {
      const slide = create("figure", "daycare-slide");
      slide.setAttribute("aria-label", `${index + 1} / ${slideCount}: ${text(item.alt)}`);
      const image = create("img", "");
      image.src = item.image;
      image.alt = text(item.alt);
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";
      slide.append(image);
      slideElements.push(slide);
      track.append(slide);
    });

    if (slideElements[0]) {
      const firstSlideClone = slideElements[0].cloneNode(true);
      firstSlideClone.classList.add("daycare-slide-clone");
      firstSlideClone.setAttribute("aria-hidden", "true");
      track.append(firstSlideClone);
    }

    const handleTransitionEnd = () => {
      if (selectedIndex !== slideCount) return;
      track.classList.add("is-resetting");
      selectedIndex = 0;
      track.style.transform = "translate3d(0, 0, 0)";
      window.requestAnimationFrame(() => track.classList.remove("is-resetting"));
    };

    viewport.append(track);
    target.append(viewport, counter);
    selectSlide(0);
    track.addEventListener("transitionend", handleTransitionEnd);

    const pauseAutoplay = () => {
      isPaused = true;
      stopAutoplay();
    };
    const resumeAutoplay = () => {
      isPaused = false;
      startAutoplay();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    };

    viewport.addEventListener("mouseenter", pauseAutoplay);
    viewport.addEventListener("mouseleave", resumeAutoplay);
    viewport.addEventListener("focusin", pauseAutoplay);
    viewport.addEventListener("focusout", resumeAutoplay);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (typeof window.IntersectionObserver === "function") {
      observer = new IntersectionObserver((entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) startAutoplay();
        else stopAutoplay();
      }, { threshold: 0.35 });
      observer.observe(target);
    } else {
      startAutoplay();
    }

    daycareCarouselCleanup = () => {
      stopAutoplay();
      if (observer) observer.disconnect();
      viewport.removeEventListener("mouseenter", pauseAutoplay);
      viewport.removeEventListener("mouseleave", resumeAutoplay);
      viewport.removeEventListener("focusin", pauseAutoplay);
      viewport.removeEventListener("focusout", resumeAutoplay);
      track.removeEventListener("transitionend", handleTransitionEnd);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  };

  const renderCourseDetails = () => {
    const target = document.querySelector("[data-course-details]");
    if (!target) return;
    courseCarouselCleanup();
    target.innerHTML = "";
    data.courses.forEach((item, index) => {
      const card = create("article", index === 0 ? "course-detail course-feature" : "course-detail");
      card.id = `course-${item.id}`;
      const heading = create("div", "course-detail-heading");
      heading.append(create("span", "course-type", text(item.title)), create("h2", "", text(item.sectionTitle || item.grades)));
      const copy = create("div", "course-detail-copy");
      copy.append(
        heading,
        create("p", "", text(item.focus)),
        create("blockquote", "", text(item.concern)),
        createSubjectBlock(item.subjects)
      );
      card.append(copy);
      if (item.showcase) card.append(renderCourseShowcase(item));
      target.append(card);
    });
  };

  const renderSimpleList = (selector, items, className) => {
    const target = document.querySelector(selector);
    if (!target) return;
    target.innerHTML = "";
    items.forEach((item, index) => {
      const row = create("li", className || "");
      row.append(create("span", "flow-index", String(index + 1)), create("strong", "", text(item)));
      target.append(row);
    });
  };

  const renderTeachers = () => {
    const tabs = document.querySelector("[data-teacher-tabs]");
    const target = document.querySelector("[data-teachers]");
    if (!tabs || !target) return;
    tabs.innerHTML = "";
    target.innerHTML = "";

    const activeGroup = "secondary";

    const selectGroup = (groupId) => {
      tabs.querySelectorAll("[data-teacher-tab]").forEach((tab) => {
        const isSelected = tab.dataset.teacherTab === groupId;
        tab.setAttribute("aria-selected", isSelected ? "true" : "false");
        tab.tabIndex = isSelected ? 0 : -1;
      });
      target.querySelectorAll("[data-teacher-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.teacherPanel !== groupId;
      });
    };

    data.teacherGroups.forEach((group) => {
      const tab = create("button", "teacher-tab", text(group.title));
      tab.type = "button";
      tab.role = "tab";
      tab.id = `teacher-tab-${group.id}`;
      tab.dataset.teacherTab = group.id;
      tab.setAttribute("aria-controls", `teacher-panel-${group.id}`);
      tab.setAttribute("aria-selected", group.id === activeGroup ? "true" : "false");
      tab.tabIndex = group.id === activeGroup ? 0 : -1;
      tab.addEventListener("click", () => selectGroup(group.id));
      tab.addEventListener("keydown", (event) => {
        const tabList = Array.from(tabs.querySelectorAll("[data-teacher-tab]"));
        const currentIndex = tabList.indexOf(event.currentTarget);
        let nextIndex = currentIndex;

        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabList.length;
        if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabList.length) % tabList.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabList.length - 1;
        if (nextIndex === currentIndex) return;

        event.preventDefault();
        selectGroup(tabList[nextIndex].dataset.teacherTab);
        tabList[nextIndex].focus();
      });
      tabs.append(tab);

      const section = create("section", "teacher-panel");
      section.id = `teacher-panel-${group.id}`;
      section.role = "tabpanel";
      section.setAttribute("data-teacher-panel", group.id);
      section.setAttribute("aria-labelledby", tab.id);
      section.hidden = group.id !== activeGroup;

      const heading = create("div", "teacher-group-heading");
      heading.append(create("span", "eyebrow", text(group.title)), create("p", "", text(group.description)));
      const grid = create("div", "teacher-grid-inner");

      group.teachers.forEach((teacher) => {
        const card = create("figure", "teacher-poster-card");
        const image = create("img", "", "");
        image.src = teacher.image;
        image.alt = text(teacher.name);
        image.loading = "lazy";
        image.decoding = "async";
        card.append(image, create("figcaption", "visually-hidden", text(teacher.name)));
        grid.append(card);
      });

      section.append(heading);
      if (group.teachers.length) {
        section.append(grid);
      } else {
        section.append(create("p", "teacher-empty", text(group.description)));
      }
      target.append(section);
    });
  };

  const renderReviews = () => {
    const target = document.querySelector("[data-reviews]");
    if (!target) return;
    const poster = document.querySelector("[data-review-poster]");
    if (poster && data.reviewPoster) {
      poster.src = data.reviewPoster.image;
      poster.alt = text(data.reviewPoster.alt);
    }
    target.innerHTML = "";
    data.reviews.forEach((item) => {
      const card = create("figure", "review-card");
      card.append(create("blockquote", "", text(item.quote)), create("figcaption", "", text(item.source)));
      target.append(card);
    });
  };

  const renderBranches = () => {
    const target = document.querySelector("[data-branches]");
    if (!target) return;
    target.innerHTML = "";
    data.branches.forEach((branch) => {
      const card = create("article", "branch-card");
      const heading = create("header", "branch-card-heading");
      const location = create("div", "branch-location");
      const locationCopy = create("div", "branch-location-copy");
      locationCopy.append(
        create("span", "branch-location-label", text(data.copy.contactPage.locationLabel)),
        create("address", "", branch.address)
      );
      const map = create("a", "branch-map-link", text(data.copy.cta.map));
      map.href = branch.map;
      map.target = "_blank";
      map.rel = "noopener";
      map.setAttribute("aria-label", `${text(data.copy.cta.map)} · ${text(branch.name)}`);
      location.append(locationCopy, map);
      heading.append(
        create("span", "branch-card-kicker", text(data.copy.contactPage.branches.eyebrow)),
        create("h2", "", text(branch.name)),
        location
      );

      const advisorList = create("div", "branch-advisor-list");
      branch.advisors.forEach((advisor) => {
        const profile = create("article", "contact-advisor");
        const portrait = create("figure", "contact-advisor-portrait");
        const image = create("img", "");
        image.src = advisor.image;
        image.alt = text(advisor.name);
        image.loading = "lazy";
        image.decoding = "async";
        portrait.append(image);

        const details = create("div", "contact-advisor-details");
        const phone = create("a", "contact-advisor-phone", advisor.phone);
        phone.href = `tel:${advisor.phone.replace(/\D/g, "")}`;
        phone.setAttribute("aria-label", `${text(advisor.name)} ${advisor.phone}`);

        const whatsapp = create("a", "btn btn-small contact-advisor-action", text(data.copy.contactPage.advisorAction));
        whatsapp.href = advisor.url;
        whatsapp.target = "_blank";
        whatsapp.rel = "noopener";
        whatsapp.setAttribute("aria-label", `${text(data.copy.contactPage.advisorAction)} · ${text(advisor.name)}`);

        details.append(
          create("span", "contact-advisor-role", text(data.copy.contactPage.advisorRole)),
          create("h3", "", text(advisor.name)),
          phone,
          whatsapp
        );
        profile.append(portrait, details);
        advisorList.append(profile);
      });

      card.append(heading, advisorList);
      target.append(card);
    });
  };

  const renderFooter = () => {
    document.querySelectorAll("[data-footer]").forEach((footer) => {
      footer.innerHTML = "";
      const brand = create("div", "");
      brand.append(create("strong", "", text(data.brand.name)), create("p", "", text(data.brand.note)));
      footer.append(brand);
    });
  };

  const render = () => {
    renderCopy();
    renderHeadingMotion();
    renderBrand();
    renderNav();
    renderStats();
    renderTrustShowcase();
    renderPromiseShowcase();
    renderPromises("[data-teacher-standards]", data.teacherStandards);
    renderCourseNavigation();
    renderStudentProgress();
    renderInstagramReels();
    renderCourseDetails();
    renderDaycareShowcase();
    renderSimpleList("[data-daycare-flow]", data.daycareFlow, "flow-item");
    renderTeachers();
    renderReviews();
    renderBranches();
    renderFooter();
  };

  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      lang = lang === "zh" ? "en" : "zh";
      localStorage.setItem("siteLang", lang);
      render();
    });
  });

  document.addEventListener("visibilitychange", syncMotionVisibility);
  syncMotionVisibility();
  render();
})();
