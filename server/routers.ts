import { desc, eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { products, orders, customers } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(products).where(eq(products.isAvailable, 1));
    }),
  }),
  orders: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(orders).orderBy(desc(orders.createdAt));
    }),
    updateStatus: adminProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("Entrada inválida");
      const input = value as { id?: number; status?: string };
      if (!input.id || !input.status) throw new Error("Pedido e status são obrigatórios");
      return input as { id: number; status: "Recebido" | "Preparando" | "Pronto" | "Em entrega" | "Concluído" };
    }).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { success: true };
    }),
  }),
  admin: router({
    products: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(products).orderBy(products.category, products.name);
    }),
    customers: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(customers).orderBy(desc(customers.totalOrders));
    }),
  }),
});

export type AppRouter = typeof appRouter;
