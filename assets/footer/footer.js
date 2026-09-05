(async function () {
    const FOOTER_HTML = 'assets/footer/footer.html';

    async function loadFooterHTML() {
        try {
            const res = await fetch(FOOTER_HTML);
            if (!res.ok) throw new Error('Footer HTML non trouvé');
            const html = await res.text();
            document.body.insertAdjacentHTML('beforeend', html);
        } catch (e) {
            console.error('Erreur chargement footer', e);
        }
    }

    // Charger styles du footer si besoin (optionnel : le footer utilise les styles globaux)
    function ensureFooterStyles() {
        // nothing for now — styles are in assets/css/style.css
    }

    ensureFooterStyles();
    // Inject footer
    await loadFooterHTML();
})();