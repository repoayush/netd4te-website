import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// NETD4TE Interactions
// --------------------

// Scroll Reveal
class ScrollReveal {
  constructor() {
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

    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }
    });
  }
}

// Mobile Menu
class MobileMenu {
  constructor() {
    this.toggle = document.getElementById('menu-toggle');
    this.menu = document.getElementById('mobile-nav');

    if (this.toggle && this.menu) {
      this.toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.menu.classList.toggle('active');
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (this.menu.classList.contains('active') && 
            !this.menu.contains(e.target) && 
            !this.toggle.contains(e.target)) {
          this.menu.classList.remove('active');
        }
      });
    }
  }
}

// Make closeMenu available globally since this script is a module
window.closeMenu = function() {
  const menu = document.getElementById('mobile-nav');
  if (menu) menu.classList.remove('active');
}

// Form Handler
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
    
    // Get form values, trim spaces, and make email lowercase to ensure perfect matching
    const nameInput = document.getElementById('name').value.trim();
    const emailInput = document.getElementById('email').value.trim().toLowerCase();

    // Hide any previous errors
    this.error.style.display = 'none';

    // 1. Check if fields are empty
    if (!nameInput || !emailInput) {
      this.error.textContent = "Please fill in all fields!";
      this.error.style.display = 'block';
      return;
    }

    // 2. Validate email format using Regular Expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      this.error.textContent = "Please enter a valid email address (e.g. name@gmail.com)!";
      this.error.style.display = 'block';
      return;
    }

    // UI Loading State
    btn.innerHTML = '<span>Saving Your Spot...</span>';
    btn.disabled = true;

    try {
      // Create a reference to a document where the ID is the exact email address
      const docRef = doc(window.db, "waitlist", emailInput);

      // Attempt to save the document. 
      // If it exists, Firebase treats this as an "update" and your rules will block it!
      await setDoc(docRef, {
        name: nameInput,
        email: emailInput,
        timestamp: serverTimestamp()
      });

      // Show success message if the database accepts it
      this.form.style.display = 'none';
      this.success.style.display = 'block';
      this.success.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: #00ff88;">You are on the list, ${nameInput}!</div>
        <div style="color: #888;">We will email you when NETD4TE goes live.</div>
      `;
      
    } catch (error) {
      console.error("Database Error: ", error);
      
      // Check if the error is our deliberate security block
      if (error.code === 'permission-denied') {
        this.error.textContent = "You're already on the waitlist with this email!";
      } else {
        this.error.textContent = "Something went wrong. Please check your connection and try again.";
      }
      
      this.error.style.display = 'block';
      
      // Reset button
      btn.innerHTML = originalBtnText;
      btn.disabled = false;
    }
  }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new ScrollReveal();
  new NavbarScroll();
  new MobileMenu();
  new FormHandler();
});

// Console Easter Egg
console.log('%c NETD4TE ', 'background: #000; color: #00f0ff; font-size: 20px; font-weight: bold; padding: 8px 16px; border: 2px solid #00f0ff; border-radius: 8px;');
console.log('%c The future of dating is being built right now. ', 'color: #ff2d95; font-size: 12px;');
console.log('%c Follow @netd4te everywhere. ', 'color: #888; font-size: 11px;');
