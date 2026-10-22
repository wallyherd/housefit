import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

async function updateAllCombosImages() {
  console.log("Atualizando imagens dos combos no banco de dados Supabase...");
  
  const res1 = await sql`
    UPDATE "products"
    SET "imageUrl" = '/combo-5-marmitas.jpg', "updatedAt" = NOW()
    WHERE "slug" = 'combo-5' OR "name" = 'Combo 05 marmitas'
    RETURNING "id", "slug", "name", "imageUrl";
  `;
  console.log("Combo 05:", res1);

  const res2 = await sql`
    UPDATE "products"
    SET "imageUrl" = '/combo-10-marmitas.jpg', "updatedAt" = NOW()
    WHERE "slug" = 'combo-10' OR "name" = 'Combo 10 marmitas'
    RETURNING "id", "slug", "name", "imageUrl";
  `;
  console.log("Combo 10:", res2);

  const res3 = await sql`
    UPDATE "products"
    SET "imageUrl" = '/combo-20-marmitas.jpg', "updatedAt" = NOW()
    WHERE "slug" = 'combo-20' OR "name" = 'Combo 20 marmitas'
    RETURNING "id", "slug", "name", "imageUrl";
  `;
  console.log("Combo 20:", res3);

  await sql.end();
}

updateAllCombosImages().catch(console.error);
