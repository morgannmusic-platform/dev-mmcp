export default {
    async fetch(request, env) {
        // En-têtes CORS
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
                status: 405,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        try {
            const data = await request.json();
            const { action } = data;

            // --- AUTH & USERS ---
            if (action === "GET_USER") {
                const { results } = await env.DB.prepare("SELECT * FROM users WHERE uid = ?").bind(data.uid).all();
                return new Response(JSON.stringify({ success: true, user: results[0] || null }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

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
                `).bind(data.uid, data.email || "", data.displayName || "", data.phone || "", data.company || "").run();

                return new Response(JSON.stringify({ success: true, message: "Profil mis à jour" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            if (action === "GET_ALL_USERS") {
                const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
                return new Response(JSON.stringify({ success: true, users: results }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // --- ENVOI DE MAIL (BREVO API) ---
            if (action === "SEND_BREVO_EMAIL") {
                const { to, subject, htmlContent } = data;
                if (!to || !subject || !htmlContent) {
                    return new Response(JSON.stringify({ error: "Destinataire, sujet et contenu requis" }), { status: 400, headers: corsHeaders });
                }

                const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "accept": "application/json",
                        "api-key": env.BREVO_API_KEY,
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        sender: { name: "Morgann Dev CP", email: "contact@mm-cp.uk" },
                        to: Array.isArray(to) ? to.map(e => ({ email: e })) : [{ email: to }],
                        subject: subject,
                        htmlContent: htmlContent
                    })
                });

                const brevoRes = await response.json();
                if (!response.ok) throw new Error(brevoRes.message || "Erreur Brevo API");

                return new Response(JSON.stringify({ success: true, brevoRes }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // --- DEMANDES DE PROJETS ---
            if (action === "GET_REQUESTS") {
                const { results } = await env.DB.prepare("SELECT * FROM project_requests ORDER BY created_at DESC").all();
                return new Response(JSON.stringify({ success: true, requests: results }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // --- PROJETS ---
            if (action === "GET_PROJECTS") {
                const { results } = await env.DB.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
                return new Response(JSON.stringify({ success: true, projects: results }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            if (action === "GET_PROJECT_BY_ID") {
                const { results } = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(data.id).all();
                return new Response(JSON.stringify({ success: true, project: results[0] || null }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            if (action === "CREATE_PROJECT") {
                const { user_uid, title, description, budget, status, progress } = data;
                const { meta } = await env.DB.prepare(`
                    INSERT INTO projects (user_uid, title, description, budget, status, progress, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `).bind(user_uid, title, description || "", budget || 0, status || "en_cours", progress || 0).run();

                return new Response(JSON.stringify({ success: true, id: meta.last_row_id }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            if (action === "UPDATE_PROJECT") {
                const { id, title, description, budget, status, progress } = data;
                await env.DB.prepare(`
                    UPDATE projects 
                    SET title = ?, description = ?, budget = ?, status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).bind(title, description, budget, status, progress, id).run();

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            return new Response(JSON.stringify({ error: "Action inconnue" }), { status: 400, headers: corsHeaders });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }
};