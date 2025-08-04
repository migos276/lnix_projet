// Toggle Navbar et Overlay
const menuIcon = document.querySelector('.menu-icon');
const menuIconMobile = document.querySelector('.menu-icon-mobile');
const navbar = document.querySelector('.navbar');
const overlay = document.querySelector('.overlay');

function toggleNavbar() {
    navbar.classList.toggle('active');
    overlay.classList.toggle('active');
}

if (menuIcon) menuIcon.addEventListener('click', toggleNavbar);
if (menuIconMobile) menuIconMobile.addEventListener('click', toggleNavbar);

overlay.addEventListener('click', () => {
    navbar.classList.remove('active');
    overlay.classList.remove('active');
});

// Animation au scroll
const fadeIns = document.querySelectorAll('.fade-in');
const heroContent = document.querySelector('.hero .content');
const scrollTop = document.querySelector('.scroll-top');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

fadeIns.forEach(element => observer.observe(element));
observer.observe(heroContent);

// Bouton Retour en haut
window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
        scrollTop.classList.add('visible');
    } else {
        scrollTop.classList.remove('visible');
    }
});

scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});



// Animation au scroll pour la section Services
const servicesElements = document.querySelectorAll('.home-page .services .left .title, .home-page .services .left .slider, .services .right img');
servicesElements.forEach(element => observer.observe(element));

// Slider
const slides = document.querySelectorAll('.home-page .slider .slide');
const prevBtn = document.querySelector('.home-page .slider-nav .prev');
const nextBtn = document.querySelector('.home-page .slider-nav .next');
let currentSlide = 0;
let isDragging = false;
let startX;
let autoSlideInterval;
let direction = 'right';

// Fonction pour afficher un slide avec animation de translation
function showSlide(index, direction) {
    slides.forEach((slide, i) => {
        if (i === currentSlide) {
            slide.classList.remove('active');
            slide.classList.add(direction === 'right' ? 'exit-left' : 'exit-right');
        }
        if (i === index) {
            slide.classList.remove('exit-left', 'exit-right');
            slide.classList.add('active');
        }
    });
    currentSlide = index;
}

// Défilement automatique toutes les 6 secondes
function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
        const nextSlide = (currentSlide + 1) % slides.length;
        direction = 'right';
        showSlide(nextSlide, direction);
    }, 5000);
}

// Arrêter le défilement automatique lors d'une interaction
function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

// Boutons de navigation
prevBtn.addEventListener('click', () => {
    stopAutoSlide();
    const prevSlide = (currentSlide - 1 + slides.length) % slides.length;
    direction = 'left';
    showSlide(prevSlide, direction);
    startAutoSlide();
});

nextBtn.addEventListener('click', () => {
    stopAutoSlide();
    const nextSlide = (currentSlide + 1) % slides.length;
    direction = 'right';
    showSlide(nextSlide, direction);
    startAutoSlide();
});

// Gestion du dragging (grab)
const slider = document.querySelector('.home-page .slider');
slider.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX;
    stopAutoSlide();
});

slider.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Empêche le comportement par défaut (sélection de texte, etc.)
});

slider.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diffX = e.pageX - startX;
    if (diffX > 50) { // Drag vers la droite
        const prevSlide = (currentSlide - 1 + slides.length) % slides.length;
        direction = 'left';
        showSlide(prevSlide, direction);
    } else if (diffX < -50) { // Drag vers la gauche
        const nextSlide = (currentSlide + 1) % slides.length;
        direction = 'right';
        showSlide(nextSlide, direction);
    }
    startAutoSlide();
});

slider.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        startAutoSlide();
    }
});


// Animation au scroll pour la mini section CTA
const ctaElements = document.querySelectorAll('.home-page .cta-section .title, .home-page .cta-section .buttons');
ctaElements.forEach(element => observer.observe(element));


// Animation au scroll pour la section Templates
const templateElements = document.querySelectorAll('.home-page .templates .title, .home-page .templates .group-title, .home-page .templates .template, .home-page .templates .see-more');
templateElements.forEach(element => observer.observe(element));

// Gestion du modal
const templates = document.querySelectorAll('.home-page .templates .template');
const modalOverlay = document.querySelector('.home-page .modal-overlay');
const modalMedia = document.querySelector('.home-page .modal-media');
const modalDesc = document.querySelector('.home-page .modal-desc');
const modalFormat = document.querySelector('.home-page .modal-format');
const modalCreatorImg = document.querySelector('.home-page .modal-footer .creator img');
const modalCreatorName = document.querySelector('.home-page .modal-footer .creator span');
const closeModal = document.querySelector('.home-page .close-modal');

templates.forEach(template => {
    template.addEventListener('click', () => {
        const media = template.querySelector('.home-page .template-media').innerHTML;
        const desc = template.querySelector('.home-page .template-desc').textContent.replace('…', '');
        const format = template.querySelector('.home-page .template-format').textContent;

        modalMedia.innerHTML = media;
        modalDesc.textContent = desc;
        modalFormat.textContent = format;
        modalCreatorImg.src = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop";
        modalCreatorName.textContent = "John Doe";

        modalOverlay.classList.add('active');

        const modalVideo = modalMedia.querySelector('video');
        if (modalVideo) {
            modalVideo.play();
        }
    });
});

closeModal.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
    const modalVideo = modalMedia.querySelector('video');
    if (modalVideo) {
        modalVideo.pause();
    }
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        const modalVideo = modalMedia.querySelector('video');
        if (modalVideo) {
            modalVideo.pause();
        }
    }
});


// Animation au scroll pour la section Formations
const formationElements = document.querySelectorAll('.home-page .formations .section-title, .home-page .formations .formation');
formationElements.forEach(element => observer.observe(element));

// Animation au scroll pour la section Témoignages
const testimonialElements = document.querySelectorAll('.home-page .testimonials .title, .home-page .testimonials .testimonial, .home-page .testimonials .see-more');
testimonialElements.forEach(element => observer.observe(element));

// Animation au scroll pour la section Contact
const contactElements = document.querySelectorAll('.home-page .contact .contact-image, .home-page .contact .contact-form');
contactElements.forEach(element => observer.observe(element));

// Animation au scroll pour le Footer
const footerElements = document.querySelectorAll('.home-page .footer .footer-column');
footerElements.forEach(element => observer.observe(element));

