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

export type OrderStatus =
  | "Pedido Recebido"
  | "Em Preparo"
  | "Aguardando"
  | "Na Entrega"
  | "Concluído"
  | "Recebido"
  | "Preparando"
  | "Pronto"
  | "Em entrega";

export const ORDER_STATUSES: OrderStatus[] = [
  "Pedido Recebido",
  "Em Preparo",
  "Aguardando",
  "Na Entrega",
  "Concluído",
];

export function normalizeOrderStatus(
  status: string
): "Pedido Recebido" | "Em Preparo" | "Aguardando" | "Na Entrega" | "Concluído" {
  if (status === "Recebido" || status === "Pedido Recebido") return "Pedido Recebido";
  if (status === "Preparando" || status === "Em Preparo") return "Em Preparo";
  if (status === "Pronto" || status === "Aguardando") return "Aguardando";
  if (status === "Em entrega" || status === "Na Entrega") return "Na Entrega";
  return "Concluído";
}

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

const mealImage = "/marmitas/marmita-1.jpg";
const bowlImage = "/marmitas/marmita-3.jpg";
const proteinImage = "/marmitas/marmita-4.jpg";
const soupImage = "/marmitas/caldo-1.jpg";
const snackImage = "/marmitas/marmita-5.jpg";
const juiceImage = "/marmitas/marmita-1.jpg";

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
  product("combo-5", "Combo 05 marmitas", "Combos", "O jeito gostoso de começar uma rotina saudável e prática.", 119, 23, 78, "/combo-5-marmitas.jpg", "Para experimentar"),
  product("combo-10", "Combo 10 marmitas", "Combos", "Refeições práticas para deixar a semana mais leve e saborosa.", 229, 18, 150, "/combo-10-marmitas.jpg", "Favorito"),
  product("combo-20", "Combo 20 marmitas", "Combos", "Escolha seus sabores favoritos e garanta o mês todo no freezer com máxima economia.", 449, 12, 290, "/combo-20-marmitas.jpg", "Mais economia"),
  product("combo-caldos", "Combo 10 caldos", "Combos", "Dias aconchegantes com caldo congelado e pronto em minutos.", 159, 7, 98, "/combo-10-caldos.jpg", "Favorito"),
  product("combo-caldos-20", "Combo 20 caldos", "Combos", "Variedade de caldos para aquecer suas noites com o melhor custo-benefício.", 299, 10, 185, "/combo-20-caldos.jpg", "Mais economia"),
  product("frango-escond-batatadoce", "Escondidinho de frango com purê de batata-doce", "Frango", "120g de frango, 160g de purê de batata-doce e queijo.", 26.5, 28, 12.1, "/marmitas/marmita-3.jpg"),
  product("frango-cubos-carioca", "Arroz branco, feijão, frango em cubos e legumes", "Frango", "Arroz branco, feijão, frango em cubos e legumes", 26.5, 47, 10.8, "/marmitas/marmita-4.jpg"),
  product("frango-galinhada-preto", "Galinhada com feijão preto", "Frango", "180g de galinhada com 120g de feijão preto.", 26.5, 38, 10.9, "/marmitas/marmita-5.jpg"),
  product("frango-fricasse", "Fricassê de frango com arroz branco", "Frango", "180g de fricassê, arroz branco e toque de muçarela.", 26.5, 28, 11.7, "/marmitas/marmita-1.jpg"),
  product("frango-escond-inglesa", "Escondidinho de frango com purê de batata inglesa e queijo", "Frango", "Escondidinho de frango com purê de batata inglesa e queijo", 26.5, 46, 11.9, "/marmitas/marmita-2.jpg"),
  product("frango-escond-abobora", "Escondidinho de frango com purê de abóbora", "Frango", "Frango desfiado, purê de abóbora cabotiá e queijo.", 26.5, 54, 11.3, "/marmitas/marmita-4.jpg"),
  product("frango-strogonoff", "Strogonoff de frango com arroz branco e legumes", "Frango", "Strogonoff de frango com arroz branco e legumes", 26.5, 18, 11.7, "/marmitas/marmita-1.jpg"),
  product("marmita-frango-pure-cenoura", "Arroz branco, feijão,  frango grelhado e purê de cenoura", "Frango", "Arroz branco, feijão,  frango grelhado e purê de cenoura", 26.5, 50, 11.5, "/marmitas/marmita-2.jpg"),
  product("marmita-yakisoba-frango", "Yaksoba de frango", "Frango", "Yaksoba de frango", 26.5, 50, 11.8, "/marmitas/marmita-3.jpg"),
  product("marmita-frango-curry", "Arroz, feijão, frango com crry e legumes", "Frango", "Arroz, feijão, frango com crry e legumes", 26.5, 50, 11.6, "/marmitas/marmita-4.jpg"),
  product("marmita-batata-doce-frango", "Batata doce em cubos, frango grelhado e legumes", "Frango", "Batata doce em cubos, frango grelhado e legumes", 26.5, 50, 11.2, "/marmitas/marmita-5.jpg"),
  product("marmita-frango-queijo-brocolis", "Arroz, feijão e frango ao molho de queijo com brócolis", "Frango", "Arroz, feijão e frango ao molho de queijo com brócolis", 26.5, 50, 12.0, "/marmitas/marmita-3.jpg"),
  product("carne-pan-vermelho", "Panqueca de carne moída ao molho vermelho", "Carne", "Panqueca de carne moída ao molho vermelho", 26.5, 16, 12.4, "/marmitas/marmita-2.jpg"),
  product("carne-pan-branco", "Panqueca de carne moída ao molho branco", "Carne", "Panqueca de carne moída ao molho branco", 26.5, 40, 12.6, "/marmitas/marmita-3.jpg"),
  product("carne-strogonoff", "Strogonoff de carne com arroz branco", "Carne", "180g de strogonoff de carne com 120g de arroz.", 26.5, 56, 13.2, "/marmitas/marmita-4.jpg"),
  product("carne-escond-doce", "Escondidinho de carne moída com purê de batata-doce", "Carne", "Patinho moído, purê de batata-doce e queijo.", 26.5, 28, 13.1, "/marmitas/marmita-1.jpg"),
  product("carne-panela-legumes", "Carne de panela, arroz, feijão e legumes", "Carne", "Carne de panela, arroz, feijão carioca e legumes.", 26.5, 79, 12.7, "/marmitas/marmita-2.jpg"),
  product("carne-patinho-carioca", "Arroz, feijão carioca, carne moída ao molho e legumes", "Carne", "Arroz, feijão carioca, carne moída ao molho e legumes", 26.5, 61, 11.9, "/marmitas/marmita-4.jpg"),
  product("carne-patinho-preto", "Arroz, feijão preto, carne moída ao molho e legumes", "Carne", "Arroz, feijão preto, carne moída ao molho e legumes", 26.5, 57, 11.9, "/marmitas/marmita-5.jpg"),
  product("carne-escond-inglesa", "Escondidinho de carne moída ao molho com purê de batata inglesa e queijo", "Carne", "Escondidinho de carne moída ao molho com purê de batata inglesa e queijo", 26.5, 36, 12.7, "/marmitas/marmita-2.jpg"),
  product("carne-escond-mandioca-moida", "Escondidinho de carne moída com purê de mandioca", "Carne", "Patinho moído, purê de mandioca e queijo.", 26.5, 12, 12.8, "/marmitas/marmita-4.jpg"),
  product("carne-escond-abobora-moida", "Escondidinho de carne moída com purê de abóbora", "Carne", "Patinho moído, purê de abóbora e queijo.", 26.5, 34, 12.3, "/marmitas/marmita-5.jpg"),
  product("carne-macarrão", "Macarrão integral ao molho bolonhesa", "Carne", "Macarrão integral, patinho, molho de tomate e queijo.", 26.5, 13, 11.8, "/marmitas/marmita-1.jpg"),
  product("carne-patinho-abobora", "Arroz branco, carne moída ao molho e legumes", "Carne", "Arroz branco, carne moída ao molho e legumes", 26.5, 55, 11.6, "/marmitas/marmita-3.jpg"),
  product("marmita-feijoada-fit", "Feijoada Fit, com lombo suíno e paio, arroz branco e couve refogada", "Carne", "Feijoada Fit, com lombo suíno e paio, arroz branco e couve refogada", 26.5, 50, 12.5, "/marmitas/marmita-1.jpg"),
  product("marmita-porco-mel-mostarda", "Arroz, feijão, carne de porco com mel e mostarda e legumes", "Carne", "Arroz, feijão, carne de porco com mel e mostarda e legumes", 26.5, 50, 12.8, "/marmitas/marmita-1.jpg"),
  product("marmita-picadinho-legumes", "Arroz, feijão e picadinho de carne com legumes", "Carne", "Arroz, feijão e picadinho de carne com legumes", 26.5, 50, 12.4, "/marmitas/marmita-2.jpg"),
  product("caldo-carioca", "Caldo de feijão carioca com bacon e calabresa", "Caldos", "350ml de caldo encorpado para aquecer a rotina.", 18, 28, 7.1, "/marmitas/caldo-1.jpg"),
  product("caldo-abobora-frango", "Caldo de abóbora com frango desfiado", "Caldos", "350ml de caldo de abóbora com frango.", 18, 26, 6.4, "/marmitas/caldo-2.jpg"),
  product("caldo-abobora-carne", "Caldo de abóbora com patinho moído", "Caldos", "350ml de caldo de abóbora com patinho.", 18, 39, 6.9, "/marmitas/caldo-1.jpg"),
  product("caldo-preto", "Caldo de feijão preto com bacon e calabresa", "Caldos", "350ml de caldo de feijão preto.", 18, 33, 7.3, "/marmitas/caldo-2.jpg"),
  product("caldo-mandioca", "Caldo de mandioca com carne desfiada", "Caldos", "350ml de mandioca com carne desfiada.", 18, 5, 7.2, "/marmitas/caldo-1.jpg", "Últimas unidades"),
  product("lanche-coxinha", "Coxinha de frango com requeijão", "Lanches", "100g, com massa de batata e recheio cremoso.", 15, 32, 6.5, "/marmitas/marmita-4.jpg"),
  product("lanche-torta-palmito", "Torta de palmito integral", "Lanches", "120g, massa integral e recheio de palmito.", 15, 12, 6.1, "/marmitas/marmita-5.jpg"),
  product("lanche-torta-carne", "Torta de carne louca integral", "Lanches", "120g, massa integral com carne bovina temperada.", 15, 11, 6.6, "/marmitas/marmita-1.jpg"),
  product("lanche-quiche-alho", "Quiche de alho-poró integral", "Lanches", "110g, recheio cremoso de alho-poró.", 15, 23, 6.3, "/marmitas/marmita-2.jpg"),
  product("lanche-quiche-marguerita", "Quiche de marguerita integral", "Lanches", "110g, tomate, ricota e manjericão.", 15, 23, 6.2, "/marmitas/marmita-3.jpg"),
  product("lanche-pizza-queijo", "Mini pizza de queijo integral", "Lanches", "150g com queijo, tomate e massa integral.", 16.5, 45, 7.2, "/marmitas/marmita-4.jpg"),
  product("lanche-pizza-marguerita", "Mini pizza de marguerita integral", "Lanches", "150g com tomate, ricota e manjericão.", 16.5, 40, 7.1, "/marmitas/marmita-5.jpg"),
  product("lanche-pizza-frango", "Mini pizza de frango com requeijão integral", "Lanches", "150g com frango e requeijão cremoso.", 16.5, 42, 7.4, "/marmitas/marmita-1.jpg"),
  product("lanche-pizza-calabresa", "Mini pizza de calabresa com requeijão", "Lanches", "150g com calabresa e requeijão.", 16.5, 51, 7.6, "/marmitas/marmita-2.jpg"),
  product("lanche-limao", "Torta de limão zero açúcar", "Lanches", "80g, doce equilibrado para fechar a refeição.", 16, 10, 6.4, "/marmitas/marmita-3.jpg"),
  product("lanche-chocolate", "Torta de chocolate zero açúcar", "Lanches", "80g, chocolate amargo e cacau.", 16, 9, 6.7, "/marmitas/marmita-4.jpg"),
  product("suco-amarelas", "Suco de frutas amarelas", "Sucos", "300ml de abacaxi, manga, maracujá e água.", 13, 17, 4.1, "/marmitas/marmita-5.jpg"),
  product("suco-vermelhas", "Suco de frutas vermelhas", "Sucos", "300ml de morango, amora, framboesa e água.", 13, 15, 4.4, "/marmitas/marmita-1.jpg"),
  product("suco-morango", "Suco de morango", "Sucos", "300ml de morango e água.", 13, 19, 3.9, "/marmitas/marmita-2.jpg"),
  product("suco-abacaxi", "Suco de abacaxi com hortelã", "Sucos", "300ml de abacaxi, hortelã e água.", 13, 10, 3.8, "/marmitas/marmita-3.jpg"),
];

export const initialOrders: Order[] = [
  { id: "#HF-1048", customer: "Mariana Costa", customerPhone: "(65) 99821-3344", initials: "MC", items: 3, itemNames: ["Panqueca de carne moída ao molho vermelho", "Suco de morango"], total: 66, status: "Em Preparo", channel: "Delivery", time: "há 8 min", payment: "Pix" },
  { id: "#HF-1047", customer: "Rafael Mendes", customerPhone: "(65) 99654-1122", initials: "RM", items: 5, itemNames: ["Combo 05 marmitas (3x Fricassê de frango, 2x Strogonoff de carne)"], subtotal: 119, discountAmount: 11.9, couponCode: "LUCASFIT", partnerId: "p1", partnerName: "Lucas Personal Trainer", total: 107.1, status: "Pedido Recebido", channel: "Retirada", time: "há 14 min", payment: "Cartão" },
  { id: "#HF-1046", customer: "Bianca Alves", customerPhone: "(65) 99123-5566", initials: "BA", items: 2, itemNames: ["Strogonoff de carne com arroz branco", "Caldo de abóbora"], total: 44.5, status: "Aguardando", channel: "Delivery", time: "há 21 min", payment: "Pix" },
  { id: "#HF-1045", customer: "Lucas Vieira", customerPhone: "(65) 99789-0011", initials: "LV", items: 4, itemNames: ["Combo 10 marmitas (5x Frango em cubos, 5x Fricassê de frango)"], subtotal: 229, discountAmount: 34.35, couponCode: "CAMILANUTRI", partnerId: "p2", partnerName: "Dra. Camila Nutri", total: 194.65, status: "Na Entrega", channel: "Delivery", time: "há 36 min", payment: "Vale-refeição" },
  { id: "#HF-1044", customer: "Ana Souza", customerPhone: "(65) 98455-7788", initials: "AS", items: 1, itemNames: ["Escondidinho de frango com purê de batata-doce"], total: 26.5, status: "Concluído", channel: "Retirada", time: "ontem", payment: "Pix" },
  { id: "#HF-1043", customer: "Diego Rocha", customerPhone: "(65) 99344-9900", initials: "DR", items: 3, itemNames: ["Arroz, feijão carioca, carne moída ao molho e legumes"], total: 92.5, status: "Concluído", channel: "Delivery", time: "ontem", payment: "Cartão" },
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
  { name: "Panqueca de carne moída ao molho vermelho", units: 182, revenue: 4823 },
  { name: "Combo 10 marmitas", units: 94, revenue: 21526 },
  { name: "Strogonoff de carne com arroz branco", units: 86, revenue: 2279 },
  { name: "Escondidinho de frango com purê de batata-doce", units: 77, revenue: 2040 },
  { name: "Caldo de abóbora com frango desfiado", units: 64, revenue: 1152 },
];

export const PRODUCTS_STORAGE_KEY = "housefit-products-v10";

const REMOVED_PRODUCT_SLUGS = new Set([
  "carne-arroz-abobora",
  "carne-batata-rustica",
  "carne-desfiada-feijao",
  "carne-escond-abobora",
  "carne-escond-mandioca",
  "carne-farofa",
  "carne-farofa-moida",
  "carne-creme-milho",
  "carne-patinho-legumes",
  "carne-tiras-mandioca",
  "frango-batata-strogonoff",
  "frango-escond-mandioca",
  "frango-farofa",
  "frango-cubos-preto",
  "frango-galinhada",
  "frango-pan-branco",
  "frango-pan-vermelho",
  "frango-sobrecoxa-milho",
  "frango-sobrecoxa-carioca",
]);

const PRODUCT_RENAMES: Record<string, { name: string; description: string }> = {
  "carne-escond-inglesa": {
    name: "Escondidinho de carne moída ao molho com purê de batata inglesa e queijo",
    description: "Escondidinho de carne moída ao molho com purê de batata inglesa e queijo",
  },
  "carne-pan-branco": {
    name: "Panqueca de carne moída ao molho branco",
    description: "Panqueca de carne moída ao molho branco",
  },
  "carne-pan-vermelho": {
    name: "Panqueca de carne moída ao molho vermelho",
    description: "Panqueca de carne moída ao molho vermelho",
  },
  "carne-patinho-abobora": {
    name: "Arroz branco, carne moída ao molho e legumes",
    description: "Arroz branco, carne moída ao molho e legumes",
  },
  "carne-patinho-carioca": {
    name: "Arroz, feijão carioca, carne moída ao molho e legumes",
    description: "Arroz, feijão carioca, carne moída ao molho e legumes",
  },
  "carne-patinho-preto": {
    name: "Arroz, feijão preto, carne moída ao molho e legumes",
    description: "Arroz, feijão preto, carne moída ao molho e legumes",
  },
  "frango-escond-inglesa": {
    name: "Escondidinho de frango com purê de batata inglesa e queijo",
    description: "Escondidinho de frango com purê de batata inglesa e queijo",
  },
  "frango-cubos-carioca": {
    name: "Arroz branco, feijão, frango em cubos e legumes",
    description: "Arroz branco, feijão, frango em cubos e legumes",
  },
  "frango-strogonoff": {
    name: "Strogonoff de frango com arroz branco e legumes",
    description: "Strogonoff de frango com arroz branco e legumes",
  },
};

export function sanitizeProducts(savedList: Product[]): Product[] {
  const comboUpdates: Record<string, Partial<Product>> = {
    "combo-20": { name: "Combo 20 marmitas", price: 449, image: "/combo-20-marmitas.jpg" },
    "combo-10": { name: "Combo 10 marmitas", price: 229, image: "/combo-10-marmitas.jpg" },
    "combo-5": { name: "Combo 05 marmitas", price: 119, image: "/combo-5-marmitas.jpg" },
    "combo-caldos": { name: "Combo 10 caldos", price: 159, image: "/combo-10-caldos.jpg" },
    "combo-caldos-20": { name: "Combo 20 caldos", price: 299, image: "/combo-20-caldos.jpg" },
  };

  const filtered = savedList.filter((p) => !REMOVED_PRODUCT_SLUGS.has(p.id));

  const updated = filtered.map((p) => {
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

    const rename = PRODUCT_RENAMES[p.id];
    let name = rename ? rename.name : cleanName;
    let description = rename ? rename.description : p.description;

    // Se a imagem não for uma das fotos reais locais, atualizar com a imagem do catálogo inicial
    let image = p.image;
    if (p.category === "Caldos" && (!image || !image.startsWith("/marmitas/caldo-"))) {
      const matchInit = initialProducts.find((ip) => ip.id === p.id || ip.name.toLowerCase() === p.name.toLowerCase());
      if (matchInit) {
        image = matchInit.image;
      } else {
        image = "/marmitas/caldo-1.jpg";
      }
    } else if (p.category !== "Combos" && (!image || !image.startsWith("/marmitas/"))) {
      const matchInit = initialProducts.find((ip) => ip.id === p.id || ip.name.toLowerCase() === p.name.toLowerCase());
      if (matchInit) {
        image = matchInit.image;
      } else {
        image = "/marmitas/marmita-1.jpg";
      }
    }

    return { ...p, name, description, image };
  });

  // Garantir que combo-caldos-20 e novos produtos adicionados existam na lista
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

  // Garantir novos produtos do catálogo inicial
  for (const initP of initialProducts) {
    if (!REMOVED_PRODUCT_SLUGS.has(initP.id) && !updated.some((p) => p.id === initP.id)) {
      updated.push(initP);
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

