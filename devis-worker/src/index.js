export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        if (request.method !== "POST") {
            return new Response("Méthode non autorisée", { status: 405 });
        }

        try {
            const body = await request.json();
            const { projectType, pages, features, deadline, isProBono, description } = body;

            const selectedFeatures = Array.isArray(features) ? features : [];
            const descLower = (description || "").toLowerCase();

            // 1. BARÈME PRÉCIS DES OPTIONS INDIVIDUELLES (Valeurs réelles)
            const featurePriceMap = {
                "Espace Membre & Authentification": 150,
                "Base de données Cloudflare D1/KV": 190,
                "Paiement en ligne Stripe": 180,
                "Modules IA & Cloudflare Workers": 350,
                "Tableau de bord Admin": 300,
                "Support Multilingue": 100,
                "Design & Charte Graphique Sur-Mesure": 100,
                "Optimisation SEO Avancée": 90,
                "Système de Prise de RDV / Garde": 180,
                "Hébergement & Maintenance 1 An": 150
            };

            // Calcul exact du montant des fonctionnalités choisies
            let optionsTotalPrice = 0;
            const detailedFeaturesList = selectedFeatures.map(feat => {
                const price = featurePriceMap[feat] || 110;
                optionsTotalPrice += price;
                return `- ${feat} (+${price} €)`;
            });

            // 2. BASE DE PRIX SELON LE TYPE DE STRUCTURE ET PAGES
            let baseMin = 149;
            let baseMax = 299;
            let packName = "Pack Start";

            if (projectType?.includes("SaaS")) {
                baseMin = 799;
                baseMax = 1199;
                packName = "Sur-Mesure / SaaS";
            } else if (projectType?.includes("Multi-pages")) {
                baseMin = 399;
                baseMax = 599;
                packName = "Pack Pro";
            }

            // Majoration selon le nombre de pages
            if (pages === "4 à 6 pages") {
                baseMin += 100;
                baseMax += 150;
            } else if (pages === "Plus de 6 pages") {
                baseMin += 250;
                baseMax += 350;
            }

            // 3. ANOMALIE DÉLAI / COMPLEXITÉ
            const isComplex = projectType?.includes("SaaS") || pages === "Plus de 6 pages" || selectedFeatures.length >= 4;
            const isTooShort = deadline === "Express (- 7 jours)" || deadline === "1 à 2 semaines";

            // Mots-clés pour détection solidaire vs commercial
            const profitKeywords = ["argent", "profit", "business", "vendre", "commerce", "rentable", "ebusiness", "e-commerce", "generer", "gagner"];
            const containsProfitGoal = profitKeywords.some(kw => descLower.includes(kw));

            const solidarityKeywords = ["asso", "association", "non lucratif", "pompier", "secours", "medical", "urgence", "hopital", "samu", "benevole", "humanitaire"];
            const containsSolidarityMention = solidarityKeywords.some(kw => descLower.includes(kw));

            let isSolidarity = (isProBono || containsSolidarityMention) && !containsProfitGoal;

            // Réajustement de délai si projet trop lourd pour le délai demandé
            if (isComplex && isTooShort && !isSolidarity) {
                let suggestedDeadline = selectedFeatures.length >= 6 || projectType?.includes("SaaS") ? "1 à 2 mois" : "3 à 4 semaines";

                let exactMin = baseMin + optionsTotalPrice;
                let exactMax = baseMax + optionsTotalPrice;

                return new Response(JSON.stringify({
                    adjustedDeadline: true,
                    isSolidarity: false,
                    suggestedDeadline: suggestedDeadline,
                    minPrice: exactMin,
                    maxPrice: exactMax,
                    recommendedPack: packName,
                    explanation: `Votre sélection comprend ${selectedFeatures.length} fonctionnalités spécfiques : (${selectedFeatures.join(', ')}). Pour garantir un rendu stable et performant, le délai de "${deadline}" est trop court. Nous préconisons un délai de ${suggestedDeadline}.`
                }), {
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            }

            // 4. CALCUL DU PRIX FINAL EXACT
            let finalMin = baseMin + optionsTotalPrice;
            let finalMax = baseMax + optionsTotalPrice;

            if (isSolidarity) {
                finalMin = Math.max(49, Math.round(finalMin * 0.35));
                finalMax = Math.max(99, Math.round(finalMax * 0.40));
                packName = "Tarif Solidaire / Engagement";
            }

            // 5. INSTRUCTIONS PRÉCISES POUR L'IA (LLAMA)
            const systemPrompt = `Tu es l'expert chiffrage de l'agence Morgann Dev CP (MDCP).
Ton rôle est d'expliquer au client la décomposition EXACTE de son tarif en fonction de ce qu'il a coché.

PRIX CALCULÉS :
- Fourchette finale : ${finalMin} € à ${finalMax} €
- Formule conseillée : ${packName}
- Tarif solidaire accordé : ${isSolidarity ? "OUI" : "NON"}

RÈGLES D'EXPLICATION :
1. Détailles explicitement pourquoi le prix atteint ce montant en citant LES MODULES PRÉCIS COCHÉS par l'utilisateur.
2. Si le client a coché la case solidaire mais parle de business/profit dans la description, explique clairement que la remise solidaire est refusée et que le tarif standard est appliqué.
3. Reste concis, pro et transparent.
4. Augmente le prix et le temps si le projet est très gros. Plus le projet prend du temps et des competence plus le prix augmente et vite et beaucoup beaucoup.
5. Uniquement web
RÉPONDS STRICTEMENT AU FORMAT JSON :
{
  "adjustedDeadline": false,
  "isSolidarity": ${isSolidarity},
  "minPrice": ${finalMin},
  "maxPrice": ${finalMax},
  "recommendedPack": "${packName}",
  "explanation": "Ton texte explicatif détaillé ici..."
}`;

            const userPrompt = `DÉTAIL DU CAHIER DES CHARGES :
- Type de structure : ${projectType}
- Volume de pages : ${pages}
- Délai demandé : ${deadline}
- Liste exacte des fonctionnalités cochées :
${detailedFeaturesList.length > 0 ? detailedFeaturesList.join("\n") : "- Aucune option cochée"}
- Statut Solidaire coché : ${isProBono ? "Oui" : "Non"}
- Description / Détails : ${description || "Aucune précision"}

Rédige l'explication précise.`;

            let explanationText = "";

            try {
                const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ]
                });

                let rawText = typeof aiResponse.response === "string" ? aiResponse.response : JSON.stringify(aiResponse);
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    explanationText = parsed.explanation;
                }
            } catch (e) {
                console.error("Erreur IA:", e);
            }

            // Fallback d'explication si l'IA échoue
            if (!explanationText) {
                if (isSolidarity) {
                    explanationText = "Remise solidaire appliquée (-60% environ) sur la base de votre structure à but non lucratif / d'urgence.";
                } else if (containsProfitGoal && isProBono) {
                    explanationText = "La remise solidaire est réservée aux organismes à but non lucratif. Votre projet ayant un objectif commercial, la grille tarifaire standard a été appliquée.";
                } else {
                    explanationText = `Tarif calculé pour un ${projectType} (${pages}) incluant les options sélectionnées : ${selectedFeatures.join(", ") || "aucune"}.`;
                }
            }

            return new Response(JSON.stringify({
                adjustedDeadline: false,
                isSolidarity: isSolidarity,
                minPrice: finalMin,
                maxPrice: finalMax,
                recommendedPack: packName,
                explanation: explanationText
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });

        } catch (err) {
            return new Response(JSON.stringify({
                adjustedDeadline: false,
                isSolidarity: false,
                minPrice: 399,
                maxPrice: 599,
                recommendedPack: "Pack Pro",
                explanation: "Erreur lors du calcul détaillé. Voici une estimation standard."
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }
    }
};