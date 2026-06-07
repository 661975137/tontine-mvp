import express, { Request, Response } from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// CONFIGURATION DE TON COMPTE MARCHAND WAVE
// ==========================================
const BASE_LIEN_WAVE = "https://pay.wave.com/m/M_keWb8PBIy-lU/c/ci/?amount=";

interface Transaction {
    id: string;
    montant: number;
    statut: string;
}

// Base de données temporaire des transactions
let transactionsEnAttente: Transaction[] = [];

// Données dynamiques calquées sur ton interface d'inscription (1020 FCFA au total)
let tontineDonnees = {
    nom: "Tontine Flash",
    cotisation: 1000,       
    fraisAdhesion: 10,    
    fraisReseau: 10,      
};

// ==========================================
// 1. PAGE D'INSCRIPTION (Style épuré - Version Wave active)
// ==========================================
app.get('/', (req: Request, res: Response) => {
    const totalAcaisser = tontineDonnees.cotisation + tontineDonnees.fraisAdhesion + tontineDonnees.fraisReseau;

    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Inscription - KNACOM</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #2f3542; }
            .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 400px; margin: 20px auto; }
            .title-box { text-align: center; font-size: 26px; font-weight: bold; color: #1ac6ff; margin-bottom: 25px; }
            .badge-box { background: #fffbe6; border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid #ffe58f; }
            .total-text { font-size: 22px; font-weight: bold; color: #d46b08; text-align: center; margin-top: 5px; }
            .input-group { margin-bottom: 15px; text-align: left; }
            .input-group label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
            .input-field { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; font-size: 15px; }
            .btn-wave { display: block; width: 100%; background: #1ac6ff; color: white; border: none; padding: 16px; font-size: 16px; font-weight: bold; border-radius: 12px; cursor: pointer; text-align: center; text-decoration: none; box-shadow: 0 4px 12px rgba(26, 198, 255, 0.3); }
            .btn-admin { display: block; text-align: center; margin-top: 20px; color: #a4b0be; font-size: 12px; text-decoration: none; }
        </style>
    </head>
    <body>

        <div class="card">
            <div class="title-box">👋 Inscription</div>
            <p style="text-align:center; font-weight:bold; margin:0 0 15px 0;">Cercle : ${tontineDonnees.nom}</p>
            
            <div class="badge-box">
                <div style="font-size:14px; color:#57606f; text-align:center;">💰 Cotisation : ${tontineDonnees.cotisation} FCFA</div>
                <div style="font-size:14px; color:#57606f; text-align:center;">🎟️ Adhésion : ${tontineDonnees.fraisAdhesion} FCFA</div>
                <div style="font-size:14px; color:#57606f; text-align:center;">⚡ Frais réseau (1%) : ${tontineDonnees.fraisReseau} FCFA</div>
                <div class="total-text">Total à régler : ${totalAcaisser} FCFA</div>
            </div>

            <form action="/passerelle-wave" method="POST">
                <div class="input-group">
                    <label>👤 Ton prénom :</label>
                    <input type="text" class="input-field" placeholder="Entre ton prénom ici..." required>
                </div>
                <div class="input-group">
                    <label>✉️ Ton Email :</label>
                    <input type="email" class="input-field" placeholder="Ex: tonemail@gmail.com" required>
                </div>

                <input type="hidden" name="montantTotal" value="${totalAcaisser}">
                <button type="submit" class="btn-wave">🌊 Payer via Wave</button>
            </form>
            
            <a href="/gerant-dashboard" class="btn-admin">⚙️ Zone de vérification du Gérant</a>
        </div>

    </body>
    </html>
    `);
});

// ==========================================
// 2. LOGIQUE TRAITEMENT ET DEEP-LINK
// ==========================================
app.post('/passerelle-wave', (req: Request, res: Response) => {
    const montant = req.body.montantTotal;
    const txnId = "KNM-" + Math.floor(1000 + Math.random() * 9000);

    transactionsEnAttente.push({
        id: txnId,
        montant: Number(montant),
        statut: "En cours de vérification"
    });

    const lienFinalWave = `${BASE_LIEN_WAVE}${montant}`;

    res.send(`
    <script>
        window.open("${lienFinalWave}", "_blank");
        window.location.href = "/verification-paiement?id=${txnId}";
    </script>
    `);
});

// ==========================================
// 3. ÉCRAN BLANC COMPTE À REBOURS (Style Capture 483431)
// ==========================================
app.get('/verification-paiement', (req: Request, res: Response) => {
    const txnId = req.query.id as string;

    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification du paiement</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; background: #ffffff; padding: 50px 20px; margin: 0; color: #333; }
            .title { font-size: 18px; color: #1e272e; font-weight: 500; margin-bottom: 40px; }
            .timer { font-size: 64px; font-weight: bold; margin-bottom: 40px; color: #000000; letter-spacing: 2px; }
            .msg-box { background: #f1f2f6; border-radius: 8px; padding: 22px; text-align: left; font-size: 16px; line-height: 1.6; color: #2f3542; max-width: 380px; margin: 0 auto 60px auto; }
            .btn-verify { display: block; width: 100%; max-width: 380px; background: #f15a24; color: white; border: none; padding: 18px; font-size: 16px; font-weight: bold; border-radius: 12px; cursor: pointer; text-decoration: none; margin: 0 auto; }
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
            let temps = 300;
            const timerElement = document.getElementById('countdown');

            const interval = setInterval(() => {
                let minutes = parseInt(String(temps / 60), 10);
                let secondes = parseInt(String(temps % 60), 10);

                minutes = minutes < 10 ? 0 + String(minutes) : String(minutes);
                secondes = secondes < 10 ? 0 + String(secondes) : String(secondes);

                timerElement.textContent = minutes + ":" + secondes;

                if (--temps < 0) {
                    clearInterval(interval);
                    timerElement.textContent = "00:00";
                }
            }, 1000);

            function verifierStatut() {
                fetch('/statut-transaction?id=${txnId}')
                    .then(response => response.json())
                    .then(data => {
                        if (data.statut === "Validé") {
                            alert("✅ Paiement validé par le gérant !");
                            window.location.href = "/";
                        } else {
                            alert("⏳ Le gérant n'a pas encore validé la réception des fonds sur son compte Wave.");
                        }
                    });
            }
        </script>
    </body>
    </html>
    `);
});

app.get('/statut-transaction', (req: Request, res: Response) => {
    const txnId = req.query.id as string;
    const txn = transactionsEnAttente.find(t => t.id === txnId);
    res.json({ statut: txn ? txn.statut : "Inconnu" });
});

// ==========================================
// 4. ESPACE DE CONTRÔLE GÉRANT
// ==========================================
app.get('/gerant-dashboard', (req: Request, res: Response) => {
    let lignesTableau = transactionsEnAttente.map(t => `
        <tr>
            <td style="padding:12px; border-bottom:1px solid #ddd;">${t.id}</td>
            <td style="padding:12px; border-bottom:1px solid #ddd;"><b>${t.montant} FCFA</b></td>
            <td style="padding:12px; border-bottom:1px solid #ddd; color: ${t.statut === 'Validé' ? 'green' : 'orange'}">${t.statut}</td>
            <td style="padding:12px; border-bottom:1px solid #ddd;">
                ${t.statut === 'En cours de vérification' ? `<a href="/valider-txn?id=${t.id}" style="background:#2ecc71; color:white; padding:6px 12px; text-decoration:none; border-radius:6px; font-size:13px;">Confirmer le dépôt Wave</a>` : '✅ Encaissé'}
            </td>
        </tr>
    `).join('');

    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Panneau Gérant</title>
    </head>
    <body style="font-family:Arial, sans-serif; padding:20px; background:#f4f6f9;">
        <div style="background:white; padding:25px; border-radius:16px; max-width:600px; margin:0 auto; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
            <h2>⚙️ Validation des dépôts de Tontine</h2>
            <p>Vérifiez votre application Wave Business. Dès que les 1 020 FCFA sont reçus, cliquez ci-dessous :</p>
            <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                <thead>
                    <tr style="background:#f8f9fa;">
                        <th style="padding:10px; text-align:left;">ID Ref</th>
                        <th style="padding:10px; text-align:left;">Montant</th>
                        <th style="padding:10px; text-align:left;">État</th>
                        <th style="padding:10px; text-align:left;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${lignesTableau.length > 0 ? lignesTableau : '<tr><td colspan="4" style="padding:20px; text-align:center; color:#888;">Aucun dépôt en attente.</td></tr>'}
                </tbody>
            </table>
            <br><br>
            <a href="/" style="color:#1ac6ff; text-decoration:none; font-weight:bold;">⬅️ Retour à l'accueil</a>
        </div>
    </body>
    </html>
    `);
});

app.get('/valider-txn', (req: Request, res: Response) => {
    const txnId = req.query.id as string;
    const txn = transactionsEnAttente.find(t => t.id === txnId);
    if (txn) {
        txn.statut = "Validé";
    }
    res.redirect('/gerant-dashboard');
});

app.listen(PORT, () => {
    console.log(`Serveur TypeScript KNACOM actif sur le port ${PORT}`);
});
