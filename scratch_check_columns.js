import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

async function checkColumns() {
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders';
  `;
  console.log("Colunas da tabela orders:", cols.map(c => c.column_name));
  await sql.end();
}

checkColumns().catch(console.error);
