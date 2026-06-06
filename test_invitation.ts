const cerclesBaseDonnees = new Map<string, { nom: string; montant: number }>();

export function GenererLienInvitationWhatsApp(nomCercle: string, montant: number) {
    const codeUnique = "tnt-" + Math.floor(1000 + Math.random() * 9000);
    cerclesBaseDonnees.set(codeUnique, { nom: nomCercle, montant: montant });

    const lienApplication = `https://tontine.ci/join/${codeUnique}`;
    const texteMessage = `Salut ! Rejoins ma tontine "${nomCercle}" (${montant} F/mois). Clique ici : ${lienApplication}`;
    const lienWhatsAppPrincipal = `https://wa.me/?text=${encodeURIComponent(texteMessage)}`;

    return { codeUnique, lienApplication, lienWhatsAppPrincipal };
}

export function RejoindreCercleViaLien(codeUnique: string, prenomMembre: string) {
    const cercle = cerclesBaseDonnees.get(codeUnique);
    if (!cercle) {
        console.log(`❌ Erreur : Le lien [${codeUnique}] n'existe pas.`);
        return false;
    }
    console.log(`🤝 [APPLICATION] ${prenomMembre} a rejoint la tontine "${cercle.nom}" !`);
    return true;
}

function ExecuterTestInvitation() {
    console.log("=== TEST DU MODULE INVITATION WHATSAPP ===");
    
    const invitation = GenererLienInvitationWhatsApp("Collègues Plateau V1", 25000);

    console.log(`🔗 Code unique créé : ${invitation.codeUnique}`);
    console.log(`💬 Message WhatsApp prêt à être envoyé !`);

    console.log("\n--- Simulation des clics sur le lien ---");
    RejoindreCercleViaLien(invitation.codeUnique, "Fatou");
    RejoindreCercleViaLien(invitation.codeUnique, "Amadou");

    console.log("\n=== FIN DU TEST INVITATION ===");
}

ExecuterTestInvitation();

