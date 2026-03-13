/* ==========================================================================
   Julypool — Navigation (hamburger + dropdowns + header scroll)
   ========================================================================== */

(function () {
  "use strict";

  const hamburger = document.querySelector(".hamburger-btn");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileClose = document.querySelector(".mobile-menu-close");
  const header = document.querySelector(".site-header");
  const dropdownTriggers = document.querySelectorAll(".mobile-dropdown-trigger");

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      mobileMenu.classList.add("open");
      document.body.classList.add("menu-open");
    });
  }

  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      document.body.classList.remove("menu-open");
    });
  }

  // Close on overlay click
  if (mobileMenu) {
    mobileMenu.addEventListener("click", (e) => {
      if (e.target === mobileMenu) {
        mobileMenu.classList.remove("open");
        document.body.classList.remove("menu-open");
      }
    });
  }

  // Mobile accordion dropdowns
  dropdownTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const parent = trigger.parentElement;
      const isOpen = parent.classList.contains("open");

      // Close all others
      document.querySelectorAll(".mobile-dropdown.open").forEach((d) => {
        if (d !== parent) d.classList.remove("open");
      });

      parent.classList.toggle("open", !isOpen);
    });
  });

  // Header scroll effect
  if (header) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 80) {
            header.classList.add("scrolled");
          } else {
            header.classList.remove("scrolled");
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // Close mobile menu on resize above 768px
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && mobileMenu) {
      mobileMenu.classList.remove("open");
      document.body.classList.remove("menu-open");
    }
  });
})();
