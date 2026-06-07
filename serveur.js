const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration pour lire les données des formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulation d'une base de données locale (Synchronisée avec ta migration frais_adhesion)
let tontineDonnees = {
    nom: "KNACOM Tontine Élite",
    cotisation: 5000,       // Montant en FCFA
    fraisAdhesion: 1000,    // Ta nouvelle colonne / modèle de monétisation
    fraisService: 200,      // Frais de plateforme
    membres: []
};

// ==========================================
// 1. PAGE D'ACCUEIL / TABLEAU DE BORD DE LA TONTINE
// ==========================================
app.get('/', (req, res) => {
    const totalAcaisser = tontineDonnees.cotisation + tontineDonnees.fraisAdhesion + tontineDonnees.fraisService;

    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${tontineDonnees.nom}</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 15px; color: #333; }
            .card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { text-align: center; padding: 10px 0; }
            .brand-title { color: #2ecc71; margin: 0; font-size: 24px; font-weight: bold; }
            .amount-box { text-align: center; background: #ebfef2; padding: 15px; border-radius: 12px; margin: 15px 0; }
            .amount-main { font-size: 28px; font-weight: bold; color: #27ae60; }
            .details-list { list-style: none; padding: 0; margin: 15px 0; }
            .details-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e0e0e0; font-size: 15px; }
            .btn-pay { display: block; width: 100%; background: #2ecc71; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; text-align: center; text-decoration: none; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); }
            .btn-pay:active { transform: scale(0.98); }
            
            /* Style du bouton Premium WhatsApp */
            .whatsapp-card { background: #ffffff; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left: 5px solid #25D366; }
            .btn-whatsapp { display: inline-flex; align-items: center; justify-content: center; background: #25D366; color: white; text-decoration: none; padding: 14px 24px; font-weight: bold; border-radius: 10px; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); margin-top: 10px; width: 85%; }
        </style>
    </head>
    <body>

        <div class="header">
            <h1 class="brand-title">🪙 KNACOM FinTech</h1>
            <p style="color: #7f8c8d; margin: 5px 0 20px 0;">Gestion de Tontine Sécurisée</p>
        </div>

        <div class="card">
            <h2 style="margin-top: 0; font-size: 18px; color: #2c3e50;">${tontineDonnees.nom}</h2>
            
            <div class="amount-box">
                <span style="font-size: 13px; color: #7f8c8d; display: block;">TOTAL À PAYER (Adhésion incluse)</span>
                <span class="amount-main">${totalAcaisser.toLocaleString()} FCFA</span>
            </div>

            <ul class="details-list">
