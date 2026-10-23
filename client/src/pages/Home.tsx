import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Boxes,
  Check,
  ChevronDown,
  Clock3,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
  AlertCircle,
  Shield,
  Eye,
  ZoomIn,
  RotateCcw,
  Truck,
  Flame,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import {
  formatBRL,
  getInitialOrStoredProducts,
  initialCustomers,
  initialOrders,
  initialPartners,
  initialProducts,
  loadFromStorage,
  saveToStorage,
  PRODUCTS_STORAGE_KEY,
  type Order,
  type OrderStatus,
  type Partner,
  type Product,
} from "@/lib/demoData";
import {
  fetchDbProducts,
  fetchDbOrders,
  createDbOrder,
  recordCustomerPurchase,
  fetchDbPartners,
  authenticateDbUser,
  registerDbUser,
  checkUserPhoneExists,
  updateDbUser,
} from "@/lib/supabaseService";
import { PaymentModal } from "@/components/PaymentModal";

export type CartItem = {
  key: string;
  productId: string;
  product: Product;
  quantity: number;
  isCombo?: boolean;
  comboTarget?: number;
  comboSelections?: Array<{
    product: Product;
    quantity: number;
  }>;
};

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  role: "user" | "admin";
};

const initialAuthUsers: AuthUser[] = [
  {
    id: "admin-1",
    name: "Administrador HouseFit",
    phone: "(65) 99986-5093",
    email: "admin@housefit.com.br",
    password: "admin",
    role: "admin",
  },
];

export function getComboTargetCount(product: Product): number {
  if (product.id === "combo-20") return 20;
  if (product.id === "combo-10") return 10;
  if (product.id === "combo-5") return 5;
  if (product.id === "combo-caldos") return 10;
  if (product.id === "combo-caldos-20") return 20;
  const match = product.name.match(/\d+/);
  return match ? parseInt(match[0], 10) : 10;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>(() => getInitialOrStoredProducts());
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>(() => loadFromStorage("housefit-cart", []));
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedPartner, setAppliedPartner] = useState<Partner | null>(null);
  const [couponError, setCouponError] = useState("");
  const [notice, setNotice] = useState("");
  const [comboModalProduct, setComboModalProduct] = useState<Product | null>(null);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<Order | null>(null);
  const [deliveryCity, setDeliveryCity] = useState<"cuiaba" | "varzea_grande" | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [postPaymentModalOpen, setPostPaymentModalOpen] = useState(false);

  const deliveryFee = useMemo(() => {
    if (deliveryCity === "cuiaba") return 12;
    if (deliveryCity === "varzea_grande") return 17;
    return 0;
  }, [deliveryCity]);

  useEffect(() => {
    let isMounted = true;
    fetchDbProducts().then((dbProducts) => {
      if (isMounted && dbProducts.length > 0) {
        setProducts(dbProducts);
        saveToStorage(PRODUCTS_STORAGE_KEY, dbProducts);
      }
    });
    fetchDbPartners().then((dbPartners) => {
      if (isMounted && dbPartners.length > 0) {
        saveToStorage("housefit-partners", dbPartners);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Authentication State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    loadFromStorage<AuthUser | null>("housefit-auth-current", null)
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // User account modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingTargetOrder, setTrackingTargetOrder] = useState<Order | null>(null);

  // Orders State & Real-time sync
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage<Order[]>("housefit-orders", initialOrders)
  );

  useEffect(() => {
    const syncOrders = () => {
      const stored = loadFromStorage<Order[]>("housefit-orders", initialOrders);
      setOrders(stored);
    };
    window.addEventListener("storage", syncOrders);
    window.addEventListener("housefit-orders-updated", syncOrders);

    fetchDbOrders().then((data) => {
      if (data && data.length > 0) {
        setOrders(data);
        saveToStorage("housefit-orders", data);
      }
    });

    const timer = setInterval(() => {
      fetchDbOrders().then((data) => {
        if (data && data.length > 0) {
          setOrders(data);
          saveToStorage("housefit-orders", data);
        }
      });
    }, 8000);

    return () => {
      window.removeEventListener("storage", syncOrders);
      window.removeEventListener("housefit-orders-updated", syncOrders);
      clearInterval(timer);
    };
  }, []);

  const saveCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    saveToStorage("housefit-cart", nextCart);
  };

  // Only display Combos on the public home page!
  const visibleCombos = useMemo(() => {
    const list = products.filter((product) => {
      if (product.category !== "Combos") return false;
      const normalized = `${product.name} ${product.description}`.toLowerCase();
      return normalized.includes(search.toLowerCase()) && product.available;
    });

    const getOrderPriority = (p: Product) => {
      const name = p.name.toLowerCase();
      const id = String(p.id).toLowerCase();
      if (name.includes("05 marmita") || name.includes("5 marmita") || id === "combo-5" || id === "3") return 1;
      if (name.includes("10 marmita") || id === "combo-10" || id === "2") return 2;
      if (name.includes("20 marmita") || id === "combo-20" || id === "1") return 3;
      if (name.includes("10 caldo") || id === "combo-caldos" || id === "4") return 4;
      if (name.includes("20 caldo") || id === "combo-caldos-20" || id === "5") return 5;
      return 99;
    };

    return list.sort((a, b) => getOrderPriority(a) - getOrderPriority(b));
  }, [products, search]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedPartner) return 0;
    return (cartTotal * appliedPartner.discountPercent) / 100;
  }, [cartTotal, appliedPartner]);

  const finalTotal = useMemo(() => {
    return Math.max(0, cartTotal - discountAmount + deliveryFee);
  }, [cartTotal, discountAmount, deliveryFee]);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Digite o código do cupom.");
      return;
    }
    const partners = loadFromStorage<Partner[]>("housefit-partners", initialPartners);
    const found = partners.find(
      (p) => p.coupon.trim().toUpperCase() === code && p.active
    );
    if (found) {
      setAppliedPartner(found);
      setCouponError("");
      setNotice(`Cupom ${found.coupon} ativado! ${found.discountPercent}% OFF via ${found.name}.`);
      window.setTimeout(() => setNotice(""), 3500);
    } else {
      setCouponError("Cupom inválido ou não encontrado.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedPartner(null);
    setCouponInput("");
    setCouponError("");
  };

  const updateCartItemQuantity = (key: string, delta: number) => {
    const nextCart = cart
      .map((item) => {
        if (item.key === key) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    saveCart(nextCart);
  };

  const removeCartItem = (key: string) => {
    saveCart(cart.filter((item) => item.key !== key));
  };

  const handleAddCombo = (combo: Product, selections: Array<{ product: Product; quantity: number }>) => {
    const targetCount = getComboTargetCount(combo);
    const newCartItem: CartItem = {
      key: `${combo.id}-${Date.now()}`,
      productId: combo.id,
      product: combo,
      quantity: 1,
      isCombo: true,
      comboTarget: targetCount,
      comboSelections: selections,
    };
    saveCart([...cart, newCartItem]);
    setComboModalProduct(null);
    setNotice(`Combo com ${targetCount} marmitas adicionado ao pedido!`);
    window.setTimeout(() => setNotice(""), 3500);
    setCartOpen(true);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    saveToStorage("housefit-auth-current", user);
    setAuthModalOpen(false);

    // Auto-fill checkout fields if empty
    if (!customerName) setCustomerName(user.name);
    if (!customerPhone) setCustomerPhone(user.phone);

    if (user.role === "admin") {
      setNotice("Login como Administrador realizado com sucesso!");
      setLocation("/admin");
    } else {
      setNotice(`Bem-vindo(a), ${user.name}!`);
      window.setTimeout(() => setNotice(""), 3500);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveToStorage("housefit-auth-current", null);
    setUserMenuOpen(false);
    setNotice("Sessão encerrada com sucesso.");
    window.setTimeout(() => setNotice(""), 3000);
  };

  // Redireciona para o checkout da InfinitePay com valor total consolidado
  const redirectToInfinitePay = async (cName: string, cPhone: string) => {
    setIsRedirectingPayment(true);
    const cityName = deliveryCity === "cuiaba" ? "Cuiabá" : "Várzea Grande";
    const tempOrderId = `HF-${Date.now().toString().slice(-4)}`;

    try {
      const resp = await fetch("/api/infinitepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: tempOrderId,
          amount: finalTotal,
          description: `Pedido ${tempOrderId} - HouseFit (${cityName})`,
          customerName: cName,
          customerPhone: cPhone,
        }),
      });
      const data = await resp.json();
      if (data?.success && data?.url) {
        saveCart([]);
        setCartOpen(false);
        setCheckoutOpen(false);
        setRegisterModalOpen(false);
        // Abre o checkout oficial da InfinitePay em outra aba
        window.open(data.url, "_blank");
        // Exibe o modal "Quase lá..." na página da HouseFit
        setPostPaymentModalOpen(true);
        return;
      }
      throw new Error(data?.message || "Não foi possível gerar o link");
    } catch (err) {
      console.warn("Redirecionando para a loja da InfinitePay...", err);
      saveCart([]);
      setCartOpen(false);
      setCheckoutOpen(false);
      setRegisterModalOpen(false);
      window.open("https://loja.infinitepay.io/lethicia-vieira-pol", "_blank");
      setPostPaymentModalOpen(true);
    } finally {
      setIsRedirectingPayment(false);
    }
  };

  // Verifica se o telefone já existe no banco de dados
  const handleCheckUserAndProceed = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !deliveryCity || cart.length === 0 || isRedirectingPayment) return;

    setIsRedirectingPayment(true);

    try {
      const { exists, user } = await checkUserPhoneExists(customerPhone);

      if (exists) {
        // Usuário já cadastrado no banco: já loga se tiver os dados e vai direto ao pagamento
        if (user && !currentUser) {
          setCurrentUser(user);
          saveToStorage("housefit-auth-current", user);
        }
        await redirectToInfinitePay(customerName, customerPhone);
      } else {
        // Telefone não cadastrado: fecha checkout e abre modal de definição de e-mail e senha
        setIsRedirectingPayment(false);
        setCheckoutOpen(false);
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterError("");
        setRegisterModalOpen(true);
      }
    } catch (err) {
      console.error("Erro ao verificar telefone:", err);
      await redirectToInfinitePay(customerName, customerPhone);
    }
  };

  // Finaliza cadastro de novo usuário e redireciona ao pagamento
  const handleCompleteRegisterAndPay = async () => {
    if (!registerEmail.trim() || !registerPassword.trim() || isSubmittingRegister || isRedirectingPayment) return;

    if (!registerEmail.includes("@") || !registerEmail.includes(".")) {
      setRegisterError("Por favor, informe um e-mail válido.");
      return;
    }

    if (registerPassword.length < 4) {
      setRegisterError("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    setIsSubmittingRegister(true);
    setRegisterError("");

    try {
      const newUser = await registerDbUser({
        name: customerName,
        email: registerEmail.trim(),
        phone: customerPhone,
        password: registerPassword,
      });

      if (newUser) {
        setCurrentUser(newUser);
        saveToStorage("housefit-auth-current", newUser);
      }

      await redirectToInfinitePay(customerName, customerPhone);
    } catch (err: any) {
      setRegisterError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  const handlePaymentSuccess = (paymentMethod: string) => {
    if (pendingPaymentOrder) {
      const updatedOrder = { ...pendingPaymentOrder, payment: paymentMethod };
      const orders = loadFromStorage<Order[]>("housefit-orders", initialOrders);
      const nextOrders = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      saveToStorage("housefit-orders", nextOrders);
    }
    saveCart([]);
    setPendingPaymentOrder(null);
    setCartOpen(false);
    setCustomerName(currentUser?.name || "");
    setCustomerPhone(currentUser?.phone || "");
    setAppliedPartner(null);
    setCouponInput("");
    setNotice("Pagamento e pedido confirmados com sucesso! Enviando para o WhatsApp da HouseFit.");
    window.setTimeout(() => setNotice(""), 6000);
  };

  return (
    <div className="app-shell public-shell">
      {/* Header: only logo, "Entrar", and Cart */}
      <header className="public-header">
        <div className="header-inner">
          <Link href="/" className="brand-mark" aria-label="HouseFit início">
            <img src="/logo.png" alt="HouseFit - Marmita Saudável" className="brand-logo" />
          </Link>

          <div className="header-actions">
            {currentUser ? (
              <div style={{ position: "relative" }}>
                <button
                  className="user-dropdown-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <User size={15} />
                  <span>{currentUser.name.split(" ")[0]}</span>
                  {currentUser.role === "admin" && (
                    <span style={{ background: "var(--ink)", color: "white", padding: "1px 6px", borderRadius: 4, fontSize: 9 }}>
                      Admin
                    </span>
                  )}
                  <ChevronDown size={14} />
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: 8,
                      width: 210,
                      background: "white",
                      borderRadius: 14,
                      boxShadow: "0 12px 36px rgba(0,0,0,.18)",
                      border: "1px solid var(--line)",
                      padding: "6px",
                      zIndex: 40,
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px 10px",
                        borderBottom: "1px solid var(--line)",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {currentUser.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: 1,
                        }}
                      >
                        {currentUser.email}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        color: "var(--ink)",
                        background: "transparent",
                        cursor: "pointer",
                        border: "none",
                        textAlign: "left",
                      }}
                    >
                      <User size={14} style={{ color: "var(--hunter)" }} /> Perfil
                    </button>

                    <button
                      onClick={() => {
                        setHistoryModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        color: "var(--ink)",
                        background: "transparent",
                        cursor: "pointer",
                        border: "none",
                        textAlign: "left",
                      }}
                    >
                      <Clock3 size={14} style={{ color: "var(--hunter)" }} /> Histórico
                    </button>

                    <button
                      onClick={() => {
                        setTrackingTargetOrder(null);
                        setTrackingModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        color: "var(--ink)",
                        background: "transparent",
                        cursor: "pointer",
                        border: "none",
                        textAlign: "left",
                      }}
                    >
                      <Truck size={14} style={{ color: "var(--hunter)" }} /> Acompanhar
                    </button>

                    {currentUser.role === "admin" && (
                      <Link
                        href="/admin"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "9px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          color: "var(--ink)",
                          textDecoration: "none",
                        }}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Shield size={14} /> Painel Admin
                      </Link>
                    )}

                    <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        color: "var(--coral)",
                        background: "transparent",
                        cursor: "pointer",
                        border: "none",
                        textAlign: "left",
                      }}
                    >
                      <LogOut size={14} /> Sair da conta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="login-nav-btn"
                onClick={() => setAuthModalOpen(true)}
              >
                <User size={15} /> Entrar
              </button>
            )}

            <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Abrir carrinho">
              <ShoppingBag size={19} />
              <span>Seu pedido</span>
              {cartCount > 0 && <strong>{cartCount}</strong>}
            </button>
          </div>
        </div>
      </header>

      <main>


        {/* Menu / Combos Section */}
        <section className="menu-section" id="cardapio">
          <div className="section-heading">
            <div>
              <p className="kicker">Economia e Praticidade</p>
              <h2>Combos HouseFit</h2>
            </div>
            <div className="search-box">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar combo..." />
            </div>
          </div>

          <div className="menu-meta" style={{ marginTop: 20 }}>
            <span>{visibleCombos.length} opções de combos prontas para você montar</span>
          </div>

          <div className="product-grid">
            {visibleCombos.map((item) => {
              const inCartQty = cart
                .filter((ci) => ci.productId === item.id)
                .reduce((sum, ci) => sum + ci.quantity, 0);

              return (
                <ComboCard
                  key={item.id}
                  item={item}
                  inCartQty={inCartQty}
                  onOpenCombo={() => setComboModalProduct(item)}
                />
              );
            })}
          </div>

          {visibleCombos.length === 0 && (
            <div className="empty-state">
              <Search size={24} />
              <strong>Nenhum combo encontrado</strong>
              <span>Tente buscar por 05, 10, 20 marmitas ou caldos.</span>
            </div>
          )}
        </section>

        <section className="promise-section">
          <div>
            <p className="kicker">Nossa promessa</p>
            <h2>Comida gostosa também pode ser prática.</h2>
          </div>
          <p>Você não precisa escolher entre sabor e rotina. A HouseFit deixa sua semana mais leve, um combo de cada vez.</p>
        </section>
      </main>

      <footer className="public-footer" id="contato">
        <div className="footer-brand">
          <span className="brand-mark">
            <img src="/logo.png" alt="HouseFit - Marmita Saudável" className="brand-logo" />
          </span>
          <p>Seu almoço resolvido com comida de verdade.</p>
        </div>
        <div><small>ATENDIMENTO</small><strong>(65) 99986-5093</strong><span>contato@housefit.com.br</span></div>
        <div><small>ONDE ESTAMOS</small><strong>Cuiabá e Várzea Grande</strong><span>Delivery e retirada</span></div>
        <div><small>HORÁRIO</small><strong>Segunda a sexta</strong><span>9:00 às 17:00</span></div>
      </footer>

      {notice && (
        <div className="toast-success">
          <Check size={17} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")}><X size={15} /></button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <p className="kicker">Seu pedido</p>
                <h3>{cartCount ? `${cartCount} combo(s)` : "Ainda vazio"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                }}
                title="Volte para o cardápio"
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-soft)" }}>
                  Volte para o cardápio
                </span>
                <ArrowRight size={13} style={{ color: "var(--ink-soft)" }} />
                <span className="icon-button" style={{ width: 30, height: 30 }}>
                  <X size={18} />
                </span>
              </button>
            </div>

            {cart.length > 0 ? (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.key}>
                      <img src={item.product.image} alt={item.product.name} />
                      <div>
                        <div className="cart-combo-badge">
                          <Package size={11} /> {item.product.name}
                        </div>
                        <strong>{item.product.name}</strong>
                        <span>{formatBRL(item.product.price * item.quantity)}</span>

                        {item.comboSelections && item.comboSelections.length > 0 && (
                          <div className="cart-combo-items-list">
                            <strong>Marmitas escolhidas no combo:</strong>
                            {item.comboSelections.map((sel) => (
                              <div key={sel.product.id} className="cart-combo-item-line">
                                <span>{sel.product.name}</span>
                                <b>{sel.quantity}x</b>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          <div className="mini-stepper">
                            <button onClick={() => updateCartItemQuantity(item.key, -1)} aria-label="Diminuir">
                              <Minus size={13} />
                            </button>
                            <b>{item.quantity}</b>
                            <button onClick={() => updateCartItemQuantity(item.key, 1)} aria-label="Aumentar">
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeCartItem(item.key)}
                            className="icon-button"
                            style={{ width: 28, height: 28, color: "#8a9c94" }}
                            title="Remover combo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="coupon-box">
                  <small style={{ display: "block", marginBottom: 6, fontWeight: 800, color: "var(--ink-soft)" }}>
                    Cupom de parceiro ou desconto
                  </small>
                  {appliedPartner ? (
                    <div className="coupon-applied-tag">
                      <span><Check size={12} /> Cupom <b>{appliedPartner.coupon}</b> ({appliedPartner.discountPercent}% OFF via {appliedPartner.name})</span>
                      <button onClick={handleRemoveCoupon} title="Remover cupom"><X size={13} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="coupon-input-row">
                        <input
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                          placeholder="Ex.: LUCASFIT"
                        />
                        <button onClick={handleApplyCoupon}>Aplicar</button>
                      </div>
                      {couponError && (
                        <span style={{ display: "block", marginTop: 5, color: "var(--coral)", fontSize: 10, fontWeight: 800 }}>
                          {couponError}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="cart-summary">
                  {/* Seletor de Cidade de Entrega Obrigatório */}
                  <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px dashed var(--line)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <small style={{ fontWeight: 800, color: "var(--ink-soft)" }}>
                        Local de entrega <span style={{ color: "#e11d48" }}>*</span>
                      </small>
                      {!deliveryCity && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#d97706" }}>
                          Obrigatório selecionar
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setDeliveryCity("cuiaba")}
                        style={{
                          padding: "9px 10px",
                          borderRadius: 8,
                          border: `2px solid ${deliveryCity === "cuiaba" ? "#198038" : "var(--line)"}`,
                          background: deliveryCity === "cuiaba" ? "#f2f9f4" : "#ffffff",
                          color: deliveryCity === "cuiaba" ? "#198038" : "var(--ink)",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          textAlign: "center",
                          boxShadow: deliveryCity === "cuiaba" ? "0 0 0 2px rgba(25, 128, 56, 0.15)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        Cuiabá
                        <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: deliveryCity === "cuiaba" ? "#198038" : "#4b5563", marginTop: 2 }}>
                          + R$ 12,00
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryCity("varzea_grande")}
                        style={{
                          padding: "9px 10px",
                          borderRadius: 8,
                          border: `2px solid ${deliveryCity === "varzea_grande" ? "#198038" : "var(--line)"}`,
                          background: deliveryCity === "varzea_grande" ? "#f2f9f4" : "#ffffff",
                          color: deliveryCity === "varzea_grande" ? "#198038" : "var(--ink)",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          textAlign: "center",
                          boxShadow: deliveryCity === "varzea_grande" ? "0 0 0 2px rgba(25, 128, 56, 0.15)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        Várzea Grande
                        <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: deliveryCity === "varzea_grande" ? "#198038" : "#4b5563", marginTop: 2 }}>
                          + R$ 17,00
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span>Subtotal ({cartCount} combo{cartCount > 1 ? "s" : ""})</span>
                    <strong>{formatBRL(cartTotal)}</strong>
                  </div>
                  {appliedPartner && (
                    <div style={{ color: "#4d9b5f", marginTop: 4 }}>
                      <span>Desconto ({appliedPartner.discountPercent}% - {appliedPartner.coupon})</span>
                      <strong>-{formatBRL(discountAmount)}</strong>
                    </div>
                  )}
                  <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-soft)" }}>
                    <span>
                      Taxa de entrega
                      {deliveryCity === "cuiaba" ? " (Cuiabá)" : deliveryCity === "varzea_grande" ? " (Várzea Grande)" : ""}
                    </span>
                    {deliveryCity ? (
                      <strong style={{ color: "var(--ink)" }}>{deliveryFee > 0 ? formatBRL(deliveryFee) : "Grátis"}</strong>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>Selecione acima</span>
                    )}
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--line)" }}>
                    <span>Total final</span>
                    <strong style={{ fontSize: 24, color: "var(--ink)" }}>{formatBRL(finalTotal)}</strong>
                  </div>
                  <button
                    className="primary-button full"
                    disabled={!deliveryCity}
                    onClick={() => {
                      if (!deliveryCity) return;
                      setCheckoutOpen(true);
                    }}
                    style={{
                      marginTop: 10,
                      opacity: deliveryCity ? 1 : 0.65,
                      cursor: deliveryCity ? "pointer" : "not-allowed",
                    }}
                  >
                    {deliveryCity ? (
                      <>Continuar pedido <ArrowRight size={17} /></>
                    ) : (
                      "Selecione o local de entrega para continuar"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <ShoppingBag size={36} />
                <strong>Seu carrinho está vazio</strong>
                <span>Escolha um dos nossos combos acima e monte suas marmitas favoritas.</span>
                <button className="secondary-button" onClick={() => setCartOpen(false)}>Ver combos</button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCheckoutOpen(false)}><X size={18} /></button>
            <p className="kicker">Só falta um passo</p>
            <h3>Para quem vamos preparar?</h3>
            <p className="modal-description">Deixe seus dados para registrar o pedido e enviarmos o rastreio no WhatsApp.</p>
            <label>
              Seu nome completo
              <input
                autoFocus
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex.: Mariana Costa"
              />
            </label>
            <label style={{ marginTop: 14 }}>
              WhatsApp (com DDD)
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ex.: (65) 99986-0000"
              />
            </label>

            {appliedPartner && (
              <div style={{ margin: "14px 0", padding: "10px 12px", background: "#e5efb8", borderRadius: 8, fontSize: 11, color: "#364811", fontWeight: 800 }}>
                ✓ Desconto de {appliedPartner.discountPercent}% aplicado com cupom de {appliedPartner.name}
              </div>
            )}

            <div className="checkout-total">
              <div>
                <span>Total a pagar</span>
                <small style={{ display: "block", fontSize: 11, color: "#777", fontWeight: 500 }}>
                  {cartCount} combo(s) + taxa de entrega ({deliveryCity === "cuiaba" ? "Cuiabá" : "Várzea Grande"})
                </small>
              </div>
              <strong>{formatBRL(finalTotal)}</strong>
            </div>

            <button
              className="primary-button full"
              disabled={
                !customerName.trim() ||
                !customerPhone.trim() ||
                !deliveryCity ||
                isRedirectingPayment
              }
              onClick={handleCheckUserAndProceed}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: isRedirectingPayment ? "#8a9c94" : "#198038",
                borderColor: isRedirectingPayment ? "#8a9c94" : "#198038",
                cursor: isRedirectingPayment ? "wait" : "pointer",
                padding: "14px",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              {isRedirectingPayment ? (
                "Verificando cadastro..."
              ) : (
                <>Pagar com InfinitePay (Pix ou Cartão) <ArrowRight size={17} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar Conta HouseFit (Novo Usuário) */}
      {registerModalOpen && (
        <div className="modal-backdrop" onClick={() => setRegisterModalOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <button className="modal-close" onClick={() => setRegisterModalOpen(false)}><X size={18} /></button>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#e8f5e9", color: "#198038", borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 8 }}>
              🎉 Quase lá!
            </div>
            <h3 style={{ margin: "4px 0 6px" }}>Crie sua conta HouseFit</h3>
            <p className="modal-description" style={{ margin: "0 0 16px" }}>
              Identificamos que você é novo por aqui! Seus dados de contato já foram preenchidos. Complete com e-mail e senha para finalizar seu pedido:
            </p>

            <label>
              Seu nome
              <input value={customerName} disabled style={{ background: "#f8f9fa", cursor: "not-allowed" }} />
            </label>

            <label style={{ marginTop: 12 }}>
              WhatsApp
              <input value={customerPhone} disabled style={{ background: "#f8f9fa", cursor: "not-allowed" }} />
            </label>

            <label style={{ marginTop: 12 }}>
              E-mail <span style={{ color: "#e11d48" }}>*</span>
              <input
                type="email"
                autoFocus
                value={registerEmail}
                onChange={(e) => { setRegisterEmail(e.target.value); setRegisterError(""); }}
                placeholder="seu.email@exemplo.com"
              />
            </label>

            <label style={{ marginTop: 12 }}>
              Senha de acesso <span style={{ color: "#e11d48" }}>*</span>
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => { setRegisterPassword(e.target.value); setRegisterError(""); }}
                placeholder="Mínimo 4 caracteres"
              />
            </label>

            {registerError && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#ffebee", borderRadius: 8, color: "#c62828", fontSize: 12, fontWeight: 700 }}>
                {registerError}
              </div>
            )}

            <button
              className="primary-button full"
              disabled={!registerEmail.trim() || !registerPassword.trim() || isSubmittingRegister || isRedirectingPayment}
              onClick={handleCompleteRegisterAndPay}
              style={{
                marginTop: 18,
                padding: "14px",
                fontSize: 15,
                fontWeight: 800,
                background: isSubmittingRegister || isRedirectingPayment ? "#8a9c94" : "#198038",
                borderColor: isSubmittingRegister || isRedirectingPayment ? "#8a9c94" : "#198038",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isSubmittingRegister || isRedirectingPayment ? (
                "Criando conta e gerando pagamento..."
              ) : (
                <>Ir para o pagamento <ArrowRight size={17} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Quase lá... Confirmação WhatsApp */}
      {postPaymentModalOpen && (
        <div className="modal-backdrop" onClick={() => setPostPaymentModalOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, textAlign: "center" }}>
            <button className="modal-close" onClick={() => setPostPaymentModalOpen(false)} aria-label="Fechar">
              <X size={18} />
            </button>
            
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e8f5e9", color: "#198038", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "4px auto 14px" }}>
              <Check size={28} />
            </div>

            <h3 style={{ fontSize: 24, margin: "0 0 8px" }}>Quase lá...</h3>
            
            <p className="modal-description" style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 22px", color: "var(--ink-soft)" }}>
              Após o pagamento nos envie uma confirmação pelo WhatsApp para que possamos comunicar sobre a entrega
            </p>

            <a
              href={`https://wa.me/5565999865093?text=${encodeURIComponent(
                `Olá HouseFit! 👋 Realizei o pagamento do meu pedido pelo site.\n\n*Cliente:* ${customerName}\n*WhatsApp:* ${customerPhone}\n\nSegue a confirmação do pagamento!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-button full"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 20px",
                fontSize: 15,
                fontWeight: 800,
                background: "#25D366",
                borderColor: "#25D366",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(37, 211, 102, 0.25)",
              }}
            >
              Confirmar no WhatsApp <ArrowRight size={17} />
            </a>

            <button
              type="button"
              onClick={() => setPostPaymentModalOpen(false)}
              style={{
                marginTop: 14,
                background: "transparent",
                border: "none",
                color: "#6b7280",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: "6px",
              }}
            >
              Concluir e voltar ao início
            </button>
          </div>
        </div>
      )}

      {/* Interactive Combo Customizer Modal */}
      {comboModalProduct && (
        <ComboCustomizerModal
          combo={comboModalProduct}
          allProducts={products}
          onClose={() => setComboModalProduct(null)}
          onConfirm={(selections) => handleAddCombo(comboModalProduct, selections)}
        />
      )}

      {/* Auth Modal (Login / Cadastro / Acesso ao Admin) */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* Profile Modal */}
      {profileModalOpen && currentUser && (
        <ProfileModal
          user={currentUser}
          onClose={() => setProfileModalOpen(false)}
          onUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
          }}
        />
      )}

      {/* Order History Modal */}
      {historyModalOpen && currentUser && (
        <OrderHistoryModal
          user={currentUser}
          orders={orders}
          onClose={() => setHistoryModalOpen(false)}
          onTrackOrder={(selectedOrder) => {
            setHistoryModalOpen(false);
            setTrackingTargetOrder(selectedOrder);
            setTrackingModalOpen(true);
          }}
        />
      )}

      {/* Order Tracking Modal */}
      {trackingModalOpen && currentUser && (
        <OrderTrackingModal
          user={currentUser}
          orders={orders}
          targetOrder={trackingTargetOrder}
          onClose={() => setTrackingModalOpen(false)}
        />
      )}

      {/* Botão Flutuante Redondo do WhatsApp - Canto Inferior Esquerdo (escondido se modal ou carrinho aberto) */}
      {!comboModalProduct &&
        !cartOpen &&
        !checkoutOpen &&
        !registerModalOpen &&
        !postPaymentModalOpen &&
        !authModalOpen &&
        !profileModalOpen &&
        !historyModalOpen &&
        !trackingModalOpen && (
        <a
          href="https://wa.me/5565999865093?text=Ol%C3%A1%20HouseFit!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fale conosco no WhatsApp"
          title="Fale conosco no WhatsApp (65) 99986-5093"
          className="floating-whatsapp-btn"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="#ffffff"
            style={{ display: "block" }}
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.21 8.21 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.19-.09-1.11-.55-1.28-.61-.17-.07-.3-.1-.42.1-.13.19-.48.61-.59.74-.11.12-.22.14-.41.05-.19-.09-.8-.3-1.53-.95-.57-.51-.95-1.13-1.06-1.33-.11-.19-.01-.3.08-.39.09-.09.19-.22.28-.33.1-.11.13-.19.19-.31.07-.12.03-.24-.02-.33-.05-.1-.42-1.01-.58-1.39-.15-.36-.31-.31-.42-.32h-.36c-.12 0-.33.05-.5.24-.17.19-.66.65-.66 1.58s.68 1.83.77 1.96c.1.12 1.34 2.05 3.25 2.87.45.2.81.31 1.09.4.46.15.88.13 1.21.08.37-.06 1.11-.45 1.27-.89.16-.44.16-.81.11-.89-.04-.08-.16-.13-.35-.22z" />
          </svg>
        </a>
      )}
    </div>
  );
}

function ComboCard({
  item,
  inCartQty,
  onOpenCombo,
}: {
  item: Product;
  inCartQty: number;
  onOpenCombo: () => void;
}) {
  const targetCount = getComboTargetCount(item);

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={item.image} alt={item.name} />
        <div className="product-tag">{item.tag || "Combo"}</div>
        {inCartQty > 0 && (
          <div className="in-cart-badge">
            <Check size={13} /> {inCartQty} no pedido
          </div>
        )}
      </div>
      <div className="product-content">
        <div className="product-title-row">
          <h3>{item.name}</h3>
          <strong>{formatBRL(item.price)}</strong>
        </div>
        <p>{item.description}</p>
        <div className="product-footer">
          <small>
            {targetCount} {item.id.includes("caldo") || item.name.toLowerCase().includes("caldo") ? "caldos" : "marmitas"} à sua escolha
          </small>
          <button className="add-button" onClick={onOpenCombo}>
            <Plus size={15} /> {inCartQty > 0 ? "Personalizar outro" : "Montar combo"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ComboCustomizerModal({
  combo,
  allProducts,
  onClose,
  onConfirm,
}: {
  combo: Product;
  allProducts: Product[];
  onClose: () => void;
  onConfirm: (selections: Array<{ product: Product; quantity: number }>) => void;
}) {
  const targetCount = getComboTargetCount(combo);
  const isSoupCombo = combo.id.includes("caldos") || combo.name.toLowerCase().includes("caldo");
  const unitLabel = isSoupCombo ? "caldo" : "marmita";
  const unitPluralLabel = isSoupCombo ? "caldos" : "marmitas";

  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});
  const [modalFilter, setModalFilter] = useState<string>(isSoupCombo ? "Caldos" : "Todas");
  const [modalSearch, setModalSearch] = useState("");
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);

  // Available marmitas/caldos with stock from inventory
  const availableMarmitas = useMemo(() => {
    return allProducts.filter((p) => {
      if (p.category === "Combos") return false;
      if (p.stock <= 0 || !p.available) return false;

      if (isSoupCombo) {
        return p.category === "Caldos";
      }

      return p.category === "Frango" || p.category === "Carne" || p.category === "Caldos";
    });
  }, [allProducts, isSoupCombo]);

  const filteredMarmitas = useMemo(() => {
    const list = availableMarmitas.filter((p) => {
      const matchesFilter =
        modalFilter === "Todas" || p.category === modalFilter;
      const normalized = `${p.name} ${p.description}`.toLowerCase();
      const matchesSearch = normalized.includes(modalSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    // As sopas/caldos devem ser as últimas marmitas da lista
    return list.sort((a, b) => {
      const isSoupA =
        a.category === "Caldos" ||
        a.name.toLowerCase().includes("caldo") ||
        a.name.toLowerCase().includes("sopa");
      const isSoupB =
        b.category === "Caldos" ||
        b.name.toLowerCase().includes("caldo") ||
        b.name.toLowerCase().includes("sopa");

      if (isSoupA && !isSoupB) return 1;
      if (!isSoupA && isSoupB) return -1;
      return 0;
    });
  }, [availableMarmitas, modalFilter, modalSearch]);

  const totalSelected = useMemo(() => {
    return Object.values(selectedCounts).reduce((sum, qty) => sum + qty, 0);
  }, [selectedCounts]);

  const remaining = Math.max(0, targetCount - totalSelected);
  const isComplete = totalSelected === targetCount;
  const progressPercent = Math.min(100, Math.round((totalSelected / targetCount) * 100));

  const updateItemQty = (marmita: Product, delta: number) => {
    const current = selectedCounts[marmita.id] || 0;
    const next = current + delta;

    if (next < 0) return;
    if (delta > 0) {
      if (totalSelected >= targetCount) return;
      if (next > marmita.stock) return;
    }

    setSelectedCounts((prev) => {
      const updated = { ...prev };
      if (next === 0) {
        delete updated[marmita.id];
      } else {
        updated[marmita.id] = next;
      }
      return updated;
    });
  };

  const selectedList = useMemo(() => {
    return Object.entries(selectedCounts)
      .map(([id, quantity]) => {
        const prod = allProducts.find((p) => p.id === id);
        return prod ? { product: prod, quantity } : null;
      })
      .filter(Boolean) as Array<{ product: Product; quantity: number }>;
  }, [selectedCounts, allProducts]);

  const filterOptions = isSoupCombo ? ["Caldos"] : ["Todas", "Frango", "Carne", "Caldos"];

  return (
    <div className="combo-modal-backdrop" onClick={onClose}>
      <div className="combo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="combo-modal-header">
          <div>
            <span className="eyebrow"><Boxes size={13} /> Monte seu Combo</span>
            <h3>{combo.name}</h3>
            <p>Selecione exatamente <strong>{targetCount} {unitPluralLabel}</strong> com base no estoque disponível do nosso cardápio.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </div>

        {/* Progress Tracker */}
        <div className="combo-progress-box">
          <div className="combo-progress-info">
            <span className={`combo-status-pill ${isComplete ? "complete" : "pending"}`}>
              {isComplete ? (
                <><Check size={13} /> Combo completo!</>
              ) : (
                <><AlertCircle size={13} /> Faltam {remaining} {remaining === 1 ? unitLabel : unitPluralLabel}</>
              )}
            </span>
            <span className={`combo-count-badge ${isComplete ? "complete" : ""}`}>
              <strong>{totalSelected}</strong> de {targetCount} {unitPluralLabel} selecionados
            </span>
          </div>
          <div className="combo-progress-track">
            <div
              className={`combo-progress-fill ${isComplete ? "complete" : ""}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Navigation & Search Filters */}
        <div className="combo-nav-bar">
          <div className="combo-filter-chips">
            {filterOptions.map((opt) => (
              <button
                key={opt}
                className={modalFilter === opt ? "active" : ""}
                onClick={() => setModalFilter(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="combo-search">
            <Search size={14} />
            <input
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="Buscar sabor..."
            />
          </div>
        </div>

        {/* Marmitas Selection List */}
        <div className="combo-marmitas-list">
          {filteredMarmitas.map((marmita) => {
            const currentQty = selectedCounts[marmita.id] || 0;
            const canAdd = totalSelected < targetCount && currentQty < marmita.stock;
            const canSub = currentQty > 0;

            return (
              <div
                key={marmita.id}
                className={`marmita-option-card ${currentQty > 0 ? "has-selected" : ""}`}
              >
                <div
                  className="marmita-img-thumb"
                  onClick={() => setInspectingProduct(marmita)}
                  title="Clique para ver em 3D e detalhes"
                >
                  <img
                    src={marmita.image || "/marmitas/marmita-1.jpg"}
                    alt={marmita.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/marmitas/marmita-1.jpg";
                    }}
                  />
                  <span className="marmita-3d-hint">
                    <Eye size={9} /> 3D
                  </span>
                </div>
                <div className="marmita-option-body">
                  <div>
                    <h4>{marmita.name}</h4>
                    <p>{marmita.description}</p>
                  </div>
                  <div className="marmita-option-footer">
                    <span className={`marmita-stock-tag ${marmita.stock <= 10 ? "low" : ""}`}>
                      {marmita.stock <= 10 ? `Restam ${marmita.stock}` : `${marmita.stock} em estoque`}
                    </span>
                    <div className="marmita-stepper">
                      <button
                        onClick={() => updateItemQty(marmita, -1)}
                        disabled={!canSub}
                        aria-label="Diminuir"
                      >
                        <Minus size={13} />
                      </button>
                      <b>{currentQty}</b>
                      <button
                        onClick={() => updateItemQty(marmita, 1)}
                        disabled={!canAdd}
                        aria-label="Aumentar"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMarmitas.length === 0 && (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "30px 10px", color: "var(--muted)" }}>
              Nenhuma marmita encontrada para este filtro.
            </div>
          )}
        </div>

        {/* Footer with summary and submit button */}
        <div className="combo-modal-footer">
          <div className="combo-selection-pills">
            {selectedList.map((item) => (
              <span key={item.product.id} className="combo-sel-pill">
                {item.quantity}x {item.product.name}
              </span>
            ))}
          </div>

          <button
            className="primary-button"
            disabled={!isComplete}
            onClick={() => onConfirm(selectedList)}
          >
            {isComplete ? (
              <>Adicionar ao pedido • {formatBRL(combo.price)} <Check size={16} /></>
            ) : (
              `Selecione mais ${remaining} ${remaining === 1 ? unitLabel : unitPluralLabel}`
            )}
          </button>
        </div>

        {/* Modal 3D Interativo (Opção C) */}
        {inspectingProduct && (
          <Product3DViewerModal
            product={inspectingProduct}
            onClose={() => setInspectingProduct(null)}
            onAddOne={() => updateItemQty(inspectingProduct, 1)}
            canAdd={totalSelected < targetCount && (selectedCounts[inspectingProduct.id] || 0) < inspectingProduct.stock}
            currentQty={selectedCounts[inspectingProduct.id] || 0}
          />
        )}
      </div>
    </div>
  );
}

function Product3DViewerModal({
  product,
  onClose,
  onAddOne,
  canAdd,
  currentQty,
}: {
  product: Product;
  onClose: () => void;
  onAddOne?: () => void;
  canAdd?: boolean;
  currentQty?: number;
}) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.min(100, Math.max(0, (x / rect.width) * 100));
    const py = Math.min(100, Math.max(0, (y / rect.height) * 100));
    setGlare({ x: px, y: py });

    if (isDragging.current) {
      const dx = (e.clientX - startPos.current.x) * 0.4;
      const dy = (e.clientY - startPos.current.y) * 0.4;
      setRotate((prev) => ({
        x: Math.max(-28, Math.min(28, prev.x - dy)),
        y: Math.max(-35, Math.min(35, prev.y + dx)),
      }));
      startPos.current = { x: e.clientX, y: e.clientY };
    } else {
      const rotY = (x / rect.width - 0.5) * 26;
      const rotX = -(y / rect.height - 0.5) * 22;
      setRotate({ x: rotX, y: rotY });
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const reset3D = () => {
    setRotate({ x: 0, y: 0 });
    setZoom(1);
    setGlare({ x: 50, y: 50 });
  };

  return (
    <div className="viewer3d-backdrop" onClick={onClose}>
      <div className="viewer3d-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>

        <span className="viewer3d-badge">
          <Eye size={12} /> Visualização 3D • 360° Parallax
        </span>

        <h3>{product.name}</h3>
        <p>{product.description}</p>

        <div
          className="viewer3d-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            className="viewer3d-box"
            style={{
              transform: `perspective(900px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${zoom})`,
              "--glare-x": `${glare.x}%`,
              "--glare-y": `${glare.y}%`,
            } as React.CSSProperties}
          >
            <img
              src={product.image || "/marmitas/marmita-1.jpg"}
              alt={product.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/marmitas/marmita-1.jpg";
              }}
            />
            <div className="viewer3d-glare" />
          </div>
        </div>

        <div className="viewer3d-hint-text">
          <span>🖐️ Arraste na imagem para girar e inclinar em 3D</span>
        </div>

        <div className="viewer3d-controls">
          <button
            type="button"
            className={`viewer3d-btn ${zoom === 1 ? "active" : ""}`}
            onClick={() => setZoom(1)}
          >
            1.0x Normal
          </button>
          <button
            type="button"
            className={`viewer3d-btn ${zoom === 1.25 ? "active" : ""}`}
            onClick={() => setZoom(1.25)}
          >
            <ZoomIn size={13} /> 1.25x
          </button>
          <button
            type="button"
            className={`viewer3d-btn ${zoom === 1.5 ? "active" : ""}`}
            onClick={() => setZoom(1.5)}
          >
            <ZoomIn size={13} /> 1.5x Zoom
          </button>
          <button
            type="button"
            className="viewer3d-btn"
            onClick={reset3D}
            title="Resetar rotação e zoom"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {onAddOne && (
          <div style={{ marginTop: 16, width: "100%" }}>
            <button
              type="button"
              className="primary-button full"
              disabled={!canAdd}
              onClick={() => {
                onAddOne();
                onClose();
              }}
            >
              <Plus size={16} /> Adicionar ao combo {currentQty ? `(${currentQty} já selecionada)` : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Login & Cadastro Modal
function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError("Preencha e-mail e senha.");
      return;
    }

    // 1. Tentar autenticar diretamente pelo banco de dados Supabase
    try {
      const dbUser = await authenticateDbUser(cleanEmail, cleanPass);
      if (dbUser) {
        onSuccess({
          id: dbUser.id,
          name: dbUser.name,
          phone: dbUser.phone,
          email: dbUser.email,
          role: dbUser.role,
        });
        return;
      }
    } catch (err) {
      console.warn("Falha ao checar usuário no Supabase:", err);
    }

    // 2. Fallback de credenciais admin master
    if (
      (cleanEmail === "admin@housefit.com.br" && cleanPass === "admin") ||
      (cleanEmail === "admin" && cleanPass === "admin")
    ) {
      onSuccess({
        id: "admin-master",
        name: "Administrador HouseFit",
        phone: "(65) 99986-5093",
        email: "admin@housefit.com.br",
        role: "admin",
      });
      return;
    }

    const registeredUsers = loadFromStorage<AuthUser[]>("housefit-auth-users", initialAuthUsers);
    const user = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user || user.password !== cleanPass) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    onSuccess(user);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!phone.trim()) {
      setError("Informe seu WhatsApp.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (password.length < 4) {
      setError("A senha deve ter no mínimo 4 caracteres.");
      return;
    }

    const registeredUsers = loadFromStorage<AuthUser[]>("housefit-auth-users", initialAuthUsers);
    if (registeredUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setError("Este e-mail já está cadastrado.");
      return;
    }

    // Registrar no Supabase
    let dbUserRegistered = null;
    try {
      dbUserRegistered = await registerDbUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim(),
      });
    } catch (err) {
      console.warn("Erro ao registrar no Supabase:", err);
    }

    const newUser: AuthUser = {
      id: dbUserRegistered ? dbUserRegistered.id : `u-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role: email.trim().toLowerCase().includes("admin") ? "admin" : "user",
    };

    const nextUsers = [...registeredUsers, newUser];
    saveToStorage("housefit-auth-users", nextUsers);

    // Also register into customer list & Supabase
    recordCustomerPurchase(newUser.name, newUser.phone, 0, "A definir");

    const customers = loadFromStorage("housefit-customers", initialCustomers);
    customers.unshift({
      id: `c-${Date.now()}`,
      name: newUser.name,
      phone: newUser.phone,
      initials: newUser.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(),
      orders: 0,
      spent: 0,
      lastOrder: "Recém cadastrado",
      favorite: "A definir",
    });
    saveToStorage("housefit-customers", customers);

    onSuccess(newUser);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Acesso HouseFit</p>
        <h3 style={{ fontSize: 24 }}>{tab === "login" ? "Entrar na sua conta" : "Criar sua conta"}</h3>
        <p className="modal-description">
          {tab === "login"
            ? "Acesse seus pedidos ou o painel administrativo."
            : "Cadastre-se para agilizar seus pedidos e entregas."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => { setTab("register"); setError(""); }}
          >
            Criar conta
          </button>
        </div>

        {error && (
          <div style={{ padding: "8px 12px", background: "#fbe2d9", color: "#b9573c", borderRadius: 8, fontSize: 11, fontWeight: 800, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="modal-form-grid" style={{ marginTop: 0 }}>
            <div className="modal-form-group">
              <label><Mail size={13} style={{ display: "inline", marginRight: 4 }} /> E-mail</label>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="modal-form-group">
              <label><Lock size={13} style={{ display: "inline", marginRight: 4 }} /> Senha de acesso</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
              />
            </div>
            <button type="submit" className="primary-button full" style={{ marginTop: 14 }}>
              Entrar <ArrowRight size={16} />
            </button>
            <small style={{ color: "var(--muted)", textAlign: "center", display: "block", marginTop: 8 }}>
              Para acessar o Painel Admin, utilize as credenciais de administrador.
            </small>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="modal-form-grid" style={{ marginTop: 0 }}>
            <div className="modal-form-group">
              <label><User size={13} style={{ display: "inline", marginRight: 4 }} /> Nome completo</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Mariana Costa"
              />
            </div>
            <div className="modal-form-group">
              <label><Phone size={13} style={{ display: "inline", marginRight: 4 }} /> WhatsApp (com DDD)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex.: (65) 99986-5093"
              />
            </div>
            <div className="modal-form-group">
              <label><Mail size={13} style={{ display: "inline", marginRight: 4 }} /> E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="modal-form-group">
              <label><Lock size={13} style={{ display: "inline", marginRight: 4 }} /> Crie uma senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
              />
            </div>
            <button type="submit" className="primary-button full" style={{ marginTop: 14 }}>
              Criar conta e entrar <Check size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// MODAL DE PERFIL DO USUÁRIO
// ----------------------------------------------------------------------------
function ProfileModal({
  user,
  onClose,
  onUpdate,
}: {
  user: AuthUser;
  onClose: () => void;
  onUpdate: (user: AuthUser) => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Por favor preencha nome e e-mail.");
      return;
    }

    setLoading(true);

    const updatedUser: AuthUser = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
    };
    if (password.trim()) {
      updatedUser.password = password.trim();
    }

    saveToStorage("housefit-auth-current", updatedUser);

    const users = loadFromStorage<AuthUser[]>("housefit-auth-users", initialAuthUsers);
    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    saveToStorage("housefit-auth-users", updatedUsers);

    await updateDbUser(user.id, {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim() || undefined,
    });

    onUpdate(updatedUser);
    setLoading(false);
    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Minha Conta</p>
        <h3 style={{ fontSize: 22 }}>Perfil do Cliente</h3>
        <p className="modal-description">
          Gerencie e atualize seus dados de cadastro na HouseFit.
        </p>

        {successNotice && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#e5efb8", color: "#256c42", fontWeight: 800, fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={16} /> Dados atualizados com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form-grid" style={{ marginTop: 12 }}>
          <div className="modal-form-group">
            <label>Nome completo *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Telefone / WhatsApp</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(65) 99999-9999"
            />
          </div>

          <div className="modal-form-group">
            <label>E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Nova senha (opcional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco para manter a atual"
            />
          </div>

          <button
            type="submit"
            className="primary-button full"
            disabled={loading}
            style={{ marginTop: 14, background: "var(--hunter)", color: "#fff" }}
          >
            {loading ? "Salvando alterações..." : "Salvar alterações"} <Check size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// MODAL DE HISTÓRICO DE PEDIDOS
// ----------------------------------------------------------------------------
function OrderHistoryModal({
  user,
  orders,
  onClose,
  onTrackOrder,
}: {
  user: AuthUser;
  orders: Order[];
  onClose: () => void;
  onTrackOrder: (order: Order) => void;
}) {
  const userOrders = useMemo(() => {
    const cleanUserPhone = (user.phone || "").replace(/\D/g, "");
    const cleanUserName = user.name.trim().toLowerCase();

    return orders.filter((o) => {
      const cleanOrderPhone = (o.customerPhone || "").replace(/\D/g, "");
      const phoneMatch =
        cleanUserPhone &&
        cleanOrderPhone &&
        (cleanUserPhone === cleanOrderPhone ||
          cleanUserPhone.endsWith(cleanOrderPhone) ||
          cleanOrderPhone.endsWith(cleanUserPhone));
      const nameMatch = (o.customer || "").trim().toLowerCase() === cleanUserName;
      return phoneMatch || nameMatch;
    });
  }, [user, orders]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Pedido Recebido":
      case "Recebido":
        return { background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" };
      case "Em Preparo":
      case "Preparando":
        return { background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" };
      case "Aguardando":
      case "Pronto":
        return { background: "#f3e8ff", color: "#7e22ce", border: "1px solid #e9d5ff" };
      case "Na Entrega":
      case "Em entrega":
        return { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
      case "Concluído":
        return { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" };
      default:
        return { background: "#f3f4f6", color: "#374151" };
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Histórico de Pedidos</p>
        <h3 style={{ fontSize: 22 }}>Seus Pedidos HouseFit</h3>
        <p className="modal-description">
          Acompanhe o histórico de todas as refeições e compras já realizadas.
        </p>

        {userOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--muted)" }}>
              <Clock3 size={28} />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>Nenhum pedido encontrado</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 320, margin: "0 auto 20px" }}>
              Assim que sua compra for confirmada, ela aparecerá aqui para você consultar e acompanhar.
            </p>
            <button
              className="primary-button compact"
              onClick={onClose}
              style={{ background: "var(--hunter)", color: "#fff", margin: "0 auto" }}
            >
              Ver opções no cardápio
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            {userOrders.map((o) => {
              const badgeStyle = getStatusBadgeStyle(o.status);
              const isActive = o.status !== "Concluído";

              return (
                <div
                  key={o.id}
                  style={{
                    background: "#fbfbfb",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 15, color: "var(--ink)" }}>{o.id}</strong>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>• {o.time}</span>
                    </div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800,
                        ...badgeStyle,
                      }}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, lineHeight: 1.4 }}>
                    {o.itemNames && o.itemNames.length > 0 ? o.itemNames.join(" • ") : `${o.items} itens`}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 8, borderTop: "1px dashed var(--line)", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Total: <strong style={{ color: "var(--ink)", fontSize: 14 }}>{formatBRL(o.total)}</strong> ({o.payment} • {o.channel})
                    </div>
                    {isActive && (
                      <button
                        onClick={() => onTrackOrder(o)}
                        style={{
                          background: "var(--hunter)",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        Acompanhar pedido <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// MODAL DE ACOMPANHAMENTO DINÂMICO DE PEDIDO (STEPPER)
// ----------------------------------------------------------------------------
function OrderTrackingModal({
  user,
  orders,
  targetOrder,
  onClose,
}: {
  user: AuthUser;
  orders: Order[];
  targetOrder?: Order | null;
  onClose: () => void;
}) {
  const activeOrder = useMemo(() => {
    if (targetOrder) return targetOrder;

    const cleanUserPhone = (user.phone || "").replace(/\D/g, "");
    const cleanUserName = user.name.trim().toLowerCase();

    const userOrders = orders.filter((o) => {
      const cleanOrderPhone = (o.customerPhone || "").replace(/\D/g, "");
      const phoneMatch =
        cleanUserPhone &&
        cleanOrderPhone &&
        (cleanUserPhone === cleanOrderPhone ||
          cleanUserPhone.endsWith(cleanOrderPhone) ||
          cleanOrderPhone.endsWith(cleanUserPhone));
      const nameMatch = (o.customer || "").trim().toLowerCase() === cleanUserName;
      return phoneMatch || nameMatch;
    });

    const ongoing = userOrders.find((o) => o.status !== "Concluído");
    return ongoing || userOrders[0] || null;
  }, [user, orders, targetOrder]);

  const steps: Array<{ key: string; label: string; desc: string; icon: any }> = [
    {
      key: "Pedido Recebido",
      label: "Pedido Recebido",
      desc: "Registrado e confirmado no sistema HouseFit",
      icon: ClipboardCheck,
    },
    {
      key: "Em Preparo",
      label: "Em Preparo",
      desc: "Nossa cozinha está montando suas marmitas",
      icon: Flame,
    },
    {
      key: "Aguardando",
      label: "Aguardando",
      desc: "Pronto e embalado aguardando motoboy",
      icon: CheckCircle2,
    },
    {
      key: "Na Entrega",
      label: "Na Entrega",
      desc: "Entregador a caminho do seu endereço",
      icon: Truck,
    },
  ];

  const getStepIndex = (status: string) => {
    const s = status.trim().toLowerCase();
    if (s.includes("recebido")) return 0;
    if (s.includes("preparo") || s.includes("preparando")) return 1;
    if (s.includes("aguardando") || s.includes("pronto")) return 2;
    if (s.includes("entrega")) return 3;
    if (s.includes("concluído") || s.includes("concluido")) return 4;
    return 0;
  };

  const currentStepIdx = activeOrder ? getStepIndex(activeOrder.status) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Acompanhamento ao Vivo</p>
        <h3 style={{ fontSize: 22 }}>Status do seu Pedido</h3>
        <p className="modal-description">
          Acompanhe em tempo real as etapas de preparo e entrega da sua refeição.
        </p>

        {!activeOrder ? (
          <div style={{ textAlign: "center", padding: "36px 16px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--muted)" }}>
              <Truck size={30} />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>Nenhum pedido em andamento</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 340, margin: "0 auto 20px" }}>
              Quando a sua compra for confirmada pela equipe da HouseFit, o status dinâmico aparecerá aqui automaticamente.
            </p>
            <button
              className="primary-button compact"
              onClick={onClose}
              style={{ background: "var(--hunter)", color: "#fff", margin: "0 auto" }}
            >
              Fazer um pedido no cardápio
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {/* Live Indicator Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #1d3329 0%, #294738 100%)",
                borderRadius: 14,
                padding: "16px 20px",
                color: "#fff",
                boxShadow: "0 6px 20px rgba(29, 51, 41, 0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>
                    Pedido HouseFit
                  </span>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{activeOrder.id}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80" }} />
                  Atualizado em tempo real
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
                Status atual: <strong style={{ color: "#d9f99d", fontSize: 14 }}>{activeOrder.status}</strong>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div style={{ marginTop: 24, padding: "0 6px" }}>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
                {steps.map((step, idx) => {
                  const isDone = currentStepIdx > idx || currentStepIdx === 4;
                  const isCurrent = currentStepIdx === idx && currentStepIdx !== 4;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative" }}>
                      {/* Vertical line connecting nodes */}
                      {idx < steps.length - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: 17,
                            top: 36,
                            bottom: -20,
                            width: 3,
                            background: isDone ? "#256c42" : "#e5e7eb",
                            zIndex: 1,
                            borderRadius: 2,
                          }}
                        />
                      )}

                      {/* Node Icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: isDone ? "#256c42" : isCurrent ? "var(--hunter)" : "#f3f4f6",
                          color: isDone || isCurrent ? "#ffffff" : "#9ca3af",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          zIndex: 2,
                          border: isCurrent ? "3px solid #d9f99d" : "none",
                          boxShadow: isCurrent ? "0 0 12px rgba(41, 71, 56, 0.45)" : "none",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {isDone ? <Check size={18} /> : <Icon size={18} />}
                      </div>

                      {/* Node Text */}
                      <div style={{ flex: 1, paddingTop: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong
                            style={{
                              fontSize: 14,
                              color: isCurrent ? "var(--hunter)" : isDone ? "var(--ink)" : "var(--muted)",
                              fontWeight: isCurrent ? 900 : 700,
                            }}
                          >
                            {step.label}
                          </strong>
                          {isCurrent && (
                            <span
                              style={{
                                background: "#e5efb8",
                                color: "#256c42",
                                fontSize: 10,
                                fontWeight: 900,
                                padding: "2px 7px",
                                borderRadius: 10,
                                textTransform: "uppercase",
                              }}
                            >
                              Fase atual
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.35 }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order details summary */}
            <div
              style={{
                marginTop: 22,
                background: "#fafafa",
                borderRadius: 12,
                padding: "14px 16px",
                border: "1px solid var(--line)",
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>
                Itens incluídos:
              </div>
              <div style={{ color: "var(--muted)", lineHeight: 1.4 }}>
                {activeOrder.itemNames && activeOrder.itemNames.length > 0 ? activeOrder.itemNames.join(" • ") : `${activeOrder.items} refeições`}
              </div>
              {activeOrder.deliveryAddress && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--line)", color: "var(--muted)" }}>
                  <strong style={{ color: "var(--ink)" }}>Entrega:</strong> {activeOrder.deliveryAddress}
                </div>
              )}
            </div>

            {/* WhatsApp Support CTA */}
            <a
              href={`https://wa.me/5565999865093?text=Ol%C3%A1%20HouseFit!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20o%20meu%20pedido%20${encodeURIComponent(activeOrder.id)}.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#25D366",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(37, 211, 102, 0.25)",
              }}
            >
              Falar com suporte no WhatsApp (65) 99986-5093
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

