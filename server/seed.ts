import "dotenv/config";
import { getDb } from "./db";
import { products, customers, orders, partners, users } from "../drizzle/schema";
import { initialProducts, initialCustomers, initialOrders, initialPartners } from "../client/src/lib/demoData";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const db = await getDb();
  if (!db) {
    console.error("Não foi possível conectar ao banco de dados.");
    return;
  }

  console.log("Iniciando seed do banco de dados no Supabase...");

  // 1. Seed Usuário Admin
  try {
    const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@housefit.com.br")).limit(1);
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        openId: "admin-1",
        name: "Administrador HouseFit",
        email: "admin@housefit.com.br",
        phone: "(65) 99986-5093",
        password: "admin",
        role: "admin",
        loginMethod: "password",
      });
      console.log("✓ Usuário administrador criado: admin@housefit.com.br");
    } else {
      console.log("ℹ Usuário admin já existente.");
    }
  } catch (err: any) {
    console.warn("Erro ao inserir admin:", err.message);
  }

  // 2. Seed Produtos
  try {
    let insertedProducts = 0;
    for (const p of initialProducts) {
      const existing = await db.select().from(products).where(eq(products.slug, p.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(products).values({
          slug: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.price.toFixed(2),
          cost: p.cost.toFixed(2),
          stock: p.stock,
          imageUrl: p.image,
          tag: p.tag || null,
          isAvailable: p.available ? 1 : 0,
        });
        insertedProducts++;
      }
    }
    console.log(`✓ Produtos cadastrados no banco: ${insertedProducts} novos produtos inseridos.`);
  } catch (err: any) {
    console.warn("Erro ao inserir produtos:", err.message);
  }

  // 3. Seed Parceiros / Cupons
  try {
    let insertedPartners = 0;
    for (const part of initialPartners) {
      const existing = await db.select().from(partners).where(eq(partners.coupon, part.coupon)).limit(1);
      if (existing.length === 0) {
        await db.insert(partners).values({
          name: part.name,
          phone: part.phone,
          coupon: part.coupon,
          discountPercent: part.discountPercent,
          active: part.active,
        });
        insertedPartners++;
      }
    }
    console.log(`✓ Parceiros/Cupons cadastrados: ${insertedPartners} inseridos.`);
  } catch (err: any) {
    console.warn("Erro ao inserir parceiros:", err.message);
  }

  // 4. Seed Clientes
  try {
    let insertedCustomers = 0;
    for (const c of initialCustomers) {
      const existing = await db.select().from(customers).where(eq(customers.phone, c.phone)).limit(1);
      if (existing.length === 0) {
        await db.insert(customers).values({
          name: c.name,
          phone: c.phone,
          totalOrders: c.orders,
          totalSpent: c.spent.toFixed(2),
          favorite: c.favorite,
        });
        insertedCustomers++;
      }
    }
    console.log(`✓ Clientes cadastrados: ${insertedCustomers} inseridos.`);
  } catch (err: any) {
    console.warn("Erro ao inserir clientes:", err.message);
  }

  // 5. Seed Pedidos
  try {
    let insertedOrders = 0;
    for (const o of initialOrders) {
      const cleanNumber = o.id.replace("#", "");
      const existing = await db.select().from(orders).where(eq(orders.orderNumber, cleanNumber)).limit(1);
      if (existing.length === 0) {
        await db.insert(orders).values({
          orderNumber: cleanNumber,
          customerName: o.customer,
          customerPhone: o.customerPhone || null,
          status: o.status,
          channel: o.channel,
          paymentMethod: o.payment,
          itemsCount: o.items,
          itemNames: JSON.stringify(o.itemNames),
          subtotal: (o.subtotal || o.total).toFixed(2),
          discountAmount: (o.discountAmount || 0).toFixed(2),
          couponCode: o.couponCode || null,
          partnerName: o.partnerName || null,
          total: o.total.toFixed(2),
        });
        insertedOrders++;
      }
    }
    console.log(`✓ Pedidos cadastrados: ${insertedOrders} inseridos.`);
  } catch (err: any) {
    console.warn("Erro ao inserir pedidos:", err.message);
  }

  console.log("Seed finalizado com sucesso!");
  process.exit(0);
}

seedDatabase();
