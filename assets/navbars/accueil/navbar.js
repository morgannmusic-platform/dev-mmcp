(async function () {
    const NAVBAR_HTML = 'assets/navbars/accueil/navbar.html';
    const NAVBAR_CSS = 'assets/navbars/accueil/navbar.css';

    function loadCSS(href) {
        if (document.querySelector(`link[href="${href}"]`)) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
    }

    async function loadNavbarHTML() {
        try {
            const res = await fetch(NAVBAR_HTML);
            if (!res.ok) throw new Error('Navbar HTML non trouvé');
            const html = await res.text();
            document.body.insertAdjacentHTML('afterbegin', html);
        } catch (e) {
            console.error('Erreur chargement navbar', e);
        }
    }

    function initNavbar() {
        const navbar = document.querySelector('.mdcp-navbar');
        if (!navbar) return;
        const menuToggle = document.querySelector('.mdcp-menu-toggle');
        const navLinksContainer = document.querySelector('.mdcp-nav-links');

        // 1. Classe scrolled au défilement
        function onScroll() {
            if (window.scrollY > 1) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        window.addEventListener('scroll', onScroll);
        onScroll();

        // 2. Menu Hamburger pour mobile
        if (menuToggle && navLinksContainer) {
            const setMenuState = (isOpen) => {
                navLinksContainer.classList.toggle('active', isOpen);
                menuToggle.classList.toggle('is-open', isOpen);
                menuToggle.setAttribute('aria-expanded', String(isOpen));
                menuToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
            };

            menuToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                const willOpen = !navLinksContainer.classList.contains('active');
                setMenuState(willOpen);
            });

            navLinksContainer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => setMenuState(false));
            });

            document.addEventListener('click', (event) => {
                if (!navbar.contains(event.target)) {
                    setMenuState(false);
                }
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    setMenuState(false);
                }
            });
        }

        // 3. Surbrillance automatique des liens au scroll
        const sections = document.querySelectorAll('section[id]');
        function highlightOnScroll() {
            const scrollY = window.pageYOffset;
            sections.forEach(current => {
                const sectionHeight = current.offsetHeight;
                const sectionTop = current.offsetTop - 100;
                const sectionId = current.getAttribute('id');
                const activeLink = document.querySelector(`.mdcp-nav-links a[href*="${sectionId}"]`);

                if (activeLink) {
                    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                        activeLink.classList.add('active');
                    } else {
                        activeLink.classList.remove('active');
                    }
                }
            });
        }
        window.addEventListener('scroll', highlightOnScroll);
        highlightOnScroll();
    }

    try {
        loadCSS(NAVBAR_CSS);
        await loadNavbarHTML();
        initNavbar();
    } catch (e) {
        console.error('Erreur initialisation navbar', e);
    }
})();