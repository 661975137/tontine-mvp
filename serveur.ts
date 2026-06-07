import express from 'express';
import { Pool } from 'pg';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/tontine',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Route d'accueil : Création de tontine
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Créer une Tontine</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f9; padding: 20px; margin: 0; }
                .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: inline-block; max-width: 400px; width: 100%; box-sizing: border-box; text-align: left; }
                h1 { color: #2ecc71; text-align: center; margin-top: 0; font-size: 24px; }
                label { font-weight: bold; color: #34495e; display: block; margin-top: 15px; }
                input, select { width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
                button { background-color: #2ecc71; color: white; border: none; padding: 14px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; width: 100%; margin-top: 25px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🚀 Nouvelle Tontine</h1>
                <label for="nom">🎯 Nom du cercle</label>
                <input type="text" id="nom" placeholder="Ex: Tontine Flash..." required>
                <label for="montant">💰 Montant de la cotisation (FCFA)</label>
                <input type="number" id="montant" placeholder="Ex: 25000" required>
                <label for="periode">📅 Période des rotations</label>
                <select id="periode">
                    <option value="Semaine">Par Semaine</option>
                    <option value="Quinzaine">Par Quinzaine</option>
                    <option value="Mois" selected>Par Mois</option>
                </select>
                <label for="limite">👥 Nombre max de participants</label>
                <input type="number" id="limite" value="5" min="2" required>
                <button onclick="creerTontine()">Créer le cercle</button>
            </div>
            <script>
                async function creerTontine() {
                    const nom = document.getElementById('nom').value.trim();
                    const montant = document.getElementById('montant').value;
                    const periode = document.getElementById('periode').value;
                    const limite = document.getElementById('limite').value;
                    if(!nom || !montant || !limite) return alert("Remplis tout !");
                    const response = await fetch('/creer-cercle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nom, montant: parseInt(montant), periode, limite: parseInt(limite) })
                    });
                    const data = await response.json();
                    if(data.codeUnique) window.location.href = '/cercle/' + data.codeUnique;
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/creer-cercle', async (req, res) => {
    const { nom, montant, periode, limite } = req.body;
    const codeUnique = 'tnt-' + Math.floor(1000 + Math.random() * 9000);
    try {
        await pool.query(
            'INSERT INTO cercles (nom_cercle, montant_cotisation, code_invitation, periode, limite_participants) VALUES ($1, $2, $3, $4, $5)',
            [nom, montant, codeUnique, periode || 'Mois', limite || 10]
        );
        res.json({ codeUnique });
    } catch (err) { res.status(500).json({ error: "Erreur" }); }
});

// Page de paiement Checkout FedaPay Directe
app.get('/rejoindre/:code', async (req, res) => {
    const code = req.params.code;
    try {
        const cercleRes = await pool.query('SELECT * FROM cercles WHERE code_invitation = $1', [code]);
        if (cercleRes.rows.length === 0) return res.send("<h1>❌ Tontine introuvable</h1>");
        const cercle = cercleRes.rows[0];

        const countRes = await pool.query('SELECT COUNT(*) FROM participants WHERE code_invitation = $1', [code]);
        const nbInscrits = parseInt(countRes.rows[0].count);
        const placesDisponibles = cercle.limite_participants - nbInscrits;

        if (placesDisponibles <= 0) {
            return res.send(`<div style="font-family:Arial; text-align:center; padding:50px;"><h1>🛑 Tontine complète !</h1><br><a href="/cercle/${code}">📊 Voir le tableau de bord</a></div>`);
        }

        const totalCalculé = Math.round(cercle.montant_cotisation * 1.01);

        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Rejoindre la tontine</title>
                <script src="https://cdn.fedapay.com/checkout.js?v=1.1.7"></script>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f9; padding: 20px; }
                    .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: inline-block; max-width: 400px; width: 100%; text-align: left; box-sizing: border-box; }
                    input { width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-size: 16px; }
                    #embed-payment { background-color: #e74c3c; color: white; border: none; padding: 14px; border-radius: 6px; font-weight: bold; width: 100%; font-size: 16px; cursor: pointer; text-align: center; display: block; text-decoration: none; }
                    .price-box { background: #fef9e7; border-left: 5px solid #f1c40f; padding: 12px; margin-bottom: 20px; border-radius: 6px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1 style="text-align:center; color:#e74c3c; margin-top:0;">👋 Inscription</h1>
                    <p>Cercle : <strong>${cercle.nom_cercle}</strong></p>
                    
                    <div class="price-box">
                        💰 Cotisation de base : <strong>${cercle.montant_cotisation} FCFA</strong><br>
                        ⚡ Frais de traitement (1%) : <strong>${Math.round(cercle.montant_cotisation * 0.01)} FCFA</strong><br>
                        🛒 Total à régler : <strong style="color:#e67e22;">${totalCalculé} FCFA</strong>
                    </div>

                    <p>👥 Places disponibles : <strong>${placesDisponibles} / ${cercle.limite_participants}</strong></p>
                    
                    <label for="prenom" style="font-weight:bold;">Ton prénom :</label>
                    <input type="text" id="prenom" placeholder="Entre ton prénom ici..." required>
                    
                    <button id="embed-payment">🚀 Valider et Payer avec FedaPay</button>
                </div>

                <script>
                    const boutonPaiement = document.getElementById('embed-payment');
                    
                    boutonPaiement.addEventListener('click', function() {
                        const prenom = document.getElementById('prenom').value.trim();
                        if (!prenom) return alert("S'il te plaît, entre ton prénom !");

                        // Lancement du widget d'intégration FedaPay avec clé publique générique (Sandbox/Live automatique)
                        FedaPay.init('#embed-payment', {
                            public_key: 'pk_sandbox_w-H8Fh8nL3j5A6c7D8e9R0z1', // Remplaçable par ta clé pk_live dans ton interface FedaPay
                            transaction: {
                                amount: ${totalCalculé},
                                description: 'Cotisation Tontine - ' + prenom
                            },
                            customer: {
                                firstname: prenom,
                                email: prenom.toLowerCase() + '@tontine.local'
                            },
                            onComplete: async function(response) {
                                if (response.status === 'approved' || response.status === 'successful') {
                                    // Le paiement est un succès ! On effectue l'inscription immédiate sur notre serveur
                                    const inscriptionRes = await fetch('/valider-inscription-directe', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ nom: prenom, code: '${code}' })
                                    });
                                    const data = await inscriptionRes.json();
                                    if (data.success) {
                                        alert("🎉 Paiement approuvé ! Bienvenue dans la tontine.");
                                        window.location.href = '/cercle/${code}';
                                    }
                                } else {
                                    alert("⏳ Statut du paiement : " + response.status);
                                }
                            }
                        });
                    });
                </script>
            </body>
            </html>
        `);
    } catch (err) { res.status(500).send("Erreur serveur"); }
});

// API de validation après succès du widget FedaPay Checkout
app.post('/valider-inscription-directe', async (req, res) => {
    const { nom, code } = req.body;
    try {
        const check = await pool.query('SELECT * FROM participants WHERE UPPER(nom_participant) = UPPER($1) AND code_invitation = $2', [nom, code]);
        if (check.rows.length === 0) {
            await pool.query('INSERT INTO participants (nom_participant, code_invitation, a_paye_periode) VALUES ($1, $2, TRUE)', [nom, code]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Erreur d'écriture BDD" }); }
});

app.post('/toggle-paiement', async (req, res) => {
    const { nom, code } = req.body;
    try {
        await pool.query('UPDATE participants SET a_paye_periode = NOT a_paye_periode WHERE nom_participant = $1 AND code_invitation = $2', [nom, code]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Erreur" }); }
});

app.post('/lancer-tirage/:code', async (req, res) => {
    const code = req.params.code;
    try {
        const participantsRes = await pool.query('SELECT id FROM participants WHERE code_invitation = $1 AND ordre_passage IS NULL', [code]);
        if(participantsRes.rows.length === 0) return res.status(400).json({ error: "Déjà effectué." });
        let ids = participantsRes.rows.map(r => r.id);
        for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        for (let i = 0; i < ids.length; i++) {
            await pool.query('UPDATE participants SET ordre_passage = $1 WHERE id = $2', [i + 1, ids[i]]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Erreur" }); }
});

// Tableau de bord
app.get('/cercle/:code', async (req, res) => {
    const code = req.params.code;
    try {
        const cercleRes = await pool.query('SELECT * FROM cercles WHERE code_invitation = $1', [code]);
        if (cercleRes.rows.length === 0) return res.send("<h1>❌ Tontine introuvable</h1>");
        const cercle = cercleRes.rows[0];

        const participantsRes = await pool.query('SELECT nom_participant, a_paye_periode FROM participants WHERE code_invitation = $1 ORDER BY id ASC', [code]);
        const participants = participantsRes.rows;

        const calendrierRes = await pool.query('SELECT nom_participant FROM participants WHERE code_invitation = $1 AND ordre_passage IS NOT NULL ORDER BY ordre_passage ASC', [code]);
        const ordreTirage = calendrierRes.rows.map(r => r.nom_participant);

        let lignesTableau = '';
        participants.forEach((p, index) => {
            const badgeColor = p.a_paye_periode ? '#2ecc71' : '#e74c3c';
            const badgeText = p.a_paye_periode ? '🟢 Payé' : '🔴 En retard';
            lignesTableau += `<tr><td style="font-weight:bold; color:#7f8c8d; width:40px;">${index + 1}</td><td>👤 ${p.nom_participant}</td><td><span onclick="switchPaiement('${p.nom_participant}')" style="background:${badgeColor}; color:white; padding:5px 10px; border-radius:20px; font-size:12px; font-weight:bold; cursor:pointer; display:inline-block;">${badgeText}</span></td></tr>`;
        });

        let sectionTirage = '';
        let boutonTirageHtml = `<button class="btn-action" style="background:#f39c12;" onclick="lancerLeTirage()">🎲 Lancer le tirage au sort</button>`;

        if (ordreTirage.length > 0) {
            boutonTirageHtml = `<div style="text-align:center; color:#27ae60; font-weight:bold; margin-top:15px; font-size:15px;">🔒 Ordre de tirage verrouillé en Base de données Cloud</div>`;
            sectionTirage = `<h3>📅 Calendrier des Bénéficiaires :</h3><div style="background:#fef9e7; padding:15px; border-radius:8px; border-left:5px solid #f39c12; margin-bottom:20px;">`;
            ordreTirage.forEach((nom, index) => {
                sectionTirage += `🔹 <strong>${cercle.periode} ${index + 1}</strong> : ${nom} (Gagne ${participants.length * cercle.montant_cotisation} FCFA) <br>`;
            });
            sectionTirage += `</div>`;
        }

        let boutonWhatsAppHtml = '';
        if (participants.length < cercle.limite_participants) {
            const messageWhatsApp = encodeURIComponent(`Rejoins ma tontine "${cercle.nom_cercle}" : https://tontine-mvp.onrender.com/rejoindre/${code}`);
            boutonWhatsAppHtml = `<a class="btn-action" style="background:#25D366;" href="https://wa.me/?text=${messageWhatsApp}" target="_blank">🟢 Inviter via WhatsApp</a>`;
        } else {
            boutonWhatsAppHtml = `<div style="text-align:center; background:#e2e8f0; color:#4a5568; padding:12px; border-radius:6px; font-weight:bold; margin-top:10px;">👥 Tontine complète (${participants.length}/${cercle.limite_participants}) - Invitations fermées</div>`;
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Tableau de bord</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f9; padding: 15px; margin: 0; }
                    .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: inline-block; max-width: 450px; width: 100%; text-align: left; box-sizing: border-box; }
                    h1 { color: #2ecc71; text-align: center; margin-top:0; }
                    .info-box { background: #e8f8f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #2ecc71; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { padding: 12px; border-bottom: 1px solid #edf2f7; text-align: left; }
                    th { background-color: #f7fafc; }
                    .btn-action { display: block; text-align: center; color: white; text-decoration: none; padding: 12px; border-radius: 6px; font-weight: bold; margin-top: 10px; cursor:pointer; border:none; width:100%; font-size:16px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>📊 Tableau de bord</h1>
                    <div class="info-box">
                        🎯 Tontine : <strong>${cercle.nom_cercle}</strong><br>
                        💰 Cotisation : <strong>${cercle.montant_cotisation} FCFA / ${cercle.periode.toLowerCase()}</strong><br>
                        👥 Membres : <strong>${participants.length} / ${cercle.limite_participants}</strong>
                    </div>
                    ${sectionTirage}
                    <h3>👥 Membres et Cotisations :</h3>
                    <table>
                        <thead><tr><th>N°</th><th>Nom</th><th>Statut Période</th></tr></thead>
                        <tbody>${lignesTableau}</tbody>
                    </table>
                    ${boutonTirageHtml}
                    ${boutonWhatsAppHtml}
                    <a href="/" style="display:block; text-align:center; color:#718096; margin-top:15px; text-decoration:none; font-size:14px;">➕ Créer une autre tontine</a>
                </div>
                <script>
                    async function lancerLeTirage() {
                        if(${participants.length} < 2) return alert("Il faut au moins 2 membres !");
                        const res = await fetch('/lancer-tirage/${code}', { method: 'POST' });
                        const data = await res.json();
                        if(data.success) window.location.reload();
                    }
                    async function switchPaiement(nom) {
                        const res = await fetch('/toggle-paiement', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nom, code: '${code}' })
                        });
                        const data = await res.json();
                        if(data.success) window.location.reload();
                    }
                </script>
            </body>
            </html>
        `);
    } catch (err) { res.status(500).send("Erreur"); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`🚀 Serveur actif sur le port ${PORT}`); });
