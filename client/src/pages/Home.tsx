import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import {
  formatBRL,
  initialCustomers,
  initialOrders,
  initialPartners,
  initialProducts,
  loadFromStorage,
  saveToStorage,
  type Order,
  type Partner,
  type Product,
} from "@/lib/demoData";

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

const categories = ["Todos", "Combos", "Frango", "Carne", "Caldos", "Lanches", "Sucos"] as const;

export function getComboTargetCount(product: Product): number {
  if (product.id === "combo-20") return 20;
  if (product.id === "combo-10") return 10;
  if (product.id === "combo-5") return 5;
  if (product.id === "combo-caldos") return 10;
  const match = product.name.match(/\d+/);
  return match ? parseInt(match[0], 10) : 10;
}

export default function Home() {
  const [products] = useState<Product[]>(() => loadFromStorage("housefit-products", initialProducts));
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("Todos");
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

  const saveCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    saveToStorage("housefit-cart", nextCart);
  };

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
      const normalized = `${product.name} ${product.description}`.toLowerCase();
      return matchesCategory && normalized.includes(search.toLowerCase()) && product.available;
    });
  }, [activeCategory, products, search]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedPartner) return 0;
    return (cartTotal * appliedPartner.discountPercent) / 100;
  }, [cartTotal, appliedPartner]);

  const finalTotal = useMemo(() => Math.max(0, cartTotal - discountAmount), [cartTotal, discountAmount]);

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

  const addRegularProduct = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id && !item.isCombo);
    if (existingIndex >= 0) {
      const nextCart = [...cart];
      nextCart[existingIndex].quantity += 1;
      saveCart(nextCart);
    } else {
      saveCart([
        ...cart,
        {
          key: product.id,
          productId: product.id,
          product,
          quantity: 1,
          isCombo: false,
        },
      ]);
    }
    setNotice(`${product.name} adicionado ao pedido.`);
    window.setTimeout(() => setNotice(""), 2800);
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

  const confirmOrder = () => {
    if (!customerName.trim() || !customerPhone.trim() || cart.length === 0) return;
    const orders = loadFromStorage<Order[]>("housefit-orders", initialOrders);
    const orderItemsNames = cart.map((item) => {
      if (item.isCombo && item.comboSelections?.length) {
        const details = item.comboSelections.map((s) => `${s.quantity}x ${s.product.name}`).join(", ");
        return `${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.product.name} (${details})`;
      }
      return `${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.product.name}`;
    });

    const newOrder: Order = {
      id: `#HF-${1050 + orders.length}`,
      customer: customerName,
      customerPhone: customerPhone,
      initials: customerName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
      items: cartCount,
      itemNames: orderItemsNames,
      subtotal: cartTotal,
      discountAmount: discountAmount,
      couponCode: appliedPartner?.coupon,
      partnerId: appliedPartner?.id,
      partnerName: appliedPartner?.name,
      total: finalTotal,
      status: "Recebido",
      channel: "Delivery",
      time: "agora",
      payment: "Pix",
    };

    saveToStorage("housefit-orders", [newOrder, ...orders]);

    // Synchronize customer into housefit-customers
    const customers = loadFromStorage("housefit-customers", initialCustomers);
    const existingIndex = customers.findIndex(
      (c) => c.name.toLowerCase() === customerName.toLowerCase() || (customerPhone && c.phone === customerPhone)
    );
    if (existingIndex >= 0) {
      customers[existingIndex].orders += 1;
      customers[existingIndex].spent += finalTotal;
      customers[existingIndex].lastOrder = "Hoje, agora";
      if (customerPhone) customers[existingIndex].phone = customerPhone;
    } else {
      customers.unshift({
        id: `c-${Date.now()}`,
        name: customerName,
        phone: customerPhone,
        initials: customerName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
        orders: 1,
        spent: finalTotal,
        lastOrder: "Hoje, agora",
        favorite: cart[0]?.product.name || "Marmita HouseFit",
      });
    }
    saveToStorage("housefit-customers", customers);

    saveCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setAppliedPartner(null);
    setCouponInput("");
    setCheckoutOpen(false);
    setCartOpen(false);
    setNotice("Pedido recebido! A HouseFit já começou a preparar tudo.");
    window.setTimeout(() => setNotice(""), 4500);
  };

  return (
    <div className="app-shell public-shell">
      <header className="public-header">
        <div className="header-inner">
          <Link href="/" className="brand-mark" aria-label="HouseFit início">
            <img src="/logo.png" alt="HouseFit - Marmita Saudável" className="brand-logo" />
          </Link>
          <nav className="desktop-nav" aria-label="Navegação principal">
            <a className="nav-link active" href="#cardapio">Cardápio</a>
            <a className="nav-link" href="#como-funciona">Como funciona</a>
            <a className="nav-link" href="#contato">Contato</a>
          </nav>
          <div className="header-actions">
            <Link href="/admin" className="admin-link">Painel admin <ArrowRight size={15} /></Link>
            <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Abrir carrinho">
              <ShoppingBag size={19} />
              <span>Seu pedido</span>
              {cartCount > 0 && <strong>{cartCount}</strong>}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Info Strip at the top for immediate context without hero */}
        <section className="info-strip" id="como-funciona">
          <div>
            <span className="info-icon"><Clock3 size={18} /></span>
            <div><small>Funcionamento</small><strong>Seg a sex · 9:30–17:30</strong></div>
          </div>
          <div>
            <span className="info-icon"><MapPin size={18} /></span>
            <div><small>Entrega</small><strong>Delivery ou retirada em Cuiabá e VG</strong></div>
          </div>
          <div>
            <span className="info-icon"><Sparkles size={18} /></span>
            <div><small>Combos Promocionais</small><strong>Monte seu mix e economize no freezer</strong></div>
          </div>
        </section>

        {/* Menu / Cardápio Section (Main Entry Point) */}
        <section className="menu-section" id="cardapio">
          <div className="section-heading">
            <div>
              <p className="kicker">Escolha sem complicar</p>
              <h2>Cardápio HouseFit</h2>
            </div>
            <div className="search-box">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar no cardápio" />
            </div>
          </div>

          <div className="category-row" role="tablist">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-chip ${activeCategory === category ? "active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-meta">
            <span>{visibleProducts.length} opções disponíveis</span>
            <button>Mais pedidos <ChevronDown size={15} /></button>
          </div>

          <div className="product-grid">
            {visibleProducts.map((item) => {
              const isCombo = item.category === "Combos";
              const inCartQty = cart
                .filter((ci) => ci.productId === item.id)
                .reduce((sum, ci) => sum + ci.quantity, 0);

              return (
                <ProductCard
                  key={item.id}
                  item={item}
                  isCombo={isCombo}
                  inCartQty={inCartQty}
                  onAddRegular={() => addRegularProduct(item)}
                  onOpenCombo={() => setComboModalProduct(item)}
                />
              );
            })}
          </div>

          {visibleProducts.length === 0 && (
            <div className="empty-state">
              <Search size={24} />
              <strong>Nada encontrado ainda</strong>
              <span>Tente outro termo ou escolha uma categoria.</span>
            </div>
          )}
        </section>

        <section className="promise-section">
          <div>
            <p className="kicker">Nossa promessa</p>
            <h2>Comida gostosa também pode ser prática.</h2>
          </div>
          <p>Você não precisa escolher entre sabor e rotina. A HouseFit deixa sua semana mais leve, uma marmita de cada vez.</p>
          <Link href="/admin" className="text-link">Conhecer operação <ArrowRight size={16} /></Link>
        </section>
      </main>

      <footer className="public-footer" id="contato">
        <div className="footer-brand">
          <span className="brand-mark">
            <img src="/logo.png" alt="HouseFit - Marmita Saudável" className="brand-logo" />
          </span>
          <p>Seu almoço resolvido com comida de verdade.</p>
        </div>
        <div><small>ATENDIMENTO</small><strong>(65) 99984-6265</strong><span>contato@housefit.com.br</span></div>
        <div><small>ONDE ESTAMOS</small><strong>Cuiabá e Várzea Grande</strong><span>Delivery e retirada</span></div>
        <div><small>HORÁRIO</small><strong>Segunda a sexta</strong><span>9:30 às 17:30</span></div>
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
                <h3>{cartCount ? `${cartCount} item(ns)` : "Ainda vazio"}</h3>
              </div>
              <button className="icon-button" onClick={() => setCartOpen(false)}><X size={19} /></button>
            </div>

            {cart.length > 0 ? (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.key}>
                      <img src={item.product.image} alt={item.product.name} />
                      <div>
                        {item.isCombo && (
                          <div className="cart-combo-badge">
                            <Sparkles size={11} /> Combo personalizado ({item.comboTarget} marmitas)
                          </div>
                        )}
                        <strong>{item.product.name}</strong>
                        <span>{formatBRL(item.product.price * item.quantity)}</span>

                        {item.isCombo && item.comboSelections && item.comboSelections.length > 0 && (
                          <div className="cart-combo-items-list">
                            <strong>Marmitas inclusas no combo:</strong>
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
                            title="Remover"
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
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatBRL(cartTotal)}</strong>
                  </div>
                  {appliedPartner && (
                    <div style={{ color: "#4d9b5f", marginTop: 4 }}>
                      <span>Desconto ({appliedPartner.discountPercent}% - {appliedPartner.coupon})</span>
                      <strong>-{formatBRL(discountAmount)}</strong>
                    </div>
                  )}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--line)" }}>
                    <span>Total final</span>
                    <strong style={{ fontSize: 24, color: "var(--ink)" }}>{formatBRL(finalTotal)}</strong>
                  </div>
                  <small>Taxa de entrega calculada na confirmação.</small>
                  <button className="primary-button full" onClick={() => setCheckoutOpen(true)}>
                    Continuar pedido <ArrowRight size={17} />
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <ShoppingBag size={36} />
                <strong>Seu carrinho está esperando</strong>
                <span>Escolha algumas marmitas ou monte um combo e volte aqui.</span>
                <button className="secondary-button" onClick={() => setCartOpen(false)}>Ver cardápio</button>
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
                placeholder="Ex.: (65) 99984-0000"
              />
            </label>

            {appliedPartner && (
              <div style={{ margin: "14px 0", padding: "10px 12px", background: "#e5efb8", borderRadius: 8, fontSize: 11, color: "#364811", fontWeight: 800 }}>
                ✓ Desconto de {appliedPartner.discountPercent}% aplicado com cupom de {appliedPartner.name}
              </div>
            )}

            <div className="checkout-total">
              <span>Total a pagar</span>
              <strong>{formatBRL(finalTotal)}</strong>
            </div>
            <button
              className="primary-button full"
              disabled={!customerName.trim() || !customerPhone.trim()}
              onClick={confirmOrder}
            >
              Confirmar pedido <Check size={17} />
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
    </div>
  );
}

function ProductCard({
  item,
  isCombo,
  inCartQty,
  onAddRegular,
  onOpenCombo,
}: {
  item: Product;
  isCombo: boolean;
  inCartQty: number;
  onAddRegular: () => void;
  onOpenCombo: () => void;
}) {
  const targetCount = isCombo ? getComboTargetCount(item) : 0;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={item.image} alt={item.name} />
        <div className="product-tag">{item.tag || item.category}</div>
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
          <small>{item.stock <= 10 ? `${item.stock} restantes` : isCombo ? `${targetCount} marmitas à sua escolha` : "Disponível hoje"}</small>

          {isCombo ? (
            <button className="add-button" onClick={onOpenCombo}>
              <Sparkles size={14} /> {inCartQty > 0 ? "Personalizar outro" : "Montar combo"}
            </button>
          ) : inCartQty > 0 ? (
            <div className="stepper">
              <button aria-label="Diminuir" onClick={onAddRegular}>
                <Minus size={15} />
              </button>
              <b>{inCartQty}</b>
              <button aria-label="Aumentar" onClick={onAddRegular}>
                <Plus size={15} />
              </button>
            </div>
          ) : (
            <button className="add-button" onClick={onAddRegular}>
              Adicionar <Plus size={16} />
            </button>
          )}
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
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});
  const [modalFilter, setModalFilter] = useState<string>(combo.id === "combo-caldos" ? "Caldos" : "Todas");
  const [modalSearch, setModalSearch] = useState("");

  // Available marmitas with stock from inventory
  const availableMarmitas = useMemo(() => {
    return allProducts.filter((p) => {
      // Must not be a combo itself
      if (p.category === "Combos") return false;
      // Must have stock
      if (p.stock <= 0 || !p.available) return false;

      // If this is combo-caldos, prioritize Caldos
      if (combo.id === "combo-caldos") {
        return p.category === "Caldos";
      }

      // For standard meal combos: individual meals (Frango, Carne, Caldos)
      return p.category === "Frango" || p.category === "Carne" || p.category === "Caldos";
    });
  }, [allProducts, combo.id]);

  const filteredMarmitas = useMemo(() => {
    return availableMarmitas.filter((p) => {
      const matchesFilter =
        modalFilter === "Todas" || p.category === modalFilter;
      const normalized = `${p.name} ${p.description}`.toLowerCase();
      const matchesSearch = normalized.includes(modalSearch.toLowerCase());
      return matchesFilter && matchesSearch;
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

  const filterOptions = combo.id === "combo-caldos" ? ["Caldos"] : ["Todas", "Frango", "Carne", "Caldos"];

  return (
    <div className="combo-modal-backdrop" onClick={onClose}>
      <div className="combo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="combo-modal-header">
          <div>
            <span className="eyebrow"><Sparkles size={13} /> Monte seu Combo</span>
            <h3>{combo.name}</h3>
            <p>Selecione exatamente <strong>{targetCount} marmitas</strong> com base no estoque disponível do nosso cardápio.</p>
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
                <><AlertCircle size={13} /> Faltam {remaining} marmita(s)</>
              )}
            </span>
            <span className={`combo-count-badge ${isComplete ? "complete" : ""}`}>
              <strong>{totalSelected}</strong> de {targetCount} marmitas selecionadas
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
                <img src={marmita.image} alt={marmita.name} />
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
              `Selecione mais ${remaining} marmita(s)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
