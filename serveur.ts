import express from 'express';
import { Pool } from 'pg';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de la base de données PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/tontine',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Route d'accueil
app.get('/', (req, res) => {
    res.send('<h1>Bienvenue sur le serveur de Tontine !</h1>');
});

// Route 1 : Créer un cercle de tontine
app.post('/creer-cercle', async (req, res) => {
    const { nom, montant } = req.body;
    const codeUnique = 'tnt-' + Math.floor(1000 + Math.random() * 9000);

    try {
        await pool.query(
            'INSERT INTO cercles (nom_cercle, montant_cotisation, code_invitation) VALUES ($1, $2, $3)',
            [nom, montant, codeUnique]
        );
        res.json({
            message: "Cercle cree avec succes !",
            codeUnique: codeUnique,
            lienInvitation: `https://tontine-mvp.onrender.com/rejoindre/${codeUnique}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la creation du cercle" });
    }
});

// Route 2 : Page d'invitation pour rejoindre
app.get('/rejoindre/:code', async (req, res) => {
    const code = req.params.code;

    try {
        const result = await pool.query('SELECT * FROM cercles WHERE code_invitation = $1', [code]);

        if (result.rows.length === 0) {
            return res.send("<h1>❌ Lien invalide ou tontine introuvable</h1>");
        }

        const cercle = result.rows[0];

        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Rejoindre la Tontine</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f9; padding: 20px; }
                    .card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: inline-block; max-width: 400px; width: 100%; }
                    h1 { color: #2ecc71; }
                    input { width: 80%; padding: 10px; margin: 15px 0; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; }
                    button { background-color: #2ecc71; color: white; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; }
                    button:hover { background-color: #27ae60; }
                    .link-view { margin-top: 15px; display: block; color: #3498db; text-decoration: none; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>👋 Bienvenue dans la tontine !</h1>
                    <p>On t'invite à rejoindre le cercle : <strong>${cercle.nom_cercle}</strong></p>
                    <p>💰 Montant de la cotisation : <strong>${cercle.montant_cotisation} FCFA / mois</strong></p>
                    
                    <input type="text" id="prenom" placeholder="Entre ton prénom ici..." required>
                    <br>
                    <button onclick="rejoindreTontine()">Confirmer mon inscription</button>
                    <a class="link-view" href="/cercle/${code}">📊 Voir la liste des membres</a>
                </div>

                <script>
                    async function rejoindreTontine() {
                        const prenomInput = document.getElementById('prenom').value.trim();
                        if(!prenomInput) {
                            alert("S'il te plaît, entre ton prénom !");
                            return;
                        }

                        const response = await fetch('/rejoindre-cercle', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nom: prenomInput, code: '${code}' })
                        });

                        const data = await response.json();
                        if(data.success) {
                            alert(data.message);
                            window.location.href = '/cercle/${code}';
                        } else {
                            alert("Désolé : " + data.error);
                        }
                    }
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
});

// Route 3 : Inscription du participant
app.post('/rejoindre-cercle', async (req, res) => {
    const { nom, code } = req.body;

    if (!nom || !code) {
        return res.status(400).json({ error: "Le nom et le code sont obligatoires" });
    }

    try {
        const checkDuplicate = await pool.query(
            'SELECT * FROM participants WHERE UPPER(nom_participant) = UPPER($1) AND code_invitation = $2',
            [nom, code]
        );

        if (checkDuplicate.rows.length > 0) {
            return res.status(400).json({ error: "Ce prénom est déjà inscrit dans cette tontine !" });
        }

        await pool.query(
            'INSERT INTO participants (nom_participant, code_invitation) VALUES ($1, $2)',
            [nom, code]
        );
        res.json({ success: true, message: `Félicitations ${nom}, tu as rejoint la tontine !` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
});

// Route 4 : Tableau de bord de la tontine (CORRIGÉ ET AMÉLIORÉ)
app.get('/cercle/:code', async (req, res) => {
    const code = req.params.code;

    try {
        const cercleRes = await pool.query('SELECT * FROM cercles WHERE code_invitation = $1', [code]);
        if (cercleRes.rows.length === 0) {
            return res.send("<h1>❌ Tontine introuvable</h1>");
        }
        const cercle = cercleRes.rows[0];

        const participantsRes = await pool.query(
            'SELECT nom_participant, date_inscription FROM participants WHERE code_invitation = $1 ORDER BY date_inscription ASC',
            [code]
        );
        const participants = participantsRes.rows;

        let lignesTableau = '';
        if (participants.length === 0) {
            lignesTableau = `<tr><td colspan="2" style="text-align: center; color: #95a5a6; padding: 20px;">Aucun membre inscrit pour le moment.</td></tr>`;
        } else {
            participants.forEach((p, index) => {
                lignesTableau += `
                    <tr>
                        <td style="font-weight: bold; color: #7f8c8d; width: 40px;">${index + 1}</td>
                        <td>👤 ${p.nom_participant}</td>
                    </tr>
                `;
            });
        }

        // Préparation du lien WhatsApp automatique
        const messageWhatsApp = encodeURIComponent(`Salut ! Rejoins ma tontine "${cercle.nom_cercle}" (${cercle.montant_cotisation} FCFA/mois) en cliquant ici : https://tontine-mvp.onrender.com/rejoindre/${code}`);
        const lienWhatsApp = `https://wa.me/?text=${messageWhatsApp}`;

        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Membres du cercle</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f9; padding: 15px; margin: 0; }
                    .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: inline-block; max-width: 450px; width: 100%; box-sizing: border-box; text-align: left; margin-top: 10px; }
                    h1 { color: #2ecc71; text-align: center; margin-top: 0; font-size: 24px; }
                    .subtitle { text-align: center; color: #7f8c8d; margin-bottom: 20px; font-size: 14px; }
                    .info-box { background: #e8f8f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #2ecc71; font-size: 15px; line-height: 1.5; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #fff; }
                    th, td { padding: 12px 10px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 15px; }
                    th { background-color: #f7fafc; color: #4a5568; font-weight: bold; }
                    .btn-whatsapp { display: block; text-align: center; background: #25D366; color: white; text-decoration: none; padding: 12px; border-radius: 6px; margin-top: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                    .btn-back { display: block; text-align: center; color: #718096; text-decoration: none; padding: 10px; margin-top: 10px; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>📊 Tableau de bord</h1>
                    <div class="subtitle">Code d'invitation : <strong>${code}</strong></div>
                    
                    <div class="info-box">
                        🎯 Tontine : <strong>${cercle.nom_cercle}</strong><br>
                        💰 Cotisation : <strong>${cercle.montant_cotisation} FCFA / mois</strong><br>
                        👥 Membres inscrits : <strong>${participants.length}</strong>
                    </div>

                    <h3 style="color: #2d3748; margin-bottom: 10px; font-size: 16px;">👥 Membres de ce cercle :</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>N°</th>
                                <th>Prénom / Nom</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lignesTableau}
                        </tbody>
                    </table>

                    <a class="btn-whatsapp" href="${lienWhatsApp}" target="_blank">🟢 Inviter des membres via WhatsApp</a>
                    <a class="btn-back" href="/rejoindre/${code}">← Retour à la page d'inscription</a>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur lors de la récupération des membres");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur le port ${PORT}`);
});
