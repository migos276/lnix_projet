

document.addEventListener('DOMContentLoaded', () => { 


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


    // === Gestion du Bouton Voir plus (Team Section) ===
    const seeMoreBtn = document.querySelector('.about-page .see-more-btn');
    const teamCards = document.querySelectorAll('.about-page .team-card');
    let visibleCards = 8; // 2 lignes de 4 cartes initialement

    if (seeMoreBtn && teamCards.length > visibleCards) {
        for (let i = visibleCards; i < teamCards.length; i++) {
            teamCards[i].style.display = 'none';
        }

        seeMoreBtn.addEventListener('click', () => {
            const nextCards = Array.from(teamCards).slice(visibleCards, visibleCards + 4);
            nextCards.forEach(card => {
                card.style.display = 'block';
            });
            visibleCards += 4;

            if (visibleCards >= teamCards.length) {
                seeMoreBtn.style.display = 'none';
            }
        });
    }



});