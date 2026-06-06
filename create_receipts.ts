import { Client } from 'pg';

const connectionString = 'postgresql://tontinedb_1cid_user:x0z1YyQkH88Vb1Saz7vmlgcXT67C1Sax@dpg-d8i7cdr7uimc73afgb80-a.oregon-postgres.render.com/tontinedb_1cid';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        // Création de la table pour suivre l'état des paiements
        await client.query(`
            CREATE TABLE IF NOT EXISTS recus_paiement (
                id SERIAL PRIMARY KEY,
                nom_participant VARCHAR(255) NOT NULL,
                code_invitation VARCHAR(50) NOT NULL,
                cle_recu VARCHAR(50) UNIQUE NOT NULL,
                statut VARCHAR(50) DEFAULT 'En attente',
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Table 'recus_paiement' créée avec succès dans le Cloud !");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
