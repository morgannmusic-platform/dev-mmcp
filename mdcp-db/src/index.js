export default {
    async fetch(request, env) {
        // Gestion des requêtes CORS
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
            return new Response(JSON.stringify({ error: "Méthode non autorisée" }), { status: 405 });
        }

        try {
            const data = await request.json();
            const { action, uid, email, displayName, phone, company } = data;

            if (!uid) {
                return new Response(JSON.stringify({ error: "UID requis" }), { status: 400 });
            }

            // Action 1: Récupérer les infos de l'utilisateur
            if (action === "GET_USER") {
                const { results } = await env.DB.prepare(
                    "SELECT * FROM users WHERE uid = ?"
                ).bind(uid).all();

                return new Response(JSON.stringify({ success: true, user: results[0] || null }), {
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            }

            // Action 2: Sauvegarder ou mettre à jour les infos
            if (action === "SAVE_USER") {
                await env.DB.prepare(`
          INSERT INTO users (uid, email, displayName, phone, company, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(uid) DO UPDATE SET
            email = excluded.email,
            displayName = excluded.displayName,
            phone = excluded.phone,
            company = excluded.company,
            updated_at = CURRENT_TIMESTAMP
        `).bind(uid, email || "", displayName || "", phone || "", company || "").run();

                return new Response(JSON.stringify({ success: true, message: "Profil mis à jour" }), {
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            }

            return new Response(JSON.stringify({ error: "Action inconnue" }), { status: 400 });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }
    }
};