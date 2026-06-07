const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// CONFIGURATION DE TON COMPTE WAVE
// ==========================================
const BASE_LIEN_WAVE = "https://pay.wave.com/m/M_keWb8PBIy-lU/c/ci/?amount=";

// Simulation d'une base de données de transactions en attente
let transactionsEnAttente = [];

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
            .btn-wave { display: block; width: 100%; background: #1ac6ff; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; text-align: center; text-decoration: none; box-shadow: 0 4px 10px rgba(26, 198, 255, 0.3); box-sizing: border-box; }
            .btn-admin { display: block; text-align: center; margin-top: 15px; color: #7f8c8d; font-size: 13px; text-decoration: none; }
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
                <span style="font-size: 13px; color: #7f8c8d; display: block;">TOTAL À PAYER</span>
                <span class="amount-main">${totalAcaisser.toLocaleString()} FCFA</span>
            </div>
            <ul class="details-list">
                <li class="details-item"><span>Montant de la Cotisation</span><strong>${tontineDonnees.cotisation.toLocaleString()} FCFA</strong></li>
                <li class="details-item" style="color: #e67e22;"><span>Frais d'Adhésion (Unique)</span><strong>+ ${tontineDonnees.fraisAdhesion.toLocaleString()} FCFA</strong></li>
                <li class="details-item"><span>Frais de Service</span><strong>+ ${tontineDonnees.fraisService.toLocaleString()} FCFA</strong></li>
            </ul>

            <form action="/passerelle-wave" method="POST">
                <input type="hidden" name="montantTotal" value="${totalAcaisser}">
                <button type="submit" class="btn-wave">🌊 Payer avec Wave</button>
            </form>
        </div>

        <a href="/gerant-dashboard" class="btn-admin">⚙️ Espace Gestionnaire (Vérification)</a>
    </body>
    </html>
    `);
});

// ==========================================
// 2. REDIRECTION ET ENREGISTREMENT TRANSACTION
// ==========================================
app.post('/passerelle-wave', (req, res) => {
    const montant = req.body.montantTotal;
    const txnId = "KNM-" + Math.floor(1000 + Math.random() * 9000);

    // Enregistrement de la transaction en attente de validation par le gérant
    transactionsEnAttente.push({
        id: txnId,
        montant: montant,
        statut: "En cours de vérification"
    });

    const lienFinalWave = `${BASE_LIEN_WAVE}${montant}`;

    res.send(`
    <script>
        // Ouvre Wave immédiatement pour le paiement, puis redirige vers l'écran de vérification
        window.open("${lienFinalWave}", "_blank");
        window.location.href = "/verification-paiement?id=${txnId}";
    </script>
    `);
});

// ==========================================
// 3. ÉCRAN DE VÉRIFICATION AVEC COMPTE À REBOURS (Style Capture 483431)
// ==========================================
app.get('/verification-paiement', (req, res) => {
    const txnId = req.query.id;

    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification du paiement</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; background: #ffffff; padding: 40px 20px; margin: 0; color: #333; }
            .title { font-size: 18px; color: #1e272e; font-weight: 500; margin-bottom: 30px; }
            .timer { font-size: 60px; font-weight: bold; margin-bottom: 40px; color: #000000; letter-spacing: 2px; }
            .msg-box { background: #f1f2f6; border-radius: 6px; padding: 20px; text-align: left; font-size: 16px; line-height: 1.5; color: #2f3542; max-width: 400px; margin: 0 auto 50px auto; }
            .btn-verify { display: block; width: 100%; max-width: 400px; background: #f15a24; color: white; border: none; padding: 16px; font-size: 16px; font-weight: bold; border-radius: 12px; cursor: pointer; text-decoration: none; margin: 0 auto; box-sizing: border-box; }
        </style>
    </head>
    <body>

        <div class="title">Vérification du paiement</div>
        
        <div class="timer" id="countdown">05:00</div>

        <div class="msg-box">
            Le paiement est en cours de verification chez l'operateur,<br>veuillez patienter
        </div>

        <button class="btn-verify" onclick="verifierStatut()">Vérifier votre paiement</button>

        <script>
            let temps = 300; // 5 minutes en secondes
            const timerElement = document.getElementById('countdown');

            const interval = setInterval(() => {
                let minutes = parseInt(temps / 60, 10);
                let secondes = parseInt(temps % 60, 10);

                minutes = minutes < 10 ? "0" + minutes : minutes;
                secondes = secondes < 10 ? "0" + secondes : secondes;

                timerElement.textContent = minutes + ":" + secondes;

                if (--temps < 0) {
                    clearInterval(interval);
                    timerElement.textContent = "00:00";
                }
            }, 1000);

            function verifierStatut() {
                // Requête pour voir si le gérant a validé
                fetch('/statut-transaction?id=${txnId}')
                    .then(response => response.json())
                    .then(data => {
                        if (data.statut === "Validé") {
                            alert("✅ Votre paiement a été validé avec succès par le gérant !");
                            window.location.href = "/";
                        } else {
                            alert("⏳ Le gérant n'a pas encore validé votre dépôt Wave. Veuillez patienter.");
                        }
                    });
            }
        </script>
    </body>
    </html>
    `);
});

// Route API pour vérifier le statut depuis le téléphone du participant
app.get('/statut-transaction', (req, res) => {
    const txnId = req.query.id;
    const txn = transactionsEnAttente.find(t => t.id === txnId);
    res.json({ statut: txn ? txn.statut : "Inconnu" });
});

// ==========================================
// 4. ESPACE GÉRANT : POUR VALIDER LES ENCAISSEMENTS WAVE
// ==========================================
app.get('/gerant-dashboard', (req, res) => {
    let lignesTableau = transactionsEnAttente.map(t => `
        <tr>
            <td style="padding:10px; border-bottom:1px solid #ddd;">${t.id}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd;"><b>${parseInt(t.montant).toLocaleString()} FCFA</b></td>
            <td style="padding:10px; border-bottom:1px solid #ddd; color: ${t.statut === 'Validé' ? 'green' : 'orange'}">${t.statut}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd;">
                ${t.statut === 'En cours de vérification' ? `<a href="/valider-txn?id=${t.id}" style="background:#2ecc71; color:white; padding:5px 10px; text-decoration:none; border-radius:4px; font-size:12px;">Valider l'argent reçu</a>` : '✅ Terminé'}
            </td>
        </tr>
    `).join('');

    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Panneau Gérant - KNACOM</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f4f6f9; }
            .container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>⚙️ Panneau de contrôle du Gérant</h2>
            <p>Dès que vous recevez la notification de dépôt sur votre application Wave, cliquez sur "Valider" ci-dessous :</p>
            
            <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                <thead>
                    <tr style="background:#f8f9fa; text-align:left;">
                        <th style="padding:10px;">ID Ref</th>
                        <th style="padding:10px;">Montant</th>
                        <th style="padding:10px;">Statut</th>
                        <th style="padding:10px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${lignesTableau.length > 0 ? lignesTableau : '<tr><td colspan="4" style="padding:20px; text-align:center; color:#7f8c8d;">Aucun paiement en attente.</td></tr>'}
                </tbody>
            </table>
            <br>
            <a href="/" style="color:#1ac6ff; text-decoration:none;">⬅️ Retour à l'accueil</a>
        </div>
    </body>
    </html>
    `);
});

// Route pour que le gérant valide le paiement
app.get('/valider-txn', (req, res) => {
    const txnId = req.query.id;
    const txn = transactionsEnAttente.find(t => t.id === txnId);
    if (txn) {
        txn.statut = "Validé";
    }
    res.redirect('/gerant-dashboard');
});

app.listen(PORT, () => {
    console.log(`Serveur de tontine sécurisé actif sur le port ${PORT}`);
});
