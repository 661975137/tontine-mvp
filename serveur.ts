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

// Route d'accueil basique
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

// Route 2 : Afficher la page d'invitation d'une tontine
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

// Route 3 : Traiter l'inscription du participant AVEC VERIFICATION ANTI-DOUBLON
app.post('/rejoindre-cercle', async (req, res) => {
    const { nom, code } = req.body;

    if (!nom || !code) {
        return res.status(400).json({ error: "Le nom et le code sont obligatoires" });
    }

    try {
        // 🛡️ SÉCURITÉ : On vérifie si ce nom existe déjà dans cette tontine spécifique
        const checkDuplicate = await pool.query(
            'SELECT * FROM participants WHERE UPPER(nom_participant) = UPPER($1) AND code_invitation = $2',
            [nom, code]
        );

        if (checkDuplicate.rows.length > 0) {
            return res.status(400).json({ error: "Ce prénom est déjà inscrit dans cette tontine !" });
        }

        // Si tout est bon, on insère le nouveau membre
        await pool.query(
            'INSERT INTO participants (nom_participant, code_invitation) VALUES ($1, $2)',
            [nom, code]
        );
        res.json({ success: true, message: `Félicitations ${nom}, tu as rejoint la tontine !` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de l'inscription en base de données" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur le port ${PORT}`);
});
