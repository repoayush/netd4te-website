// NETD4TE Interactions
// --------------------
// NOTE: Firebase is now loaded lazily (only when the waitlist form is actually
// submitted) instead of as a top-level import. Previously, main.js imported the
// Firebase SDK from Google's CDN at the top of the file — since this is an ES
// module, if that network request was slow, offline, or blocked (ad blockers and
// privacy-focused mobile browsers commonly block Google/Firebase domains), the
// WHOLE script silently failed to run, which took the mobile menu, nav effects,
// and scroll reveals down with it. Each piece below now also starts up
// independently, so one failing part can never freeze the rest of the page.

// Scroll Reveal
class ScrollReveal {
  constructor() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
      return;
    }
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => {
      this.observer.observe(el);
    });
  }
}

// Navbar scroll effect
class NavbarScroll {
  constructor() {
    this.nav = document.getElementById('navbar');
    if (!this.nav) return;

    const update = () => {
      if (window.scrollY > 50) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }
}

// Mobile Menu
class MobileMenu {
  constructor() {
    this.toggle = document.getElementById('menu-toggle');
    this.menu = document.getElementById('mobile-nav');
    if (!this.toggle || !this.menu) return;

    this.toggle.setAttribute('aria-expanded', 'false');

    this.open = () => {
      this.menu.classList.add('active');
      this.toggle.classList.add('active');
      this.toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    };

    this.close = () => {
      this.menu.classList.remove('active');
      this.toggle.classList.remove('active');
      this.toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    };

    this.toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.menu.classList.contains('active')) {
        this.close();
      } else {
        this.open();
      }
    });

    // Close when a link inside the menu is tapped
    this.menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => this.close());
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.menu.classList.contains('active') &&
          !this.menu.contains(e.target) &&
          !this.toggle.contains(e.target)) {
        this.close();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.menu.classList.contains('active')) {
        this.close();
      }
    });

    // Expose globally for any inline onclick="closeMenu()" still in markup
    window.closeMenu = this.close;
  }
}

// Fallback so onclick="closeMenu()" never throws even before MobileMenu initializes
window.closeMenu = window.closeMenu || function () {
  const menu = document.getElementById('mobile-nav');
  const toggle = document.getElementById('menu-toggle');
  if (menu) menu.classList.remove('active');
  if (toggle) toggle.classList.remove('active');
  document.body.classList.remove('nav-open');
};

// FAQ Accordion (faq.html)
class FaqAccordion {
  constructor() {
    this.items = document.querySelectorAll('.faq-item');
    if (!this.items.length) return;

    this.items.forEach(item => {
      const btn = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (!btn || !answer) return;

      btn.setAttribute('aria-expanded', 'false');

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close others for a cleaner single-open accordion
        this.items.forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            const otherAnswer = other.querySelector('.faq-answer');
            const otherBtn = other.querySelector('.faq-question');
            if (otherAnswer) otherAnswer.style.maxHeight = null;
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          answer.style.maxHeight = null;
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
}

// Waitlist Form Handler — Firebase is imported lazily, only on submit
class FormHandler {
  constructor() {
    this.form = document.getElementById('waitlist-form');
    this.success = document.getElementById('form-success');
    this.error = document.getElementById('form-error');

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    const btn = this.form.querySelector('button');
    const originalBtnText = btn.innerHTML;

    const nameInput = document.getElementById('name').value.trim();
    const emailInput = document.getElementById('email').value.trim().toLowerCase();

    this.error.style.display = 'none';

    if (!nameInput || !emailInput) {
      this.error.textContent = "Please fill in all fields!";
      this.error.style.display = 'block';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      this.error.textContent = "Please enter a valid email address (e.g. name@gmail.com)!";
      this.error.style.display = 'block';
      return;
    }

    btn.innerHTML = '<span>Saving Your Spot...</span>';
    btn.disabled = true;

    try {
      // Firebase is only fetched here, on demand — it can no longer block
      // the hamburger menu, nav, or scroll reveals if it's slow or blocked.
      const [{ doc, setDoc, serverTimestamp }] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
      ]);

      if (!window.db) {
        throw new Error('db-unavailable');
      }

      const docRef = doc(window.db, "waitlist", emailInput);
      await setDoc(docRef, {
        name: nameInput,
        email: emailInput,
        timestamp: serverTimestamp()
      });

      this.form.style.display = 'none';
      this.success.style.display = 'block';
      this.success.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: #00ff88;">You are on the list, ${nameInput}!</div>
        <div style="color: #888;">We will email you when NETD4TE goes live.</div>
      `;

    } catch (error) {
      console.error("Database Error: ", error);

      if (error && error.code === 'permission-denied') {
        this.error.textContent = "You're already on the waitlist with this email!";
      } else {
        this.error.textContent = "Something went wrong. Please check your connection and try again.";
      }

      this.error.style.display = 'block';
      btn.innerHTML = originalBtnText;
      btn.disabled = false;
    }
  }
}

// Smooth scroll for same-page anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

// Initialize — each component starts independently. If one throws, the
// others still run instead of the whole page losing interactivity.
function boot() {
  const components = [ScrollReveal, NavbarScroll, MobileMenu, FaqAccordion, FormHandler];
  components.forEach(Component => {
    try {
      new Component();
    } catch (err) {
      console.error(`NETD4TE: ${Component.name} failed to start`, err);
    }
  });
  try {
    initSmoothScroll();
  } catch (err) {
    console.error('NETD4TE: smooth scroll failed to start', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Console Easter Egg
console.log('%c NETD4TE ', 'background: #000; color: #00f0ff; font-size: 20px; font-weight: bold; padding: 8px 16px; border: 2px solid #00f0ff; border-radius: 8px;');
console.log('%c The future of dating is being built right now. ', 'color: #ff2d95; font-size: 12px;');
console.log('%c Follow @netd4te everywhere. ', 'color: #888; font-size: 11px;');

// Dynamically load Lenis Smooth Scroll
const lenisScript = document.createElement('script');
lenisScript.src = "https://unpkg.com/lenis@1.1.9/dist/lenis.min.js";
lenisScript.onload = () => {
  if (window.Lenis) {
    const lenis = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
};
document.body.appendChild(lenisScript);
