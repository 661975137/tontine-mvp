import { Client } from 'pg';

const connectionString = 'postgresql://tontinedb_1cid_user:x0z1YyQkH88Vb1Saz7vmlgcXT67C1Sax@dpg-d8i7cdr7uimc73afgb80-a.oregon-postgres.render.com/tontinedb_1cid';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function init() {
    try {
        await client.connect();
        const query = `
            CREATE TABLE IF NOT EXISTS participants (
                id SERIAL PRIMARY KEY,
                nom_participant VARCHAR(255) NOT NULL,
                code_invitation VARCHAR(50) NOT NULL,
                date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await client.query(query);
        console.log("✅ Table 'participants' creee avec succes dans le Cloud !");
    } catch (err) {
        console.error("❌ Erreur :", err);
    } finally {
        await client.end();
    }
}

init();
