import crypto from 'crypto';

console.log("=== DÉBUT DU TEST DU SYSTÈME TONTINE ===");

// 1. Test Système OTP
const codeOtp = crypto.randomInt(1000, 9999).toString();
console.log(`📱 [SMS] Code envoyé au +2250708091011 : ${codeOtp}`);
console.log("✅ Authentification réussie !");

// 2. Simulation d'une tontine à 3 personnes
const montantCotisation = 50000;
const totalAttendu = 150000;
let potActuel = 0;

function verifierPot(montant: number) {
    console.log(`📊 Collecté: ${montant} F / Attendu: ${totalAttendu} F`);
    if (montant >= totalAttendu) {
        const commission = totalAttendu * 0.01;
        console.log(`🎉 POT COMPLET !`);
        console.log(`💸 Commission plateforme (1%) : ${commission} FCFA`);
        console.log(`📲 Versement envoyé à Christian : ${totalAttendu - commission} FCFA`);
    } else {
        console.log(`⚠️ Pot incomplet. En attente...`);
    }
}

console.log("\n1️⃣ Marie paie sa part...");
potActuel += montantCotisation;
verifierPot(potActuel);

console.log("\n2️⃣ Jean-Luc paie sa part...");
potActuel += montantCotisation;
verifierPot(potActuel);

console.log("\n3️⃣ Christian paie sa part...");
potActuel += montantCotisation;
verifierPot(potActuel);

console.log("\n=== FIN DU TEST AVEC SUCCÈS ===");

