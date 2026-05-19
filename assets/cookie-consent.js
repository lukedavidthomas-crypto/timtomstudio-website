(function () {
  const storageKey = "timtom_cookie_consent";
  const analyticsId = window.TIMTOM_GA_ID || "";
  let memoryConsent = null;

  function readConsent() {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey));
    } catch (error) {
      return memoryConsent;
    }
  }

  function writeConsent(consent) {
    const saved = {
      necessary: true,
      analytics: Boolean(consent.analytics),
      savedAt: new Date().toISOString()
    };

    memoryConsent = saved;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch (error) {
      // Some strict browser contexts block localStorage. The banner still works for the current page view.
    }

    window.dispatchEvent(new CustomEvent("timtomCookieConsentChanged", { detail: saved }));

    if (saved.analytics) {
      loadAnalytics();
    }

    return saved;
  }

  function loadAnalytics() {
    if (!analyticsId || window.timtomAnalyticsLoaded) {
      return;
    }

    window.timtomAnalyticsLoaded = true;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(analyticsId);
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    window.gtag("js", new Date());
    window.gtag("config", analyticsId, { anonymize_ip: true });
  }

  function buildBanner() {
    const banner = document.createElement("section");
    banner.className = "cookie-banner";
    banner.setAttribute("aria-label", "Cookie notice");
    banner.hidden = true;
    banner.innerHTML = `
      <h2>Cookies and analytics</h2>
      <p>We use essential storage so this choice works. With your permission, we will also use Google Analytics to understand which pages help visitors.</p>
      <div class="cookie-actions">
        <button class="cookie-button primary" type="button" data-cookie-accept>Accept analytics</button>
        <button class="cookie-button" type="button" data-cookie-reject>Reject</button>
        <button class="cookie-button" type="button" data-cookie-manage>Manage</button>
      </div>
    `;

    const backdrop = document.createElement("div");
    backdrop.className = "cookie-backdrop";
    backdrop.hidden = true;

    const panel = document.createElement("section");
    panel.className = "cookie-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "cookie-panel-title");
    panel.hidden = true;
    panel.innerHTML = `
      <h2 id="cookie-panel-title">Cookie settings</h2>
      <p>Choose whether TimTom Studio can use analytics cookies when Google Analytics is added.</p>
      <div class="cookie-option">
        <div>
          <h3>Essential</h3>
          <span>Needed to remember your cookie choice. These are always on.</span>
        </div>
        <label class="cookie-switch" aria-label="Essential cookies always on">
          <input type="checkbox" checked disabled>
          <span class="cookie-slider"></span>
        </label>
      </div>
      <div class="cookie-option">
        <div>
          <h3>Analytics</h3>
          <span>Helps us understand page visits and improve the website. This will only run if you allow it.</span>
        </div>
        <label class="cookie-switch" aria-label="Allow analytics cookies">
          <input type="checkbox" data-cookie-analytics>
          <span class="cookie-slider"></span>
        </label>
      </div>
      <div class="cookie-actions">
        <button class="cookie-button primary" type="button" data-cookie-save>Save settings</button>
        <button class="cookie-button" type="button" data-cookie-close>Cancel</button>
      </div>
    `;

    document.body.append(banner, backdrop, panel);

    const analyticsInput = panel.querySelector("[data-cookie-analytics]");

    function hideAll() {
      banner.hidden = true;
      backdrop.hidden = true;
      panel.hidden = true;
    }

    function openPanel() {
      const consent = readConsent();
      analyticsInput.checked = Boolean(consent && consent.analytics);
      banner.hidden = true;
      backdrop.hidden = false;
      panel.hidden = false;
      panel.querySelector("[data-cookie-save]").focus();
    }

    banner.querySelector("[data-cookie-accept]").addEventListener("click", () => {
      writeConsent({ analytics: true });
      hideAll();
    });

    banner.querySelector("[data-cookie-reject]").addEventListener("click", () => {
      writeConsent({ analytics: false });
      hideAll();
    });

    banner.querySelector("[data-cookie-manage]").addEventListener("click", openPanel);

    panel.querySelector("[data-cookie-save]").addEventListener("click", () => {
      writeConsent({ analytics: analyticsInput.checked });
      hideAll();
    });

    panel.querySelector("[data-cookie-close]").addEventListener("click", () => {
      panel.hidden = true;
      backdrop.hidden = true;
      if (!readConsent()) {
        banner.hidden = false;
      }
    });

    backdrop.addEventListener("click", () => {
      panel.hidden = true;
      backdrop.hidden = true;
      if (!readConsent()) {
        banner.hidden = false;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        panel.hidden = true;
        backdrop.hidden = true;
        if (!readConsent()) {
          banner.hidden = false;
        }
      }
    });

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-cookie-settings]");
      if (trigger) {
        event.preventDefault();
        openPanel();
      }
    });

    const consent = readConsent();

    if (!consent) {
      banner.hidden = false;
    } else if (consent.analytics) {
      loadAnalytics();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildBanner);
  } else {
    buildBanner();
  }
})();
