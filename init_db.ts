import { Client } from 'pg';

const connectionString = 'postgresql://tontinedb_1cid_user:x0z1YyQkH88Vb1Saz7vmlgcXT67C1Sax@dpg-d8i7cdr7uimc73afgb80-a.oregon-postgres.render.com/tontinedb_1cid';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function init() {
    try {
        await client.connect();
        console.log("🔗 Connexion à la base de données Cloud réussie...");
        
        const query = `
            CREATE TABLE IF NOT EXISTS cercles (
                id SERIAL PRIMARY KEY,
                nom_cercle VARCHAR(255) NOT NULL,
                montant_cotisation INT NOT NULL,
                code_invitation VARCHAR(50) UNIQUE NOT NULL
            );
        `;
        await client.query(query);
        console.log("✅ Table 'cercles' créée ou déjà existante dans le Cloud !");
    } catch (err) {
        console.error("❌ Erreur lors de l'initialisation :", err);
    } finally {
        await client.end();
    }
}

init();
