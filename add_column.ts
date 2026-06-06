import { Client } from 'pg';

const connectionString = 'postgresql://tontinedb_1cid_user:x0z1YyQkH88Vb1Saz7vmlgcXT67C1Sax@dpg-d8i7cdr7uimc73afgb80-a.oregon-postgres.render.com/tontinedb_1cid';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function updateSchema() {
    try {
        await client.connect();
        // Ajouter la colonne periode si elle n'existe pas
        await client.query(`
            ALTER TABLE cercles 
            ADD COLUMN IF NOT EXISTS periode VARCHAR(50) DEFAULT 'mois';
        `);
        console.log("✅ Base de données mise à jour : Colonne 'periode' ajoutée !");
    } catch (err) {
        console.error("❌ Erreur :", err);
    } finally {
        await client.end();
    }
}

updateSchema();
