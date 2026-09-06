const API_URL = "https://form.ai.dev.mm-cp.uk";

const appView = document.getElementById("app-view");

async function apiCall(action, payload = {}) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
}

function updateActiveMenu(hash) {
    document.querySelectorAll(".sidebar-item").forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === hash);
    });
}

async function router() {
    const hash = window.location.hash || "#/demandes";
    updateActiveMenu(hash);

    const [route, id] = hash.replace("#/", "").split("/");

    switch (route) {
        case "demandes":
            await renderRequests();
            break;
        case "projets":
            await renderProjects();
            break;
        case "creer-projet":
            await renderCreateProject();
            break;
        case "projet":
            await renderManageProject(id);
            break;
        case "emails":
            await renderEmails();
            break;
        default:
            appView.innerHTML = "<h2>Page non trouvée</h2>";
    }
}

// 1. Demandes de projets
async function renderRequests() {
    appView.innerHTML = "<h2>Chargement des demandes...</h2>";
    const data = await apiCall("GET_REQUESTS");
    const requests = data.requests || [];

    appView.innerHTML = `
        <h2>Demandes de projets</h2>
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Client (UID)</th>
                        <th>Titre</th>
                        <th>Type</th>
                        <th>Budget</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(r => `
                        <tr>
                            <td>#${r.id}</td>
                            <td>${r.user_uid}</td>
                            <td><strong>${r.title}</strong><br><small>${r.description || ''}</small></td>
                            <td>${r.type || 'N/A'}</td>
                            <td>${r.budget || 'N/A'}</td>
                            <td>${new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 2. Liste des projets
async function renderProjects() {
    appView.innerHTML = "<h2>Chargement des projets...</h2>";
    const data = await apiCall("GET_PROJECTS");
    const projects = data.projects || [];

    appView.innerHTML = `
        <h2>Tous les projets</h2>
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Titre</th>
                        <th>Statut</th>
                        <th>Avancement</th>
                        <th>Budget</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${projects.map(p => `
                        <tr>
                            <td>#${p.id}</td>
                            <td><strong>${p.title}</strong></td>
                            <td>${p.status}</td>
                            <td style="width: 150px;">
                                ${p.progress}%
                                <div class="progress-bar"><div class="progress-fill" style="width: ${p.progress}%"></div></div>
                            </td>
                            <td>${p.budget} €</td>
                            <td><a href="#/projet/${p.id}"><button>Gérer</button></a></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 3. Créer un projet
async function renderCreateProject() {
    const usersData = await apiCall("GET_ALL_USERS");
    const users = usersData.users || [];

    appView.innerHTML = `
        <h2>Créer un nouveau projet</h2>
        <div class="card">
            <form id="create-project-form">
                <label>Client</label>
                <select id="p-user" required>
                    <option value="">Sélectionner un utilisateur</option>
                    ${users.map(u => `<option value="${u.uid}">${u.displayName || u.email} (${u.uid})</option>`).join('')}
                </select>

                <label>Titre du projet</label>
                <input type="text" id="p-title" required>

                <label>Description</label>
                <textarea id="p-desc" rows="4"></textarea>

                <label>Budget (€)</label>
                <input type="number" id="p-budget" value="0">

                <button type="submit">Créer le projet</button>
            </form>
        </div>
    `;

    document.getElementById("create-project-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            user_uid: document.getElementById("p-user").value,
            title: document.getElementById("p-title").value,
            description: document.getElementById("p-desc").value,
            budget: parseFloat(document.getElementById("p-budget").value)
        };

        const res = await apiCall("CREATE_PROJECT", payload);
        if (res.success) {
            window.location.hash = `#/projet/${res.id}`;
        }
    });
}

// 4. Gérer un projet spécifique
async function renderManageProject(id) {
    appView.innerHTML = "<h2>Chargement du projet...</h2>";
    const data = await apiCall("GET_PROJECT_BY_ID", { id: parseInt(id) });
    const p = data.project;

    if (!p) {
        appView.innerHTML = "<h2>Projet introuvable</h2>";
        return;
    }

    appView.innerHTML = `
        <h2>Gérer le projet : ${p.title}</h2>
        <div class="card">
            <form id="update-project-form">
                <label>Titre</label>
                <input type="text" id="m-title" value="${p.title}" required>

                <label>Description</label>
                <textarea id="m-desc" rows="4">${p.description || ''}</textarea>

                <label>Statut</label>
                <select id="m-status">
                    <option value="en_cours" ${p.status === 'en_cours' ? 'selected' : ''}>En cours</option>
                    <option value="en_attente" ${p.status === 'en_attente' ? 'selected' : ''}>En attente</option>
                    <option value="termine" ${p.status === 'termine' ? 'selected' : ''}>Terminé</option>
                </select>

                <label>Avancement (%) : <span id="progress-val">${p.progress}</span>%</label>
                <input type="range" id="m-progress" min="0" max="100" value="${p.progress}" oninput="document.getElementById('progress-val').innerText = this.value">

                <label>Budget (€)</label>
                <input type="number" id="m-budget" value="${p.budget}">

                <button type="submit">Enregistrer les modifications</button>
            </form>
        </div>
    `;

    document.getElementById("update-project-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            id: p.id,
            title: document.getElementById("m-title").value,
            description: document.getElementById("m-desc").value,
            status: document.getElementById("m-status").value,
            progress: parseInt(document.getElementById("m-progress").value),
            budget: parseFloat(document.getElementById("m-budget").value)
        };

        const res = await apiCall("UPDATE_PROJECT", payload);
        if (res.success) {
            alert("Projet mis à jour avec succès !");
            renderProjects();
            window.location.hash = "#/projets";
        }
    });
}

// 5. Envoi d'emails (Brevo)
async function renderEmails() {
    appView.innerHTML = "<h2>Chargement des contacts...</h2>";
    const data = await apiCall("GET_ALL_USERS");
    const users = data.users || [];

    appView.innerHTML = `
        <h2>Envoyer un Email (Brevo)</h2>
        <div class="card">
            <form id="email-form">
                <label>Destinataire</label>
                <select id="e-to" required>
                    <option value="">Sélectionner un utilisateur</option>
                    ${users.map(u => `<option value="${u.email}">${u.displayName || u.email} (${u.email})</option>`).join('')}
                </select>

                <label>Sujet</label>
                <input type="text" id="e-subject" required>

                <label>Contenu du message (HTML autorisé)</label>
                <textarea id="e-content" rows="6" required></textarea>

                <button type="submit">Envoyer l'email</button>
            </form>
        </div>
    `;

    document.getElementById("email-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            to: document.getElementById("e-to").value,
            subject: document.getElementById("e-subject").value,
            htmlContent: document.getElementById("e-content").value
        };

        const res = await apiCall("SEND_BREVO_EMAIL", payload);
        if (res.success) {
            alert("Email envoyé avec succès !");
            document.getElementById("email-form").reset();
        } else {
            alert("Erreur lors de l'envoi : " + res.error);
        }
    });
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);