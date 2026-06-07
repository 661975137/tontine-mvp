const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration pour lire les données des formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// CONFIGURATION DE TON LIEN MARCHAND WAVE OFFICIEL
// ==========================================
const BASE_LIEN_WAVE = "https://pay.wave.com/m/M_keWb8PBIy-lU/c/ci/?amount=";

let tontineDonnees = {
    nom: "KNACOM Tontine Élite",
    cotisation: 5000,       
    fraisAdhesion: 1000,    
    fraisService: 200,      
    membres: []
};

// ==========================================
// 1. PAGE D'ACCUEIL / TABLEAU DE BORD
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
            .brand-title { color: #1ac6ff; margin: 0; font-size: 24px; font-weight: bold; }
            .amount-box { text-align: center; background: #e6f7ff; padding: 15px; border-radius: 12px; margin: 15px 0; }
            .amount-main { font-size: 28px; font-weight: bold; color: #1c75bc; }
            .details-list { list-style: none; padding: 0; margin: 15px 0; }
            .details-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e0e0e0; font-size: 15px; }
            
            /* Style exclusif bouton Wave officiel */
            .btn-wave { display: block; width: 100%; background: #1ac6ff; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; text-align: center; text-decoration: none; box-shadow: 0 4px 10px rgba(26, 198, 255, 0.3); box-sizing: border-box; }
            .btn-wave:active { transform: scale(0.98); }
            
            .whatsapp-card { background: #ffffff; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left: 5px solid #25D366; }
            .btn-whatsapp { display: inline-flex; align-items: center; justify-content: center; background: #25D366; color: white; text-decoration: none; padding: 14px 24px; font-weight: bold; border-radius: 10px; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); margin-top: 10px; width: 85%; }
        </style>
    </head>
    <body>

        <div class="header">
            <h1 class="brand-title">🪙 KNACOM FinTech</h1>
            <p style="color: #7f8c8d; margin: 5px 0 20px 0;">Paiement Sécurisé Wave</p>
        </div>

        <div class="card">
            <h2 style="margin-top: 0; font-size: 18px; color: #2c3e50;">${tontineDonnees.nom}</h2>
            
            <div class="amount-box">
                <span style="font-size: 13px; color: #7f8c8d; display: block;">TOTAL À PAYER (Adhésion incluse)</span>
                <span class="amount-main">${totalAcaisser.toLocaleString()} FCFA</span>
            </div>

            <ul class="details-list">
                <li class="details-item">
                    <span>Montant de la Cotisation</span>
                    <strong>${tontineDonnees.cotisation.toLocaleString()} FCFA</strong>
                </li>
                <li class="details-item" style="color: #e67e22;">
                    <span>Frais d'Adhésion (Unique)</span>
                    <strong>+ ${tontineDonnees.fraisAdhesion.toLocaleString()} FCFA</strong>
                </li>
                <li class="details-item">
                    <span>Frais de Service plateforme</span>
                    <strong>+ ${tontineDonnees.fraisService.toLocaleString()} FCFA</strong>
                </li>
            </ul>

            <form action="/passerelle-wave" method="POST">
                <input type="hidden" name="montantTotal" value="${totalAcaisser}">
                <button type="submit" class="btn-wave">🌊 Payer instantanément avec Wave</button>
            </form>
        </div>

        <div class="whatsapp-card">
            <div style="font-size: 35px; margin-bottom: 5px;">💬</div>
            <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 18px;">Groupe Officiel de Suivi</h3>
            <a href="https://chat.whatsapp.com/Hmu9NxIEPidIWDBTx7snEs" target="_blank" class="btn-whatsapp">
                🔗 Rejoindre le Groupe WhatsApp
            </a>
        </div>

    </body>
    </html>
    `);
});

// ==========================================
// 2. PASSERELLE DE REDIRECTION VERS TON LIEN MARCHAND
// ==========================================
app.post('/passerelle-wave', (req, res) => {
    const montant = req.body.montantTotal;
    
    // Concaténation dynamique de ton lien marchand avec le montant exact
    const lienFinalWave = `${BASE_LIEN_WAVE}${montant}`;

    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirection Wave...</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px 20px; background: #f4f6f9; color: #2c3e50; }
            .wave-box { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 400px; margin: 40px auto; }
            .logo-wave { font-size: 60px; color: #1ac6ff; margin-bottom: 15px; }
            .btn-trigger { display: block; background: #1ac6ff; color: white; text-decoration: none; padding: 15px; border-radius: 10px; font-weight: bold; margin: 25px 0; font-size: 16px; box-shadow: 0 4px 10px rgba(26, 198, 255, 0.3); }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #1ac6ff; border-radius: 50%; width: 35px; height: 35px; animation: spin 1s linear infinite; margin: 15px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>

        <div class="wave-box">
            <div class="logo-wave">🌊</div>
            <h2>Ouverture de Wave...</h2>
            <p>Montant à régler : <strong style="color:#1c75bc; font-size: 22px;">${parseInt(montant).toLocaleString()} FCFA</strong></p>
            
            <div class="loader"></div>
            
            <a href="${lienFinalWave}" id="waveLink" class="btn-trigger">🚀 Cliquer ici si rien ne se passe</a>
            
            <p style="font-size: 13px; color: #7f8c8d; margin-top: 20px;">
                Vous allez être redirigé vers l'application sécurisée Wave pour valider la transaction. Après le paiement, revenez dans cette application.
            </p>
        </div>

        <script>
            // Déclenchement automatique du Deep Link dès le chargement de l'écran
            window.onload = function() {
                setTimeout(() => {
                    window.location.href = "${lienFinalWave}";
                }, 1000);
            };
        </script>
    </body>
    </html>
    `);
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Le serveur KNACOM Wave Pro tourne sur le port ${PORT}`);
});
