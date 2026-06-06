import { Client } from 'pg';

const connectionString = 'postgresql://tontinedb_1cid_user:x0z1YyQkH88Vb1Saz7vmlgcXT67C1Sax@dpg-d8i7cdr7uimc73afgb80-a.oregon-postgres.render.com/tontinedb_1cid';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        // Ajouter la colonne ordre_passage
        await client.query(`
            ALTER TABLE participants 
            ADD COLUMN IF NOT EXISTS ordre_passage INT DEFAULT NULL;
        `);
        console.log("✅ Colonne 'ordre_passage' creee dans le Cloud !");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
