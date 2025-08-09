document.addEventListener("DOMContentLoaded", () => {
  // Toggle Navbar et Overlay
  const menuIcon = document.querySelector(".menu-icon");
  const menuIconMobile = document.querySelector(".menu-icon-mobile");
  const navbar = document.querySelector(".navbar");
  const overlay = document.querySelector(".overlay");

  function toggleNavbar() {
    navbar.classList.toggle("active");
    overlay.classList.toggle("active");
  }

  if (menuIcon) menuIcon.addEventListener("click", toggleNavbar);
  if (menuIconMobile) menuIconMobile.addEventListener("click", toggleNavbar);

  overlay.addEventListener("click", () => {
    navbar.classList.remove("active");
    overlay.classList.remove("active");
  });

  // Animation au scroll
  const fadeIns = document.querySelectorAll(".fade-in");
  const heroContent = document.querySelector(".hero .content");
  const scrollTop = document.querySelector(".scroll-top");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 }
  );

  fadeIns.forEach((element) => observer.observe(element));
  observer.observe(heroContent);

  // Bouton Retour en haut
  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      scrollTop.classList.add("visible");
    } else {
      scrollTop.classList.remove("visible");
    }
  });

  scrollTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Animation au scroll pour le Footer
  const footerElements = document.querySelectorAll(
    ".ressource-page .footer .footer-column"
  );
  footerElements.forEach((element) => observer.observe(element));

  // === Gestion des Filtres ===
  const filters = document.querySelectorAll(".ressource-page .hero .filters a");
  const templates = document.querySelectorAll(".ressource-page .template-card");

  filters.forEach((filter) => {
    filter.addEventListener("click", (e) => {
      e.preventDefault();
      filters.forEach((f) => f.classList.remove("active"));
      filter.classList.add("active");

      const category = filter.textContent.toLowerCase();
      templates.forEach((template) => {
        const templateCategory = template.getAttribute("data-category");
        if (category === "tout" || category === templateCategory) {
          template.style.display = "block";
        } else {
          template.style.display = "none";
        }
      });
    });
  });

  // === Gestion de la Modale ===
  const modal = document.querySelector(".ressource-page .modal");
  const closeModal = document.querySelector(".ressource-page .close-modal");
  const viewButtons = document.querySelectorAll(".ressource-page .view-btn");

  viewButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const card = button.closest(".template-card");
      const media = card.querySelector(".media");
      const title = card.querySelector("h4").textContent;
      const desc = card.getAttribute("data-full-desc");
      const format = card.querySelector(".format").textContent;
      const creatorName = card.getAttribute("data-creator-name");
      const creatorPhoto = card.getAttribute("data-creator-photo");

      const modalMedia = document.querySelector(
        ".ressource-page .modal-content .media"
      );
      if (media.tagName === "VIDEO") {
        const videoClone = media.cloneNode(true);
        videoClone.controls = true;
        modalMedia.innerHTML = "";
        modalMedia.appendChild(videoClone);
      } else {
        modalMedia.innerHTML = `<img src="${media.src}" alt="Template Preview">`;
      }
      document.querySelector(".ressource-page .modal-content h4").textContent =
        title;
      document.querySelector(
        ".ressource-page .modal-content .description"
      ).textContent = desc;
      document.querySelector(
        ".ressource-page .modal-content .format"
      ).textContent = format;
      document.querySelector(
        ".ressource-page .modal-content .creator-info img"
      ).src = creatorPhoto;
      document.querySelector(
        ".ressource-page .modal-content .creator-info span"
      ).textContent = creatorName;
      modal.style.display = "block";
    });
  });

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // === Gestion du Bouton Voir plus ===
  const seeMoreBtn = document.querySelector(".ressource-page .see-more-btn");
  let visibleTemplates = 6; // 2 lignes de 3 templates initialement

  if (seeMoreBtn && templates.length > visibleTemplates) {
    for (let i = visibleTemplates; i < templates.length; i++) {
      templates[i].style.display = "none";
    }

    seeMoreBtn.addEventListener("click", () => {
      const nextTemplates = Array.from(templates).slice(
        visibleTemplates,
        visibleTemplates + 6
      );
      nextTemplates.forEach((template) => {
        template.style.display = "block";
      });
      visibleTemplates += 6;

      if (visibleTemplates >= templates.length) {
        seeMoreBtn.style.display = "none";
      }
    });
  }
});
