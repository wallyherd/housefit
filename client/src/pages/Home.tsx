import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, ChevronDown, Clock3, MapPin, Minus, Plus, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { formatBRL, initialProducts, loadFromStorage, saveToStorage, type Product } from "@/lib/demoData";

type Cart = Record<string, number>;

const categories = ["Todos", "Combos", "Frango", "Carne", "Caldos", "Lanches", "Sucos"] as const;

export default function Home() {
  const [products] = useState<Product[]>(() => loadFromStorage("housefit-products", initialProducts));
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notice, setNotice] = useState("");

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const normalized = `${product.name} ${product.description}`.toLowerCase();
    return matchesCategory && normalized.includes(search.toLowerCase()) && product.available;
  }), [activeCategory, products, search]);

  const cartItems = useMemo(() => Object.entries(cart).map(([id, quantity]) => {
    const item = products.find((product) => product.id === id);
    return item ? { ...item, quantity } : null;
  }).filter(Boolean) as Array<Product & { quantity: number }>, [cart, products]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateCart = (id: string, delta: number) => {
    setCart((current) => {
      const next = Math.max(0, (current[id] || 0) + delta);
      const updated = { ...current };
      if (next === 0) delete updated[id]; else updated[id] = next;
      return updated;
    });
  };

  const confirmOrder = () => {
    if (!customerName.trim()) return;
    const orders = loadFromStorage("housefit-orders", [] as unknown[]);
    const newOrder = {
      id: `#HF-${1050 + orders.length}`,
      customer: customerName,
      initials: customerName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
      items: cartCount,
      itemNames: cartItems.map((item) => item.name),
      total: cartTotal,
      status: "Recebido",
      channel: "Delivery",
      time: "agora",
      payment: "Pix",
    };
    saveToStorage("housefit-orders", [newOrder, ...orders]);
    setCart({});
    setCustomerName("");
    setCheckoutOpen(false);
    setCartOpen(false);
    setNotice("Pedido recebido! A HouseFit já começou a preparar tudo.");
    window.setTimeout(() => setNotice(""), 4200);
  };

  return (
    <div className="app-shell public-shell">
      <header className="public-header">
        <div className="header-inner">
          <Link href="/" className="brand-mark" aria-label="HouseFit início"><span>HOUSE</span><b>/</b><span>FIT</span></Link>
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
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> Comida de verdade, rotina mais leve</div>
            <h1>Seu almoço<br /><em>resolvido.</em></h1>
            <p>Marmitas congeladas com ingredientes que você reconhece. Escolha seus favoritos, receba em casa e siga o dia.</p>
            <div className="hero-actions"><a className="primary-button" href="#cardapio">Ver cardápio <ArrowRight size={17} /></a><span className="hero-note"><Check size={15} /> Feito para sua semana</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=88" alt="Marmita saudável com arroz, frango e legumes" />
            <div className="floating-card"><span className="floating-dot" /><div><small>Hoje tem</small><strong>Frango + legumes</strong></div><ArrowRight size={16} /></div>
          </div>
        </section>

        <section className="info-strip" id="como-funciona">
          <div><span className="info-icon"><Clock3 size={18} /></span><div><small>Funcionamento</small><strong>Seg a sex · 9:30–17:30</strong></div></div>
          <div><span className="info-icon"><MapPin size={18} /></span><div><small>Entrega</small><strong>Delivery ou retirada</strong></div></div>
          <div><span className="info-icon"><Sparkles size={18} /></span><div><small>Vantagem HouseFit</small><strong>Quanto mais, mais você economiza</strong></div></div>
        </section>

        <section className="menu-section" id="cardapio">
          <div className="section-heading"><div><p className="kicker">Escolha sem complicar</p><h2>Cardápio HouseFit</h2></div><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar no cardápio" /></div></div>
          <div className="category-row" role="tablist">{categories.map((category) => <button key={category} className={`category-chip ${activeCategory === category ? "active" : ""}`} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
          <div className="menu-meta"><span>{visibleProducts.length} opções para hoje</span><button>Mais pedidos <ChevronDown size={15} /></button></div>
          <div className="product-grid">
            {visibleProducts.map((item) => <ProductCard key={item.id} item={item} quantity={cart[item.id] || 0} onUpdate={updateCart} />)}
          </div>
          {visibleProducts.length === 0 && <div className="empty-state"><Search size={24} /><strong>Nada encontrado ainda</strong><span>Tente outro termo ou escolha uma categoria.</span></div>}
        </section>

        <section className="promise-section"><div><p className="kicker">Nossa promessa</p><h2>Comida gostosa também pode ser prática.</h2></div><p>Você não precisa escolher entre sabor e rotina. A HouseFit deixa sua semana mais leve, uma marmita de cada vez.</p><Link href="/admin" className="text-link">Conhecer operação <ArrowRight size={16} /></Link></section>
      </main>

      <footer className="public-footer" id="contato"><div className="footer-brand"><span className="brand-mark"><span>HOUSE</span><b>/</b><span>FIT</span></span><p>Seu almoço resolvido.</p></div><div><small>ATENDIMENTO</small><strong>(65) 99984-6265</strong><span>contato@housefit.com.br</span></div><div><small>ONDE ESTAMOS</small><strong>Cuiabá e Várzea Grande</strong><span>Delivery e retirada</span></div><div><small>HORÁRIO</small><strong>Segunda a sexta</strong><span>9:30 às 17:30</span></div></footer>

      {notice && <div className="toast-success"><Check size={17} /><span>{notice}</span><button onClick={() => setNotice("")}><X size={15} /></button></div>}
      {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><p className="kicker">Seu pedido</p><h3>{cartCount ? `${cartCount} item(ns)` : "Ainda vazio"}</h3></div><button className="icon-button" onClick={() => setCartOpen(false)}><X size={19} /></button></div>{cartItems.length ? <><div className="cart-items">{cartItems.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{formatBRL(item.price)}</span><div className="mini-stepper"><button onClick={() => updateCart(item.id, -1)}><Minus size={13} /></button><b>{item.quantity}</b><button onClick={() => updateCart(item.id, 1)}><Plus size={13} /></button></div></div></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{formatBRL(cartTotal)}</strong></div><small>Taxa de entrega calculada na confirmação.</small><button className="primary-button full" onClick={() => setCheckoutOpen(true)}>Continuar pedido <ArrowRight size={17} /></button></div></> : <div className="empty-cart"><ShoppingBag size={36} /><strong>Seu carrinho está esperando</strong><span>Escolha algumas marmitas e volte aqui.</span><button className="secondary-button" onClick={() => setCartOpen(false)}>Ver cardápio</button></div>}</aside></div>}
      {checkoutOpen && <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}><div className="checkout-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setCheckoutOpen(false)}><X size={18} /></button><p className="kicker">Só falta um passo</p><h3>Para quem vamos preparar?</h3><p className="modal-description">Deixe seu nome para registrar o pedido no painel HouseFit.</p><label>Seu nome<input autoFocus value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Ex.: Mariana Costa" /></label><div className="checkout-total"><span>Total do pedido</span><strong>{formatBRL(cartTotal)}</strong></div><button className="primary-button full" disabled={!customerName.trim()} onClick={confirmOrder}>Confirmar pedido <Check size={17} /></button></div></div>}
    </div>
  );
}

function ProductCard({ item, quantity, onUpdate }: { item: Product; quantity: number; onUpdate: (id: string, delta: number) => void }) {
  return <article className="product-card"><div className="product-image-wrap"><img src={item.image} alt={item.name} /><div className="product-tag">{item.tag || item.category}</div>{quantity > 0 && <div className="in-cart-badge"><Check size={13} /> {quantity} no pedido</div>}</div><div className="product-content"><div className="product-title-row"><h3>{item.name}</h3><strong>{formatBRL(item.price)}</strong></div><p>{item.description}</p><div className="product-footer"><small>{item.stock <= 10 ? `${item.stock} restantes` : "Disponível hoje"}</small>{quantity > 0 ? <div className="stepper"><button aria-label="Diminuir" onClick={() => onUpdate(item.id, -1)}><Minus size={15} /></button><b>{quantity}</b><button aria-label="Aumentar" onClick={() => onUpdate(item.id, 1)}><Plus size={15} /></button></div> : <button className="add-button" onClick={() => onUpdate(item.id, 1)}>Adicionar <Plus size={16} /></button>}</div></div></article>;
}
