import { supabase } from "./supabase";
import type { Product, Order, Customer, Partner, OrderStatus, Category } from "./demoData";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "user";
}

// ----------------------------------------------------
// PRODUTOS
// ----------------------------------------------------
export async function fetchDbProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn("[Supabase] Erro ao buscar produtos:", error.message);
      return [];
    }

    return data.map((p) => ({
      id: p.slug,
      name: p.name,
      category: p.category as Category,
      description: p.description || "",
      price: parseFloat(p.price) || 0,
      cost: parseFloat(p.cost) || 0,
      stock: p.stock ?? 0,
      image: p.imageUrl || "",
      tag: p.tag || undefined,
      available: (p.isAvailable ?? 1) === 1 && (p.stock ?? 0) > 0,
    }));
  } catch (err) {
    console.error("[Supabase] Falha ao carregar produtos:", err);
    return [];
  }
}

export async function upsertDbProduct(p: Product): Promise<boolean> {
  try {
    const payload = {
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
    };

    const { error } = await supabase
      .from("products")
      .upsert(payload, { onConflict: "slug" });

    if (error) {
      console.error("[Supabase] Erro ao salvar produto:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Supabase] Falha no upsert de produto:", err);
    return false;
  }
}

export async function deleteDbProduct(slug: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("products").delete().eq("slug", slug);
    if (error) {
      console.error("[Supabase] Erro ao deletar produto:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Supabase] Falha ao deletar produto:", err);
    return false;
  }
}

// ----------------------------------------------------
// PEDIDOS (ORDERS)
// ----------------------------------------------------
export async function fetchDbOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error || !data) {
      if (error) console.warn("[Supabase] Erro ao buscar pedidos:", error.message);
      return [];
    }

    return data.map((o) => {
      let itemNames: string[] = [];
      try {
        itemNames = o.itemNames ? JSON.parse(o.itemNames) : [];
      } catch {
        itemNames = [o.itemNames || ""];
      }

      const initials = (o.customerName || "CL")
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase();

      const timeAgo = o.createdAt
        ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Recente";

      return {
        id: o.orderNumber.startsWith("#") ? o.orderNumber : `#${o.orderNumber}`,
        customer: o.customerName,
        customerPhone: o.customerPhone || undefined,
        initials,
        items: o.itemsCount ?? 1,
        itemNames,
        subtotal: parseFloat(o.subtotal) || 0,
        discountAmount: parseFloat(o.discountAmount) || 0,
        deliveryFee: parseFloat(o.deliveryFee) || 0,
        deliveryCity: o.deliveryCity || undefined,
        deliveryAddress: o.deliveryAddress || undefined,
        couponCode: o.couponCode || undefined,
        partnerName: o.partnerName || undefined,
        total: parseFloat(o.total) || 0,
        status: o.status as OrderStatus,
        channel: o.channel as "Delivery" | "Retirada",
        time: timeAgo,
        payment: o.paymentMethod || "Pix",
      };
    });
  } catch (err) {
    console.error("[Supabase] Falha ao buscar pedidos:", err);
    return [];
  }
}

export async function createDbOrder(order: Order): Promise<boolean> {
  try {
    const cleanNumber = order.id.replace("#", "");
    const payload = {
      orderNumber: cleanNumber,
      customerName: order.customer,
      customerPhone: order.customerPhone || null,
      status: order.status,
      channel: order.channel,
      paymentMethod: order.payment,
      itemsCount: order.items,
      itemNames: JSON.stringify(order.itemNames),
      subtotal: (order.subtotal || order.total).toFixed(2),
      discountAmount: (order.discountAmount || 0).toFixed(2),
      deliveryFee: (order.deliveryFee || 0).toFixed(2),
      deliveryCity: order.deliveryCity || null,
      deliveryAddress: order.deliveryAddress || null,
      couponCode: order.couponCode || null,
      partnerName: order.partnerName || null,
      total: order.total.toFixed(2),
    };

    const { error } = await supabase.from("orders").insert(payload);
    if (error) {
      console.error("[Supabase] Erro ao salvar pedido:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Supabase] Falha ao criar pedido:", err);
    return false;
  }
}

export async function updateDbOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  try {
    const cleanNumber = orderId.replace("#", "");
    const { error } = await supabase
      .from("orders")
      .update({ status, updatedAt: new Date().toISOString() })
      .eq("orderNumber", cleanNumber);

    if (error) {
      console.error("[Supabase] Erro ao atualizar status do pedido:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Supabase] Falha ao atualizar pedido:", err);
    return false;
  }
}

// ----------------------------------------------------
// CLIENTES (CUSTOMERS)
// ----------------------------------------------------
export async function fetchDbCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("totalOrders", { ascending: false });

    if (error || !data) {
      if (error) console.warn("[Supabase] Erro ao buscar clientes:", error.message);
      return [];
    }

    return data.map((c) => {
      const initials = (c.name || "CL")
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase();

      return {
        id: `c${c.id}`,
        name: c.name,
        phone: c.phone || "",
        initials,
        orders: c.totalOrders ?? 0,
        spent: parseFloat(c.totalSpent) || 0,
        lastOrder: c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-BR") : "Recente",
        favorite: c.favorite || "Panqueca de frango",
      };
    });
  } catch (err) {
    console.error("[Supabase] Falha ao buscar clientes:", err);
    return [];
  }
}

export async function recordCustomerPurchase(name: string, phone: string, amount: number, favorite?: string): Promise<void> {
  try {
    const { data } = await supabase.from("customers").select("*").eq("phone", phone).limit(1);
    if (data && data.length > 0) {
      const existing = data[0];
      const newOrders = (existing.totalOrders ?? 0) + 1;
      const newSpent = (parseFloat(existing.totalSpent) || 0) + amount;
      await supabase
        .from("customers")
        .update({
          name: name || existing.name,
          totalOrders: newOrders,
          totalSpent: newSpent.toFixed(2),
          lastOrderAt: new Date().toISOString(),
          favorite: favorite || existing.favorite,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("customers").insert({
        name,
        phone,
        totalOrders: 1,
        totalSpent: amount.toFixed(2),
        lastOrderAt: new Date().toISOString(),
        favorite: favorite || "Cardápio variado",
      });
    }
  } catch (err) {
    console.warn("[Supabase] Erro ao registrar compra do cliente:", err);
  }
}

// ----------------------------------------------------
// PARCEIROS E CUPONS (PARTNERS)
// ----------------------------------------------------
export async function fetchDbPartners(): Promise<Partner[]> {
  try {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data) {
      if (error) console.warn("[Supabase] Erro ao buscar parceiros:", error.message);
      return [];
    }

    return data.map((p) => ({
      id: `p${p.id}`,
      name: p.name,
      phone: p.phone || "",
      coupon: p.coupon,
      discountPercent: p.discountPercent ?? 10,
      createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : "Recente",
      active: p.active ?? true,
    }));
  } catch (err) {
    console.error("[Supabase] Falha ao buscar parceiros:", err);
    return [];
  }
}

export async function saveDbPartner(partner: Omit<Partner, "id">): Promise<boolean> {
  try {
    const { error } = await supabase.from("partners").insert({
      name: partner.name,
      phone: partner.phone,
      coupon: partner.coupon.toUpperCase().trim(),
      discountPercent: partner.discountPercent,
      active: partner.active,
    });
    if (error) {
      console.error("[Supabase] Erro ao salvar parceiro:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Supabase] Falha ao criar parceiro:", err);
    return false;
  }
}

// ----------------------------------------------------
// AUTENTICAÇÃO (USERS)
// ----------------------------------------------------
export async function authenticateDbUser(email: string, password: string):Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const u = data[0];
    if (u.password && u.password === password) {
      return {
        id: String(u.id),
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        role: (u.role as "admin" | "user") || "user",
      };
    }
    return null;
  } catch (err) {
    console.error("[Supabase] Falha na autenticação:", err);
    return null;
  }
}

export async function registerDbUser(user: { name: string; email: string; phone: string; password: string }): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert({
        openId: `user-${Date.now()}`,
        name: user.name,
        email: user.email.toLowerCase().trim(),
        phone: user.phone,
        password: user.password,
        role: "user",
        loginMethod: "password",
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[Supabase] Erro ao cadastrar usuário:", error?.message);
      return null;
    }

    return {
      id: String(data.id),
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      role: (data.role as "admin" | "user") || "user",
    };
  } catch (err) {
    console.error("[Supabase] Falha no cadastro de usuário:", err);
    return null;
  }
}

export async function checkUserPhoneExists(phone: string): Promise<{ exists: boolean; user?: DbUser }> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return { exists: false };

    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error || !data) return { exists: false };

    const found = data.find((u) => {
      const uPhone = (u.phone || "").replace(/\D/g, "");
      return uPhone && (uPhone === cleanPhone || uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone));
    });

    if (found) {
      return {
        exists: true,
        user: {
          id: String(found.id),
          name: found.name || "",
          email: found.email || "",
          phone: found.phone || "",
          role: (found.role as "admin" | "user") || "user",
        },
      };
    }

    return { exists: false };
  } catch (err) {
    console.error("[Supabase] Falha ao verificar telefone:", err);
    return { exists: false };
  }
}

export async function updateDbUser(
  userId: string,
  updates: { name?: string; email?: string; phone?: string; password?: string }
): Promise<boolean> {
  try {
    const payload: any = {};
    if (updates.name) payload.name = updates.name.trim();
    if (updates.email) payload.email = updates.email.toLowerCase().trim();
    if (updates.phone) payload.phone = updates.phone.trim();
    if (updates.password) payload.password = updates.password;

    let error: any = null;
    if (userId && !userId.startsWith("u-") && !isNaN(Number(userId))) {
      const res = await supabase.from("users").update(payload).eq("id", Number(userId));
      error = res.error;
    } else if (updates.email) {
      const res = await supabase.from("users").update(payload).eq("email", updates.email.toLowerCase().trim());
      error = res.error;
    }

    if (error) {
      console.warn("[Supabase] Aviso ao atualizar usuário:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Supabase] Falha no updateDbUser:", err);
    return false;
  }
}

