import express from 'express';
import { Pool } from 'pg';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/tontine',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Route d'accueil
app.get('/', (req, res) => {
    res.send('<h1>Bienvenue sur le serveur de Tontine !</h1>');
});

// Route 1 : Créer un cercle
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

// Route 2 : Page d'invitation
app.get('/rejoindre/:code', async (req, res) => {
    const code = req.params.code;
    try {
        const result = await pool.query('SELECT * FROM cercles WHERE code_invitation = $1', [code]);
        if (result.rows.length === 0) return res.send("<h1>❌ Tontine introuvable</h1>");
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
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>👋 Bienvenue !</h1>
                    <p>Cercle : <strong>${cercle.nom_cercle}</strong></p>
                    <p>💰 Cotisation : <strong>${cercle.montant_cotisation} FCFA / mois</strong></p>
                    <input type="text" id="prenom" placeholder="Entre ton prénom ici..." required>
                    <br>
                    <button onclick="rejoindreTontine()">Confirmer mon inscription</button>
                    <br><br><a href="/cercle/${code}" style="color:#3498db; text-decoration:none;">📊 Voir le tableau de bord</a>
                </div>
                <script>
                    async function rejoindreTontine() {
                        const prenom = document.getElementById('prenom').value.trim();
                        if(!prenom) return alert("Mets ton prénom !");
                        const res = await fetch('/rejoindre-cercle', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nom: prenom, code: '${code}' })
                        });
                        const data = await res.json();
                        if(data.success) { alert(data.message); window.location.href = '/cercle/${code}'; }
                        else { alert("Erreur : " + data.error); }
                    }
                </script>
            </body>
            </html>
        `);
    } catch (err) { res.status(500).send("Erreur"); }
});

// Route 3 : Inscription
app.post('/rejoindre-cercle', async (req, res) => {
    const { nom, code } = req.body;
    try {
        const check = await pool.query('SELECT * FROM participants WHERE UPPER(nom_participant) = UPPER($1) AND code_invitation = $2', [nom, code]);
        if (check.rows.length > 0) return res.status(400).json({ error: "Ce prénom est déjà inscrit !" });
        await pool.query('INSERT INTO participants (nom_participant, code_invitation) VALUES ($1, $2)', [nom, code]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Erreur base" }); }
});

// Route 4 : Ordre de tirage (Sauvegardé directement en mémoire ou géré à la volée pour le MVP)
let tiragesStockes: { [key: string]: string[] } = {};

app.post('/lancer-tirage/:code', (req, res) => {
    const code = req.params.code;
    const { liste } = req.body;
    
    if (!liste || liste.length === 0) return res.status(400).json({ error: "Pas de membres" });

    // Mélange Aléatoire (Fisher-Yates)
    let copieListe = [...liste];
    for (let i = copieListe.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copieListe[i], copieListe[j]] = [copieListe[j], copieListe[i]];
    }

    tiragesStockes[code] = copieListe;
    res.json({ success: true, ordre: copieListe });
});

// Route 5 : Tableau de bord complet avec Tirage au sort
app.get('/cercle/:code', async (req, res) => {
    const code = req.params.code;
    try {
        const cercleRes = await pool.query('SELECT * FROM cercles WHERE code_invitation = $1', [code]);
        if (cercleRes.rows.length === 0) return res.send("<h1>❌ Tontine introuvable</h1>");
        const cercle = cercleRes.rows[0];

        const participantsRes = await pool.query('SELECT nom_participant FROM participants WHERE code_invitation = $1', [code]);
        const pNoms = participantsRes.rows.map(r => r.nom_participant);

        let lignesTableau = '';
        pNoms.forEach((nom, index) => {
            lignesTableau += `<tr><td>${index + 1}</td><td>👤 ${nom}</td></tr>`;
        });

        // Gestion de l'affichage de l'ordre de tirage
        const ordreTirage = tiragesStockes[code] || [];
        let sectionTirage = '';
        if (ordreTirage.length > 0) {
            sectionTirage = `<h3>📅 Calendrier des Bénéficiaires :</h3><div style="background:#fef9e7; padding:15px; border-radius:8px; border-left:5px solid #f39c12; margin-bottom:20px;">`;
            ordreTirage.forEach((nom, index) => {
                sectionTirage += `🔹 <strong>Mois ${index + 1}</strong> : ${nom} (Gagne ${pNoms.length * cercle.montant_cotisation} FCFA) <br>`;
            });
            sectionTirage += `</div>`;
        }

        const messageWhatsApp = encodeURIComponent(`Rejoins ma tontine "${cercle.nom_cercle}" : https://tontine-mvp.onrender.com/rejoindre/${code}`);

        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                        💰 Cotisation : <strong>${cercle.montant_cotisation} FCFA / mois</strong><br>
                        👥 Membres : <strong>${pNoms.length}</strong>
                    </div>

                    ${sectionTirage}

                    <h3>👥 Membres inscrits :</h3>
                    <table>
                        <thead><tr><th>N°</th><th>Prénom / Nom</th></tr></thead>
                        <tbody>${lignesTableau}</tbody>
                    </table>

                    <button class="btn-action" style="background:#f39c12;" onclick="lancerLeTirage()">🎲 Lancer le tirage au sort</button>
                    <a class="btn-action" style="background:#25D366;" href="https://wa.me/?text=${messageWhatsApp}" target="_blank">🟢 Inviter via WhatsApp</a>
                    <a href="/rejoindre/${code}" style="display:block; text-align:center; color:#718096; margin-top:15px; text-decoration:none; font-size:14px;">← Retour</a>
                </div>

                <script>
                    async function lancerLeTirage() {
                        const listeMembres = ${JSON.stringify(pNoms)};
                        if(listeMembres.length < 2) return alert("Il faut au moins 2 membres pour faire un tirage !");
                        
                        const res = await fetch('/lancer-tirage/${code}', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ liste: listeMembres })
                        });
                        const data = await res.json();
                        if(data.success) {
                            alert("🎲 Tirage effectué avec succès !");
                            window.location.reload();
                        }
                    }
                </script>
            </body>
            </html>
        `);
    } catch (err) { res.status(500).send("Erreur"); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`🚀 Port ${PORT}`); });
