"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const clientEnregistre = new pg_1.Client({
    database: 'tontinedb',
    user: 'u0_a454'
});
clientEnregistre.connect();
app.post('/creer-cercle', async (req, res) => {
    const { nom, montant } = req.body;
    if (!nom || !montant) {
        return res.status(400).json({ erreur: "Veuillez fournir un nom et un montant." });
    }
    const codeUnique = "tnt-" + Math.floor(1000 + Math.random() * 9000);
    try {
        const requeteSql = 'INSERT INTO cercles(nom_cercle, montant_cotisation, code_invitation) VALUES($1, $2, $3)';
        await clientEnregistre.query(requeteSql, [nom, montant, codeUnique]);
        const lienApplication = `http://localhost:3000/rejoindre/${codeUnique}`;
        const texteMessage = `Salut ! Rejoins ma tontine "${nom}" (${montant} F/mois). Clique ici : ${lienApplication}`;
        const lienWhatsApp = `https://wa.me/?text=${encodeURIComponent(texteMessage)}`;
        console.log(`💾 Cercle "${nom}" sauvegardé dans PostgreSQL !`);
        res.json({ succes: true, codeUnique, lienApplication, lienWhatsApp });
    }
    catch (erreur) {
        console.error(erreur);
        res.status(500).json({ erreur: "Erreur lors de la sauvegarde." });
    }
});
app.get('/rejoindre/:code', async (req, res) => {
    const codeUnique = req.params.code;
    try {
        const requeteSql = 'SELECT * FROM cercles WHERE code_invitation = $1';
        const resultatDb = await clientEnregistre.query(requeteSql, [codeUnique]);
        if (resultatDb.rows.length === 0) {
            return res.status(404).send("<h1>❌ Lien invalide ou tontine introuvable</h1>");
        }
        const cercle = resultatDb.rows[0];
        console.log(`🤝 Lecture depuis la DB pour la tontine "${cercle.nom_cercle}"`);
        res.send(`
            <h1>🎉 Bienvenue dans la tontine ! (Données Réelles)</h1>
            <p>Tu es sur le point de rejoindre : <strong>${cercle.nom_cercle}</strong></p>
            <p>Montant de la cotisation : <strong>${cercle.montant_cotisation} FCFA / mois</strong></p>
            <button onclick="alert('Inscription validée !')">Confirmer mon inscription</button>
        `);
    }
    catch (erreur) {
        console.error(erreur);
        res.status(500).send("Erreur de lecture de la base de données.");
    }
});
app.listen(3000, () => {
    console.log("🚀 Serveur connecté à PostgreSQL et démarré sur le port 3000");
});
