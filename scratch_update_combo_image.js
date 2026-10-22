import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

async function updateComboImage() {
  console.log("Atualizando imagem do combo-5 no banco de dados Supabase...");
  const res = await sql`
    UPDATE "products"
    SET "imageUrl" = '/combo-5-marmitas.jpg',
        "updatedAt" = NOW()
    WHERE "slug" = 'combo-5' OR "name" = 'Combo 05 marmitas'
    RETURNING "id", "slug", "name", "imageUrl";
  `;
  console.log("Atualizado com sucesso:", res);
  await sql.end();
}

updateComboImage().catch(console.error);
