import express from 'express';
import { Client } from 'pg';

const app = express();
app.use(express.json());

// Le serveur choisira automatiquement le port du cloud, ou le 3000 en local
const PORT = process.env.PORT || 3000;

// Configuration flexible : utilise l'URL du Cloud ou les identifiants Termux locaux
const configurationDb = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { database: 'tontinedb', user: 'u0_a454' };

const clientEnregistre = new Client(configurationDb);
clientEnregistre.connect();

// 1. ROUTE POUR CRÉER UN CERCLE
app.post('/creer-cercle', async (req, res) => {
    const { nom, montant } = req.body;
    if (!nom || !montant) {
        return res.status(400).json({ erreur: "Veuillez fournir un nom et un montant." });
    }
    const codeUnique = "tnt-" + Math.floor(1000 + Math.random() * 9000);
    try {
        const requeteSql = 'INSERT INTO cercles(nom_cercle, montant_cotisation, code_invitation) VALUES($1, $2, $3)';
        await clientEnregistre.query(requeteSql, [nom, montant, codeUnique]);
        
        // L'adresse s'adaptera automatiquement au nom de ton site internet !
        const domaine = req.get('host');
        const lienApplication = `https://${domaine}/rejoindre/${codeUnique}`;
        const texteMessage = `Salut ! Rejoins ma tontine "${nom}" (${montant} F/mois). Clique ici : ${lienApplication}`;
        const lienWhatsApp = `https://wa.me/?text=${encodeURIComponent(texteMessage)}`;
        
        res.json({ succes: true, codeUnique, lienApplication, lienWhatsApp });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ erreur: "Erreur lors de la sauvegarde." });
    }
});

// 2. ROUTE POUR REJOINDRE UN CERCLE
app.get('/rejoindre/:code', async (req, res) => {
    const codeUnique = req.params.code;
    try {
        const requeteSql = 'SELECT * FROM cercles WHERE code_invitation = $1';
        const resultatDb = await clientEnregistre.query(requeteSql, [codeUnique]);
        if (resultatDb.rows.length === 0) {
            return res.status(404).send("<h1>❌ Lien invalide ou tontine introuvable</h1>");
        }
        const cercle = resultatDb.rows[0];
        res.send(`
            <h1>🎉 Bienvenue dans la tontine !</h1>
            <p>Tu es sur le point de rejoindre : <strong>${cercle.nom_cercle}</strong></p>
            <p>Montant de la cotisation : <strong>${cercle.montant_cotisation} FCFA / mois</strong></p>
            <button onclick="alert('Inscription validée !')">Confirmer mon inscription</button>
        `);
    } catch (erreur) {
        console.error(erreur);
        res.status(500).send("Erreur de lecture de la base de données.");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Application en ligne sur le port ${PORT}`);
});
