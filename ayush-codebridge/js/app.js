/**
 * AyuSutra - Main Application Logic (Production Grade)
 * Responsive Navigation, Drawer Control, Mobile Bottom Navigation, Toasts & Modals
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Lucide icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Setup Responsive Navigation & Drawer
  initNavigation();

  // 3. Restore sidebar scroll position across navigation
  restoreSidebarScroll();

  // 4. Initialize animated KPI counter elements
  initAnimatedCounters();

  // 5. Global Keyboard Accessibility (Escape to close modals/drawers)
  initKeyboardShortcuts();
});

/**
 * Preserves & restores sidebar internal scroll position across page navigation
 */
function restoreSidebarScroll() {
  const sidebarNav = document.querySelector(".sidebar-nav");
  if (!sidebarNav) return;

  const savedScroll = sessionStorage.getItem("ayusutra_sidebar_scroll");
  if (savedScroll !== null) {
    sidebarNav.scrollTop = parseInt(savedScroll, 10);
  }

  sidebarNav.addEventListener("scroll", () => {
    sessionStorage.setItem("ayusutra_sidebar_scroll", sidebarNav.scrollTop);
  });
}

/**
 * Responsive Navigation (Desktop Sidebar, Off-Canvas Drawer, & Mobile Bottom Bar)
 */
function initNavigation() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navItems = document.querySelectorAll(".nav-item");
  const bottomNavItems = document.querySelectorAll(".mobile-bottom-item");
  const sidebarNav = document.querySelector(".sidebar-nav");
  
  // Ensure backdrop exists in DOM
  let backdrop = document.querySelector(".sidebar-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);
  }

  // Hamburger Toggle Button
  const toggleBtn = document.getElementById("mobile-nav-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMobileSidebar();
    });
  }

  // Close Drawer Button inside sidebar header
  const closeBtn = document.getElementById("sidebar-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeMobileSidebar();
    });
  }

  // Close sidebar when clicking backdrop
  backdrop.addEventListener("click", () => {
    closeMobileSidebar();
  });

  // Highlight Active Item in Sidebar
  navItems.forEach(item => {
    const href = item.getAttribute("href");
    const itemPath = href ? href.split("/").pop() : "";

    if (itemPath === currentPath || (currentPath === "" && itemPath === "index.html")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }

    item.addEventListener("click", (e) => {
      if (sidebarNav) {
        sessionStorage.setItem("ayusutra_sidebar_scroll", sidebarNav.scrollTop);
      }

      if (itemPath === currentPath || (currentPath === "" && itemPath === "index.html")) {
        e.preventDefault();
        closeMobileSidebar();
        return;
      }

      closeMobileSidebar();
    });
  });

  // Highlight Active Item in Mobile Bottom Bar
  bottomNavItems.forEach(item => {
    const href = item.getAttribute("href");
    const itemPath = href ? href.split("/").pop() : "";

    if (itemPath === currentPath || (currentPath === "" && itemPath === "index.html")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }

    // If clicking "More" button in bottom nav, toggle drawer
    if (item.classList.contains("mobile-bottom-more")) {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        toggleMobileSidebar();
      });
    }
  });
}

function toggleMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  const isOpen = sidebar && sidebar.classList.contains("mobile-open");

  if (isOpen) {
    closeMobileSidebar();
  } else {
    openMobileSidebar();
  }
}

function openMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  if (sidebar) sidebar.classList.add("mobile-open");
  if (backdrop) backdrop.classList.add("active");
  document.body.classList.add("scroll-locked");
}

function closeMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  if (sidebar) sidebar.classList.remove("mobile-open");
  if (backdrop) backdrop.classList.remove("active");
  document.body.classList.remove("scroll-locked");
}

/**
 * Toast Notification System
 */
window.showToast = function(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const iconName = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

/**
 * Copy string to clipboard with feedback
 */
window.copyToClipboard = function(text, successMessage = "Copied to clipboard!") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      window.showToast(successMessage, "success");
    }).catch(() => {
      fallbackCopyText(text, successMessage);
    });
  } else {
    fallbackCopyText(text, successMessage);
  }
};

function fallbackCopyText(text, successMessage) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    window.showToast(successMessage, "success");
  } catch (err) {
    window.showToast("Failed to copy text", "error");
  }
  document.body.removeChild(textArea);
}

/**
 * Modal Manager
 */
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.classList.add("scroll-locked");
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.classList.remove("scroll-locked");
  }
};

/**
 * Global Keyboard Accessibility
 */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // Close active modals
      const activeModal = document.querySelector(".modal-overlay.active");
      if (activeModal) {
        activeModal.classList.remove("active");
        document.body.classList.remove("scroll-locked");
      }
      // Close mobile drawer
      closeMobileSidebar();
    }
  });
}

/**
 * Animated Counters for KPI numbers
 */
function initAnimatedCounters() {
  const counters = document.querySelectorAll(".counter-value");
  counters.forEach(counter => {
    const target = counter.getAttribute("data-target");
    if (!target) return;

    if (window.gsap) {
      const isPlus = target.includes("+");
      const numVal = parseInt(target.replace(/[^0-9]/g, "")) || 0;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: numVal,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          counter.innerText = Math.floor(obj.val).toLocaleString() + (isPlus ? "+" : "");
        }
      });
    } else {
      counter.innerText = target;
    }
  });
}
