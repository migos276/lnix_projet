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

  
});