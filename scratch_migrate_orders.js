import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

async function migrate() {
  console.log("Aplicando colunas de entrega no Supabase...");
  await sql`
    ALTER TABLE "orders" 
    ADD COLUMN IF NOT EXISTS "deliveryCity" VARCHAR(100),
    ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
  `;
  console.log("Colunas deliveryCity e deliveryAddress adicionadas com sucesso!");

  const cols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'orders';
  `;
  console.log("Colunas atualizadas:", cols.map(c => c.column_name));
  await sql.end();
}

migrate().catch(console.error);
