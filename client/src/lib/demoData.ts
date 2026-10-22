export type Category = "Combos" | "Frango" | "Carne" | "Caldos" | "Lanches" | "Sucos";

export type Product = {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  cost: number;
  stock: number;
  image: string;
  tag?: string;
  available: boolean;
};

export type OrderStatus = "Recebido" | "Preparando" | "Pronto" | "Em entrega" | "Concluído";

export type Order = {
  id: string;
  customer: string;
  customerPhone?: string;
  initials: string;
  items: number;
  itemNames: string[];
  subtotal?: number;
  discountAmount?: number;
  deliveryFee?: number;
  deliveryCity?: string;
  deliveryAddress?: string;
  couponCode?: string;
  partnerId?: string;
  partnerName?: string;
  total: number;
  status: OrderStatus;
  channel: "Delivery" | "Retirada";
  time: string;
  payment: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  orders: number;
  spent: number;
  lastOrder: string;
  favorite: string;
};

export type Partner = {
  id: string;
  name: string;
  phone: string;
  coupon: string;
  discountPercent: number;
  createdAt: string;
  active: boolean;
};

const mealImage = "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85";
const bowlImage = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85";
const proteinImage = "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85";
const soupImage = "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=85";
const snackImage = "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85";
const juiceImage = "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=900&q=85";

const product = (
  id: string,
  name: string,
  category: Category,
  description: string,
  price: number,
  stock: number,
  cost: number,
  image: string,
  tag?: string,
): Product => ({ id, name, category, description, price, stock, cost, image, tag, available: stock > 0 });

export const initialProducts: Product[] = [
  product("combo-20", "Combo 20 marmitas", "Combos", "Escolha seus sabores favoritos e garanta o mês todo no freezer com máxima economia.", 449, 12, 290, mealImage, "Mais economia"),
  product("combo-10", "Combo 10 marmitas", "Combos", "Refeições práticas para deixar a semana mais leve e saborosa.", 229, 18, 150, bowlImage, "Favorito"),
  product("combo-5", "Combo 05 marmitas", "Combos", "O jeito gostoso de começar uma rotina saudável e prática.", 119, 23, 78, proteinImage, "Para experimentar"),
  product("combo-caldos", "Combo 10 caldos", "Combos", "Dias aconchegantes com caldo congelado e pronto em minutos.", 159, 7, 98, soupImage, "Favorito"),
  product("combo-caldos-20", "Combo 20 caldos", "Combos", "Variedade de caldos para aquecer suas noites com o melhor custo-benefício.", 299, 10, 185, soupImage, "Mais economia"),
  product("frango-pan-vermelho", "Panqueca de frango ao molho vermelho", "Frango", "2 discos, 100g de frango desfiado, molho de tomate e muçarela.", 26.5, 79, 11.2, mealImage),
  product("frango-pan-branco", "Panqueca de frango ao molho branco", "Frango", "2 discos, 100g de frango desfiado, molho branco e muçarela.", 26.5, 35, 11.4, mealImage),
  product("frango-escond-batatadoce", "Escondidinho de frango com purê de batata-doce", "Frango", "120g de frango, 160g de purê de batata-doce e queijo.", 26.5, 28, 12.1, bowlImage),
  product("frango-cubos-carioca", "Frango em cubos, arroz, feijão carioca e legumes", "Frango", "100g de frango, arroz branco, feijão carioca e legumes.", 26.5, 47, 10.8, bowlImage),
  product("frango-galinhada-preto", "Galinhada com feijão preto", "Frango", "180g de galinhada com 120g de feijão preto.", 26.5, 38, 10.9, mealImage),
  product("frango-fricasse", "Fricassê de frango com arroz branco", "Frango", "180g de fricassê, arroz branco e toque de muçarela.", 26.5, 28, 11.7, mealImage),
  product("frango-escond-inglesa", "Escondidinho de frango com purê de batata inglesa", "Frango", "Frango desfiado, purê de batata inglesa e queijo.", 26.5, 46, 11.9, bowlImage),
  product("frango-escond-mandioca", "Escondidinho de frango com purê de mandioca", "Frango", "Frango desfiado, purê de mandioca e queijo.", 26.5, 54, 11.8, bowlImage),
  product("frango-escond-abobora", "Escondidinho de frango com purê de abóbora", "Frango", "Frango desfiado, purê de abóbora cabotiá e queijo.", 26.5, 54, 11.3, bowlImage),
  product("frango-batata-strogonoff", "Batata recheada de strogonoff de frango", "Frango", "150g de strogonoff, 150g de batata e queijo.", 26.5, 4, 12.5, mealImage, "Últimas unidades"),
  product("frango-strogonoff", "Strogonoff de frango com arroz branco", "Frango", "180g de strogonoff de frango com 120g de arroz.", 26.5, 18, 11.7, mealImage),
  product("frango-cubos-preto", "Frango em cubos, arroz branco e feijão preto", "Frango", "Frango em cubos com arroz e feijão preto.", 26.5, 27, 10.7, bowlImage),
  product("frango-farofa", "Farofa de cuscuz com frango desfiado e queijo", "Frango", "120g de frango, farofa de cuscuz com cenoura e queijo.", 26.5, 20, 11.6, mealImage),
  product("frango-sobrecoxa-milho", "Sobrecoxa desossada com arroz e creme de milho", "Frango", "Sobrecoxa desossada, arroz branco e creme de milho.", 26.5, 27, 11.9, mealImage),
  product("frango-sobrecoxa-carioca", "Sobrecoxa desossada, arroz e feijão carioca", "Frango", "Sobrecoxa desossada com arroz e feijão carioca.", 26.5, 10, 11.5, bowlImage),
  product("frango-galinhada", "Galinhada da casa", "Frango", "300g de galinhada com frango, arroz, cenoura e açafrão.", 26.5, 10, 11.2, mealImage),
  product("carne-pan-vermelho", "Panqueca de carne ao molho vermelho", "Carne", "2 discos, 100g de patinho, molho de tomate e muçarela.", 26.5, 16, 12.4, proteinImage),
  product("carne-pan-branco", "Panqueca de carne ao molho branco", "Carne", "2 discos, 100g de patinho, molho branco e muçarela.", 26.5, 40, 12.6, proteinImage),
  product("carne-strogonoff", "Strogonoff de carne com arroz branco", "Carne", "180g de strogonoff de carne com 120g de arroz.", 26.5, 56, 13.2, proteinImage),
  product("carne-escond-mandioca", "Escondidinho de carne desfiada com purê de mandioca", "Carne", "Carne desfiada, purê de mandioca e queijo.", 26.5, 33, 13.5, proteinImage),
  product("carne-escond-doce", "Escondidinho de carne moída com purê de batata-doce", "Carne", "Patinho moído, purê de batata-doce e queijo.", 26.5, 28, 13.1, bowlImage),
  product("carne-panela-legumes", "Carne de panela, arroz, feijão e legumes", "Carne", "Carne de panela, arroz, feijão carioca e legumes.", 26.5, 79, 12.7, proteinImage),
  product("carne-patinho-legumes", "Patinho moído, arroz, feijão e legumes", "Carne", "Patinho moído, arroz, feijão carioca e legumes.", 26.5, 20, 12.4, bowlImage),
  product("carne-patinho-carioca", "Patinho moído, arroz e feijão carioca", "Carne", "100g de patinho, arroz branco e feijão carioca.", 26.5, 61, 11.9, bowlImage),
  product("carne-patinho-preto", "Patinho moído, arroz e feijão preto", "Carne", "100g de patinho, arroz branco e feijão preto.", 26.5, 57, 11.9, bowlImage),
  product("carne-farofa", "Farofa de cuscuz com carne desfiada e queijo", "Carne", "Carne desfiada, farofa de cuscuz e queijo.", 26.5, 80, 12.8, proteinImage),
  product("carne-escond-inglesa", "Escondidinho de carne com purê de batata inglesa", "Carne", "Carne moída, purê de batata inglesa e queijo.", 26.5, 36, 12.7, bowlImage),
  product("carne-escond-abobora", "Escondidinho de carne com purê de abóbora", "Carne", "Carne desfiada, purê de abóbora cabotiá e queijo.", 26.5, 26, 12.9, bowlImage),
  product("carne-escond-mandioca-moida", "Escondidinho de carne moída com purê de mandioca", "Carne", "Patinho moído, purê de mandioca e queijo.", 26.5, 12, 12.8, bowlImage),
  product("carne-escond-abobora-moida", "Escondidinho de carne moída com purê de abóbora", "Carne", "Patinho moído, purê de abóbora e queijo.", 26.5, 34, 12.3, bowlImage),
  product("carne-macarrão", "Macarrão integral ao molho bolonhesa", "Carne", "Macarrão integral, patinho, molho de tomate e queijo.", 26.5, 13, 11.8, proteinImage),
  product("carne-farofa-moida", "Farofa de cuscuz com carne moída e queijo", "Carne", "Patinho moído, farofa de cuscuz e queijo.", 26.5, 24, 11.9, proteinImage),
  product("carne-patinho-abobora", "Patinho moído, arroz branco e purê de abóbora", "Carne", "Patinho, arroz branco e purê de abóbora.", 26.5, 55, 11.6, bowlImage),
  product("carne-desfiada-feijao", "Carne desfiada, arroz com açafrão e feijão", "Carne", "Carne desfiada, arroz com cenoura e feijão carioca.", 26.5, 110, 12.1, proteinImage),
  product("carne-arroz-abobora", "Carne desfiada com arroz cremoso de abóbora", "Carne", "120g de carne desfiada e arroz cremoso de abóbora.", 26.5, 49, 12.6, bowlImage),
  product("carne-tiras-mandioca", "Tiras de carne com mandioca cozida", "Carne", "130g de tiras de carne e mandioca com caldo.", 26.5, 41, 12.4, proteinImage),
  product("carne-batata-rustica", "Carne desfiada, arroz branco e batata rústica", "Carne", "Carne desfiada, arroz branco e batata rústica.", 26.5, 70, 12.2, proteinImage),
  product("carne-creme-milho", "Patinho moído, arroz e creme de milho", "Carne", "Patinho moído, arroz branco e creme de milho.", 26.5, 72, 12.3, bowlImage),
  product("caldo-carioca", "Caldo de feijão carioca com bacon e calabresa", "Caldos", "350ml de caldo encorpado para aquecer a rotina.", 18, 28, 7.1, soupImage),
  product("caldo-abobora-frango", "Caldo de abóbora com frango desfiado", "Caldos", "350ml de caldo de abóbora com frango.", 18, 26, 6.4, soupImage),
  product("caldo-abobora-carne", "Caldo de abóbora com patinho moído", "Caldos", "350ml de caldo de abóbora com patinho.", 18, 39, 6.9, soupImage),
  product("caldo-preto", "Caldo de feijão preto com bacon e calabresa", "Caldos", "350ml de caldo de feijão preto.", 18, 33, 7.3, soupImage),
  product("caldo-mandioca", "Caldo de mandioca com carne desfiada", "Caldos", "350ml de mandioca com carne desfiada.", 18, 5, 7.2, soupImage, "Últimas unidades"),
  product("lanche-coxinha", "Coxinha de frango com requeijão", "Lanches", "100g, com massa de batata e recheio cremoso.", 15, 32, 6.5, snackImage),
  product("lanche-torta-palmito", "Torta de palmito integral", "Lanches", "120g, massa integral e recheio de palmito.", 15, 12, 6.1, snackImage),
  product("lanche-torta-carne", "Torta de carne louca integral", "Lanches", "120g, massa integral com carne bovina temperada.", 15, 11, 6.6, snackImage),
  product("lanche-quiche-alho", "Quiche de alho-poró integral", "Lanches", "110g, recheio cremoso de alho-poró.", 15, 23, 6.3, snackImage),
  product("lanche-quiche-marguerita", "Quiche de marguerita integral", "Lanches", "110g, tomate, ricota e manjericão.", 15, 23, 6.2, snackImage),
  product("lanche-pizza-queijo", "Mini pizza de queijo integral", "Lanches", "150g com queijo, tomate e massa integral.", 16.5, 45, 7.2, snackImage),
  product("lanche-pizza-marguerita", "Mini pizza de marguerita integral", "Lanches", "150g com tomate, ricota e manjericão.", 16.5, 40, 7.1, snackImage),
  product("lanche-pizza-frango", "Mini pizza de frango com requeijão integral", "Lanches", "150g com frango e requeijão cremoso.", 16.5, 42, 7.4, snackImage),
  product("lanche-pizza-calabresa", "Mini pizza de calabresa com requeijão", "Lanches", "150g com calabresa e requeijão.", 16.5, 51, 7.6, snackImage),
  product("lanche-limao", "Torta de limão zero açúcar", "Lanches", "80g, doce equilibrado para fechar a refeição.", 16, 10, 6.4, snackImage),
  product("lanche-chocolate", "Torta de chocolate zero açúcar", "Lanches", "80g, chocolate amargo e cacau.", 16, 9, 6.7, snackImage),
  product("suco-amarelas", "Suco de frutas amarelas", "Sucos", "300ml de abacaxi, manga, maracujá e água.", 13, 17, 4.1, juiceImage),
  product("suco-vermelhas", "Suco de frutas vermelhas", "Sucos", "300ml de morango, amora, framboesa e água.", 13, 15, 4.4, juiceImage),
  product("suco-morango", "Suco de morango", "Sucos", "300ml de morango e água.", 13, 19, 3.9, juiceImage),
  product("suco-abacaxi", "Suco de abacaxi com hortelã", "Sucos", "300ml de abacaxi, hortelã e água.", 13, 10, 3.8, juiceImage),
];

export const initialOrders: Order[] = [
  { id: "#HF-1048", customer: "Mariana Costa", customerPhone: "(65) 99821-3344", initials: "MC", items: 3, itemNames: ["Panqueca de frango ao molho vermelho", "Suco de morango"], total: 66, status: "Preparando", channel: "Delivery", time: "há 8 min", payment: "Pix" },
  { id: "#HF-1047", customer: "Rafael Mendes", customerPhone: "(65) 99654-1122", initials: "RM", items: 5, itemNames: ["Combo 05 marmitas (3x Panqueca de frango, 2x Strogonoff de carne)"], subtotal: 119, discountAmount: 11.9, couponCode: "LUCASFIT", partnerId: "p1", partnerName: "Lucas Personal Trainer", total: 107.1, status: "Recebido", channel: "Retirada", time: "há 14 min", payment: "Cartão" },
  { id: "#HF-1046", customer: "Bianca Alves", customerPhone: "(65) 99123-5566", initials: "BA", items: 2, itemNames: ["Strogonoff de carne com arroz branco", "Caldo de abóbora"], total: 44.5, status: "Pronto", channel: "Delivery", time: "há 21 min", payment: "Pix" },
  { id: "#HF-1045", customer: "Lucas Vieira", customerPhone: "(65) 99789-0011", initials: "LV", items: 4, itemNames: ["Combo 10 marmitas (5x Frango em cubos, 5x Galinhada)"], subtotal: 229, discountAmount: 34.35, couponCode: "CAMILANUTRI", partnerId: "p2", partnerName: "Dra. Camila Nutri", total: 194.65, status: "Em entrega", channel: "Delivery", time: "há 36 min", payment: "Vale-refeição" },
  { id: "#HF-1044", customer: "Ana Souza", customerPhone: "(65) 98455-7788", initials: "AS", items: 1, itemNames: ["Escondidinho de frango com purê de batata-doce"], total: 26.5, status: "Concluído", channel: "Retirada", time: "ontem", payment: "Pix" },
  { id: "#HF-1043", customer: "Diego Rocha", customerPhone: "(65) 99344-9900", initials: "DR", items: 3, itemNames: ["Patinho moído, arroz e feijão carioca"], total: 92.5, status: "Concluído", channel: "Delivery", time: "ontem", payment: "Cartão" },
];

export const initialCustomers: Customer[] = [
  { id: "c1", name: "Mariana Costa", phone: "(65) 99821-3344", initials: "MC", orders: 18, spent: 824.5, lastOrder: "Hoje, 12:42", favorite: "Panqueca de frango" },
  { id: "c2", name: "Rafael Mendes", phone: "(65) 99654-1122", initials: "RM", orders: 14, spent: 671, lastOrder: "Hoje, 12:36", favorite: "Combo 10 marmitas" },
  { id: "c3", name: "Bianca Alves", phone: "(65) 99123-5566", initials: "BA", orders: 11, spent: 489.5, lastOrder: "Ontem, 19:12", favorite: "Strogonoff de carne" },
  { id: "c4", name: "Lucas Vieira", phone: "(65) 99789-0011", initials: "LV", orders: 9, spent: 445, lastOrder: "Ontem, 12:28", favorite: "Combo 20 marmitas" },
  { id: "c5", name: "Ana Souza", phone: "(65) 98455-7788", initials: "AS", orders: 8, spent: 322, lastOrder: "20 out, 11:04", favorite: "Escondidinho de frango" },
];

export const initialPartners: Partner[] = [
  {
    id: "p1",
    name: "Lucas Personal Trainer",
    phone: "(65) 99812-4433",
    coupon: "LUCASFIT",
    discountPercent: 10,
    createdAt: "10/10/2026",
    active: true,
  },
  {
    id: "p2",
    name: "Dra. Camila Nutricionista",
    phone: "(65) 99234-8899",
    coupon: "CAMILANUTRI",
    discountPercent: 15,
    createdAt: "15/10/2026",
    active: true,
  },
  {
    id: "p3",
    name: "Academia Iron House",
    phone: "(65) 99600-1234",
    coupon: "IRONHOUSE",
    discountPercent: 10,
    createdAt: "18/10/2026",
    active: true,
  },
];

export const weeklySales = [
  { label: "Seg", value: 820, orders: 26 },
  { label: "Ter", value: 1080, orders: 34 },
  { label: "Qua", value: 940, orders: 29 },
  { label: "Qui", value: 1310, orders: 41 },
  { label: "Sex", value: 1680, orders: 53 },
  { label: "Sáb", value: 710, orders: 21 },
  { label: "Dom", value: 420, orders: 12 },
];

export const monthlySales = [
  { label: "Mai", value: 18400 },
  { label: "Jun", value: 21200 },
  { label: "Jul", value: 23900 },
  { label: "Ago", value: 26800 },
  { label: "Set", value: 31200 },
  { label: "Out", value: 35940 },
];

export const productReport = [
  { name: "Panqueca de frango ao molho vermelho", units: 182, revenue: 4823 },
  { name: "Combo 10 marmitas", units: 94, revenue: 21526 },
  { name: "Strogonoff de carne com arroz branco", units: 86, revenue: 2279 },
  { name: "Escondidinho de frango com purê de batata-doce", units: 77, revenue: 2040 },
  { name: "Caldo de abóbora com frango desfiado", units: 64, revenue: 1152 },
];

export const PRODUCTS_STORAGE_KEY = "housefit-products-v4";

export function sanitizeProducts(savedList: Product[]): Product[] {
  const comboUpdates: Record<string, Partial<Product>> = {
    "combo-20": { name: "Combo 20 marmitas", price: 449 },
    "combo-10": { name: "Combo 10 marmitas", price: 229 },
    "combo-5": { name: "Combo 05 marmitas", price: 119 },
    "combo-caldos": { name: "Combo 10 caldos", price: 159 },
    "combo-caldos-20": { name: "Combo 20 caldos", price: 299 },
  };

  const updated = savedList.map((p) => {
    let cleanName = p.name
      .replace(/Combo a partir de\s*/gi, "Combo ")
      .replace(/Combo de 0?5 marmitas/gi, "Combo 05 marmitas")
      .replace(/Combo de 10 marmitas/gi, "Combo 10 marmitas")
      .replace(/Combo de 20 marmitas/gi, "Combo 20 marmitas")
      .replace(/Combo de 10 caldos/gi, "Combo 10 caldos")
      .replace(/Combo de 20 caldos/gi, "Combo 20 caldos")
      .replace(/Combo 5 marmitas/gi, "Combo 05 marmitas");

    const override = comboUpdates[p.id];
    if (override) {
      return {
        ...p,
        ...override,
        name: override.name || cleanName,
      };
    }
    return { ...p, name: cleanName };
  });

  // Garantir que combo-caldos-20 exista na lista
  if (!updated.some((p) => p.id === "combo-caldos-20")) {
    const soupCombo20 = initialProducts.find((p) => p.id === "combo-caldos-20");
    if (soupCombo20) {
      const idx = updated.findIndex((p) => p.id === "combo-caldos");
      if (idx !== -1) {
        updated.splice(idx + 1, 0, soupCombo20);
      } else {
        updated.push(soupCombo20);
      }
    }
  }

  return updated;
}

export function getInitialOrStoredProducts(): Product[] {
  if (typeof window === "undefined") return initialProducts;
  try {
    const v4 = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (v4) {
      const parsed = JSON.parse(v4) as Product[];
      return sanitizeProducts(parsed);
    }
    const legacy = window.localStorage.getItem("housefit-products");
    const base = legacy ? (JSON.parse(legacy) as Product[]) : initialProducts;
    const sanitized = sanitizeProducts(base);
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(sanitized));
    return sanitized;
  } catch {
    return initialProducts;
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}

export const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

