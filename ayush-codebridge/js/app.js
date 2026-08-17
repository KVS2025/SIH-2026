/**
 * AyuSutra - Main Application Logic
 * Responsive Navigation, Toast Notifications, Modal Control & UI Enhancements
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Highlight current page in sidebar and handle smooth navigation
  initNavigation();

  // Initialize animated counter elements
  initAnimatedCounters();
});

/**
 * Responsive Sidebar Toggle & Scroll Jump Prevention
 */
function initNavigation() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navItems = document.querySelectorAll(".nav-item");
  const sidebar = document.querySelector(".sidebar");
  
  // Ensure backdrop exists
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

  // Close sidebar when clicking backdrop
  backdrop.addEventListener("click", () => {
    closeMobileSidebar();
  });

  navItems.forEach(item => {
    const href = item.getAttribute("href");
    const itemPath = href ? href.split("/").pop() : "";

    // Highlight active item
    if (itemPath === currentPath || (currentPath === "" && itemPath === "index.html")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }

    // Handle Nav Item Click
    item.addEventListener("click", (e) => {
      // 1. Prevent jump to top / page reload if user clicks current active page link
      if (itemPath === currentPath || (currentPath === "" && itemPath === "index.html")) {
        e.preventDefault();
        // If sidebar is open on mobile, just close it gently without scrolling
        closeMobileSidebar();
        return;
      }

      // 2. If navigating to a different page on mobile, close sidebar first
      closeMobileSidebar();
    });
  });
}

function toggleMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  if (sidebar) sidebar.classList.toggle("mobile-open");
  if (backdrop) backdrop.classList.toggle("active");
}

function closeMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  if (sidebar) sidebar.classList.remove("mobile-open");
  if (backdrop) backdrop.classList.remove("active");
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
  navigator.clipboard.writeText(text).then(() => {
    window.showToast(successMessage, "success");
  }).catch(err => {
    window.showToast("Failed to copy text", "error");
  });
};

/**
 * Modal Manager
 */
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
};

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
