import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  Boxes,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  Edit2,
  Eye,
  Filter,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Package,
  Phone,
  PieChart,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Ticket,
  TrendingUp,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  formatBRL,
  initialCustomers,
  initialOrders,
  initialPartners,
  initialProducts,
  loadFromStorage,
  monthlySales,
  productReport,
  saveToStorage,
  weeklySales,
  type Customer,
  type Order,
  type OrderStatus,
  type Partner,
  type Product,
} from "@/lib/demoData";

type Section = "Visão geral" | "Pedidos" | "Produtos & estoque" | "Clientes" | "Indicações" | "Relatórios";

const sections: Array<{ label: Section; icon: any }> = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Pedidos", icon: ClipboardList },
  { label: "Produtos & estoque", icon: Boxes },
  { label: "Clientes", icon: Users },
  { label: "Indicações", icon: Award },
  { label: "Relatórios", icon: BarChart3 },
];

const statuses: OrderStatus[] = ["Recebido", "Preparando", "Pronto", "Em entrega", "Concluído"];

export default function Admin() {
  const [section, setSection] = useState<Section>("Visão geral");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage("housefit-orders", initialOrders));
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage("housefit-products", initialProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage("housefit-customers", initialCustomers));
  const [partners, setPartners] = useState<Partner[]>(() => loadFromStorage("housefit-partners", initialPartners));
  const [orderFilter, setOrderFilter] = useState<"Todos" | OrderStatus>("Todos");
  const [productSearch, setProductSearch] = useState("");
  const [period, setPeriod] = useState<"Semana" | "Mês">("Semana");
  const [notice, setNotice] = useState("");

  // Modals state
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newPartnerModalOpen, setNewPartnerModalOpen] = useState(false);
  const [editProductModal, setEditProductModal] = useState<Product | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const next = orders.map((order) => (order.id === id ? { ...order, status } : order));
    setOrders(next);
    saveToStorage("housefit-orders", next);
    showToast(`Pedido ${id} atualizado para ${status.toLowerCase()}.`);
  };

  const toggleAvailability = (id: string) => {
    const next = products.map((product) =>
      product.id === id ? { ...product, available: !product.available } : product
    );
    setProducts(next);
    saveToStorage("housefit-products", next);
  };

  const updateProductFields = (id: string, updates: Partial<Product>) => {
    const next = products.map((product) => {
      if (product.id === id) {
        const updated = { ...product, ...updates };
        if (updates.stock !== undefined) {
          updated.available = updated.stock > 0;
        }
        return updated;
      }
      return product;
    });
    setProducts(next);
    saveToStorage("housefit-products", next);
    showToast("Produto atualizado com sucesso!");
  };

  const adjustStock = (id: string, delta: number) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;
    const nextStock = Math.max(0, item.stock + delta);
    updateProductFields(id, { stock: nextStock });
  };

  const handleAddCustomer = (name: string, phone: string) => {
    const initials = name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const newCustomer: Customer = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      initials: initials || "CL",
      orders: 0,
      spent: 0,
      lastOrder: "Recém cadastrado",
      favorite: "A definir",
    };

    const next = [newCustomer, ...customers];
    setCustomers(next);
    saveToStorage("housefit-customers", next);
    setNewCustomerModalOpen(false);
    showToast(`Cliente ${name} cadastrado com sucesso!`);
  };

  const handleAddPartner = (name: string, phone: string, coupon: string, discountPercent: number) => {
    const cleanCoupon = coupon.trim().toUpperCase().replace(/\s+/g, "");
    if (partners.some((p) => p.coupon.toUpperCase() === cleanCoupon)) {
      alert("Este código de cupom já está em uso por outro parceiro!");
      return;
    }

    const newPartner: Partner = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      coupon: cleanCoupon,
      discountPercent: Number(discountPercent) || 10,
      createdAt: new Date().toLocaleDateString("pt-BR"),
      active: true,
    };

    const next = [newPartner, ...partners];
    setPartners(next);
    saveToStorage("housefit-partners", next);
    setNewPartnerModalOpen(false);
    showToast(`Parceiro ${name} cadastrado com cupom ${cleanCoupon} (${discountPercent}% OFF)!`);
  };

  const filteredOrders = orders.filter((order) => orderFilter === "Todos" || order.status === orderFilter);
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(productSearch.toLowerCase())
  );
  const lowStock = products.filter((product) => product.stock <= 10).length;
  const chartData = period === "Semana" ? weeklySales : monthlySales;
  const maxChart = Math.max(...chartData.map((item) => item.value));

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-top">
          <Link href="/" className="brand-mark" aria-label="HouseFit início">
            <img src="/logo.png" alt="HouseFit" className="brand-logo" />
          </Link>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">HF</div>
          <div>
            <small>Operação</small>
            <strong>HouseFit Cuiabá & VG</strong>
          </div>
          <ChevronRight size={16} />
        </div>

        <nav className="admin-nav">
          {sections.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={section === label ? "active" : ""}
              onClick={() => {
                setSection(label);
                setSidebarOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Pedidos" && <b className="nav-count">{orders.length}</b>}
              {label === "Indicações" && <b className="nav-count">{partners.length}</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-tip">
            <Zap size={17} />
            <div>
              <strong>Insight do dia</strong>
              <span>Combos e parceiros trazem 3,2x mais clientes recorrentes.</span>
            </div>
          </div>
          <button className="sidebar-settings"><Settings2 size={17} /> Configurações</button>
          <div className="user-row">
            <div className="user-avatar">AD</div>
            <div>
              <strong>Admin HouseFit</strong>
              <span>Administrador</span>
            </div>
            <MoreHorizontal size={17} />
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div>
            <p className="breadcrumb">HouseFit / <b>{section}</b></p>
            <h1>{section}</h1>
          </div>
          <div className="admin-header-actions">
            <button className="round-icon"><Bell size={18} /><i /></button>
            <Link href="/" className="outline-action">Ver cardápio ao vivo <ArrowUpRight size={14} /></Link>
          </div>
        </header>

        <div className="admin-content">
          {section === "Visão geral" && (
            <Overview
              period={period}
              setPeriod={setPeriod}
              chartData={chartData}
              maxChart={maxChart}
              orders={orders}
              lowStock={lowStock}
              setSection={setSection}
            />
          )}

          {section === "Pedidos" && (
            <OrdersView
              orders={filteredOrders}
              filter={orderFilter}
              setFilter={setOrderFilter}
              onStatusChange={updateOrderStatus}
            />
          )}

          {section === "Produtos & estoque" && (
            <ProductsView
              products={filteredProducts}
              search={productSearch}
              setSearch={setProductSearch}
              onToggle={toggleAvailability}
              onAdjustStock={adjustStock}
              onUpdateProduct={updateProductFields}
              onOpenEditModal={(p) => setEditProductModal(p)}
            />
          )}

          {section === "Clientes" && (
            <CustomersView
              customers={customers}
              onOpenNewModal={() => setNewCustomerModalOpen(true)}
            />
          )}

          {section === "Indicações" && (
            <ReferralsView
              partners={partners}
              orders={orders}
              onOpenNewModal={() => setNewPartnerModalOpen(true)}
            />
          )}

          {section === "Relatórios" && <ReportsView period={period} setPeriod={setPeriod} />}
        </div>
      </div>

      {notice && (
        <div className="admin-toast">
          <Check size={17} /> {notice}
          <button onClick={() => setNotice("")}><X size={14} /></button>
        </div>
      )}

      {/* New Customer Modal */}
      {newCustomerModalOpen && (
        <NewCustomerModal
          onClose={() => setNewCustomerModalOpen(false)}
          onSubmit={handleAddCustomer}
        />
      )}

      {/* New Partner Modal */}
      {newPartnerModalOpen && (
        <NewPartnerModal
          onClose={() => setNewPartnerModalOpen(false)}
          onSubmit={handleAddPartner}
        />
      )}

      {/* Edit Product Modal */}
      {editProductModal && (
        <EditProductModal
          product={editProductModal}
          onClose={() => setEditProductModal(null)}
          onSave={(updates) => {
            updateProductFields(editProductModal.id, updates);
            setEditProductModal(null);
          }}
        />
      )}
    </div>
  );
}

function Overview({
  period,
  setPeriod,
  chartData,
  maxChart,
  orders,
  lowStock,
  setSection,
}: {
  period: "Semana" | "Mês";
  setPeriod: (period: "Semana" | "Mês") => void;
  chartData: Array<{ label: string; value: number; orders?: number }>;
  maxChart: number;
  orders: Order[];
  lowStock: number;
  setSection: (section: Section) => void;
}) {
  const statusCount = statuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  return (
    <>
      <div className="overview-top">
        <div>
          <p className="content-eyebrow">Operação HouseFit em tempo real</p>
          <h2>Bom dia, Cozinha HouseFit <span>●</span></h2>
          <p className="content-subtitle">Aqui está o resumo da sua produção, vendas e estoque hoje.</p>
        </div>
        <button className="primary-button compact" onClick={() => setSection("Pedidos")}>
          <ClipboardList size={16} /> Ver pedidos
        </button>
      </div>

      <div className="metric-grid">
        <MetricCard label="Faturamento no mês" value="R$ 35.940" delta="+18,4%" detail="vs. mês anterior" icon={CircleDollarSign} tone="lime" />
        <MetricCard label="Pedidos no mês" value="1.248" delta="+12,8%" detail="vs. mês anterior" icon={ShoppingBag} tone="coral" />
        <MetricCard label="Ticket médio" value="R$ 28,80" delta="+5,2%" detail="vs. mês anterior" icon={TrendingUp} tone="blue" />
        <MetricCard label="Margem estimada" value="42,6%" delta="+3,1 p.p." detail="vs. mês anterior" icon={PieChart} tone="violet" />
      </div>

      <div className="admin-grid-main">
        <section className="panel sales-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Performance</p>
              <h3>Vendas {period === "Semana" ? "da semana" : "do mês"}</h3>
            </div>
            <div className="period-switch">
              <button className={period === "Semana" ? "active" : ""} onClick={() => setPeriod("Semana")}>Semana</button>
              <button className={period === "Mês" ? "active" : ""} onClick={() => setPeriod("Mês")}>Mês</button>
            </div>
          </div>
          <div className="chart-summary">
            <strong>{period === "Semana" ? "R$ 6.960" : "R$ 35.940"}</strong>
            <span><ArrowUpRight size={14} /> 18,4% no período</span>
          </div>
          <div className="bar-chart">
            {chartData.map((point) => (
              <div className="bar-column" key={point.label}>
                <div className="bar-value">{point.orders || `${Math.round(point.value / 1000)}k`}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${Math.max(12, (point.value / maxChart) * 100)}%` }} />
                </div>
                <small>{point.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel attention-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Atenção agora</p>
              <h3>Fila da operação</h3>
            </div>
            <button className="icon-button"><MoreHorizontal size={18} /></button>
          </div>
          <div className="status-list">
            {statusCount.slice(0, 4).map(({ status, count }) => (
              <div className="status-line" key={status}>
                <span className={`status-dot ${status.toLowerCase().replace(" ", "-")}`} />
                <div>
                  <strong>{status}</strong>
                  <small>
                    {status === "Recebido"
                      ? "aguardando preparo"
                      : status === "Preparando"
                      ? "na cozinha agora"
                      : "em andamento"}
                  </small>
                </div>
                <b>{count}</b>
              </div>
            ))}
          </div>
          <button className="panel-link" onClick={() => setSection("Pedidos")}>
            Abrir central de pedidos <ChevronRight size={16} />
          </button>
        </section>
      </div>

      <div className="admin-grid-bottom">
        <section className="panel insight-panel">
          <div className="insight-label"><Sparkles size={16} /> PROGRAMA DE INDICAÇÕES</div>
          <h3>Parceiros trazem clientes mais fiéis.</h3>
          <p>Profissionais de saúde e personal trainers de Cuiabá cadastrados com cupom próprio geram pedidos de ticket mais alto.</p>
          <button className="text-link" onClick={() => setSection("Indicações")}>Ver painel de indicações <ChevronRight size={16} /></button>
        </section>

        <section className="panel low-stock-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Estoque</p>
              <h3>{lowStock} itens pedem atenção</h3>
            </div>
            <AlertTriangle size={19} className="warning-icon" />
          </div>
          <div className="low-stock-items">
            {["Batata recheada de strogonoff", "Caldo de mandioca com carne", "Torta de chocolate zero"].map((item, index) => (
              <div key={item}>
                <span>{item}</span>
                <b>{[4, 5, 9][index]} un.</b>
              </div>
            ))}
          </div>
          <button className="panel-link" onClick={() => setSection("Produtos & estoque")}>
            Ver estoque completo <ChevronRight size={16} />
          </button>
        </section>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  delta,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  detail: string;
  icon: any;
  tone: string;
}) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-icon"><Icon size={19} /></div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span><ArrowUpRight size={13} /> {delta} <small>{detail}</small></span>
    </div>
  );
}

function OrdersView({
  orders,
  filter,
  setFilter,
  onStatusChange,
}: {
  orders: Order[];
  filter: "Todos" | OrderStatus;
  setFilter: (filter: "Todos" | OrderStatus) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  return (
    <>
      <div className="view-heading">
        <div>
          <p className="content-eyebrow">Operação em tempo real</p>
          <h2>Central de pedidos</h2>
          <p className="content-subtitle">Acompanhe cada pedido do clique até a entrega.</p>
        </div>
        <div className="view-actions">
          <button className="outline-action"><Filter size={16} /> Filtrar</button>
          <button className="primary-button compact"><Download size={16} /> Exportar</button>
        </div>
      </div>

      <div className="order-status-tabs">
        {["Todos", ...statuses].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item as "Todos" | OrderStatus)}
            className={filter === item ? "active" : ""}
          >
            {item}
            <b>{item === "Todos" ? orders.length : orders.filter((order) => order.status === item).length}</b>
          </button>
        ))}
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <strong>{orders.length} pedidos registrados</strong>
            <span>Atualizado em tempo real</span>
          </div>
          <button className="icon-button"><MoreHorizontal size={18} /></button>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente & Contato</th>
                <th>Itens / Composição</th>
                <th>Cupom</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                    <small>{order.time}</small>
                  </td>
                  <td>
                    <div className="table-person">
                      <span className="initials">{order.initials}</span>
                      <div>
                        <strong>{order.customer}</strong>
                        {order.customerPhone && (
                          <small style={{ color: "#4c7566", fontWeight: 700 }}>
                            <Phone size={10} style={{ display: "inline", marginRight: 3 }} />
                            {order.customerPhone}
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>{order.items} itens</div>
                    <small style={{ color: "var(--muted)", display: "block", marginTop: 2, lineHeight: 1.35 }}>
                      {order.itemNames.join(" • ")}
                    </small>
                  </td>
                  <td>
                    {order.couponCode ? (
                      <div>
                        <span className="category-label" style={{ background: "#e5efb8", color: "#364811", fontWeight: 900 }}>
                          <Ticket size={11} /> {order.couponCode}
                        </span>
                        {order.discountAmount && (
                          <small style={{ display: "block", color: "#4d9b5f", fontWeight: 800, marginTop: 2 }}>
                            -{formatBRL(order.discountAmount)}
                          </small>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong>{formatBRL(order.total)}</strong>
                    <small>{order.payment} • {order.channel}</small>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                      className={`status-select status-${order.status.toLowerCase().replace(" ", "-")}`}
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ProductsView({
  products,
  search,
  setSearch,
  onToggle,
  onAdjustStock,
  onUpdateProduct,
  onOpenEditModal,
}: {
  products: Product[];
  search: string;
  setSearch: (value: string) => void;
  onToggle: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onOpenEditModal: (product: Product) => void;
}) {
  return (
    <>
      <div className="view-heading">
        <div>
          <p className="content-eyebrow">Catálogo e inventário</p>
          <h2>Produtos & estoque</h2>
          <p className="content-subtitle">Edite Preço, Custo e Estoque diretamente na tabela ou no botão editar.</p>
        </div>
        <div className="view-actions">
          <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 800 }}>
            {products.length} itens cadastrados
          </span>
        </div>
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou categoria..."
          />
        </div>
        <div className="stock-legend">
          <span><i className="legend-dot healthy" /> Estoque regular (&gt; 10)</span>
          <span><i className="legend-dot warning" /> Estoque baixo (&le; 10)</span>
        </div>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <strong>Catálogo ativo</strong>
            <span>Altere preço, custo ou estoque nos campos abaixo — salva automaticamente</span>
          </div>
          <button className="outline-action"><Filter size={16} /> Categorias</button>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço (R$)</th>
                <th>Custo (R$)</th>
                <th>Margem</th>
                <th>Estoque (un.)</th>
                <th>Disponível</th>
                <th>Editar</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const margin =
                  product.price > 0
                    ? Math.round(((product.price - product.cost) / product.price) * 100)
                    : 0;

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-table-cell">
                        <img src={product.image} alt="" />
                        <div>
                          <strong>{product.name}</strong>
                          {product.tag && (
                            <small style={{ color: "var(--coral)", fontWeight: 800 }}>{product.tag}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="category-label">{product.category}</span></td>

                    {/* Editable Price */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>R$</span>
                        <input
                          type="number"
                          step="0.50"
                          defaultValue={product.price}
                          className="table-num-input"
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0 && val !== product.price) {
                              onUpdateProduct(product.id, { price: val });
                            }
                          }}
                          title="Clique para editar o preço"
                        />
                      </div>
                    </td>

                    {/* Editable Cost */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>R$</span>
                        <input
                          type="number"
                          step="0.50"
                          defaultValue={product.cost}
                          className="table-num-input"
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0 && val !== product.cost) {
                              onUpdateProduct(product.id, { cost: val });
                            }
                          }}
                          title="Clique para editar o custo"
                        />
                      </div>
                    </td>

                    <td>
                      <span
                        className="margin-label"
                        style={{
                          background: margin >= 40 ? "#e2f2bd" : margin >= 25 ? "#fbf3db" : "#f8ded7",
                          color: margin >= 40 ? "#364811" : margin >= 25 ? "#7d5e12" : "#9e3820",
                          fontWeight: 900,
                        }}
                      >
                        {margin}%
                      </span>
                    </td>

                    {/* Editable Stock */}
                    <td>
                      <div className={`stock-cell ${product.stock <= 10 ? "low" : ""}`}>
                        <input
                          type="number"
                          defaultValue={product.stock}
                          style={{ width: 55 }}
                          className="table-num-input"
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 0 && val !== product.stock) {
                              onUpdateProduct(product.id, { stock: val });
                            }
                          }}
                          title="Clique para editar o estoque"
                        />
                        <div className="stock-actions">
                          <button onClick={() => onAdjustStock(product.id, -1)} aria-label="Diminuir">-</button>
                          <button onClick={() => onAdjustStock(product.id, 1)} aria-label="Aumentar">+</button>
                        </div>
                      </div>
                    </td>

                    <td>
                      <button
                        className={`toggle ${product.available ? "on" : ""}`}
                        onClick={() => onToggle(product.id)}
                        aria-label="Alternar disponibilidade"
                      >
                        <span />
                      </button>
                    </td>

                    <td>
                      <button
                        className="icon-button"
                        onClick={() => onOpenEditModal(product)}
                        title="Editar produto completo"
                      >
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function CustomersView({
  customers,
  onOpenNewModal,
}: {
  customers: Customer[];
  onOpenNewModal: () => void;
}) {
  return (
    <>
      <div className="view-heading">
        <div>
          <p className="content-eyebrow">Base de clientes</p>
          <h2>Clientes frequentes & cadastro</h2>
          <p className="content-subtitle">Cadastre novos clientes manualmente com nome e WhatsApp.</p>
        </div>
        <div className="view-actions">
          <button className="primary-button compact" onClick={onOpenNewModal}>
            <Plus size={16} /> Cadastrar cliente
          </button>
        </div>
      </div>

      <div className="customer-highlights">
        <div className="highlight-card">
          <Users size={18} />
          <span>Clientes cadastrados</span>
          <strong>{customers.length}</strong>
          <small><ArrowUpRight size={13} /> Base ativa em Cuiabá e VG</small>
        </div>
        <div className="highlight-card">
          <TrendingUp size={18} />
          <span>Frequência média</span>
          <strong>3,6x</strong>
          <small><ArrowUpRight size={13} /> Alta recorrência</small>
        </div>
        <div className="highlight-card">
          <CircleDollarSign size={18} />
          <span>Lifetime value</span>
          <strong>R$ 186</strong>
          <small><ArrowUpRight size={13} /> Ticket saudável</small>
        </div>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <strong>Lista de clientes</strong>
            <span>Ordenado por recorrência</span>
          </div>
          <button className="outline-action"><Download size={16} /> Exportar</button>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Pedidos</th>
                <th>Total gasto</th>
                <th>Último pedido</th>
                <th>Favorito</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, "") : "";
                const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : "";

                return (
                  <tr key={customer.id}>
                    <td>
                      <div className="table-person">
                        <span className="initials bright">{customer.initials}</span>
                        <strong>{customer.name}</strong>
                      </div>
                    </td>
                    <td>
                      {customer.phone ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="channel-label"
                          style={{ color: "#256c42", background: "#e5efb8", fontWeight: 800 }}
                          title="Abrir conversa no WhatsApp"
                        >
                          <MessageCircle size={13} /> {customer.phone}
                        </a>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td><strong>{customer.orders}</strong> <small>pedidos</small></td>
                    <td><strong>{formatBRL(customer.spent)}</strong></td>
                    <td>{customer.lastOrder}</td>
                    <td><span className="favorite-label">{customer.favorite}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ReferralsView({
  partners,
  orders,
  onOpenNewModal,
}: {
  partners: Partner[];
  orders: Order[];
  onOpenNewModal: () => void;
}) {
  const totalReferredOrders = orders.filter((o) => !!o.couponCode);
  const totalReferredRevenue = totalReferredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDiscountsGiven = totalReferredOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

  return (
    <>
      <div className="view-heading">
        <div>
          <p className="content-eyebrow">Programa de afiliados & nutricionistas</p>
          <h2>Parceiros & indicações</h2>
          <p className="content-subtitle">
            Cadastre parceiros com nome, telefone e cupom próprio com % de desconto para seus indicados.
          </p>
        </div>
        <div className="view-actions">
          <button className="primary-button compact" onClick={onOpenNewModal}>
            <Plus size={16} /> Cadastrar parceiro
          </button>
        </div>
      </div>

      {/* Program High-Level Metrics */}
      <div className="customer-highlights" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="highlight-card">
          <Award size={18} />
          <span>Parceiros ativos</span>
          <strong>{partners.length}</strong>
          <small>Com cupom ativo</small>
        </div>
        <div className="highlight-card">
          <ShoppingBag size={18} />
          <span>Pedidos via cupom</span>
          <strong>{totalReferredOrders.length}</strong>
          <small>Total de conversões</small>
        </div>
        <div className="highlight-card">
          <CircleDollarSign size={18} />
          <span>Faturamento gerado</span>
          <strong>{formatBRL(totalReferredRevenue)}</strong>
          <small>Vendas por indicação</small>
        </div>
        <div className="highlight-card">
          <Ticket size={18} />
          <span>Descontos concedidos</span>
          <strong>{formatBRL(totalDiscountsGiven)}</strong>
          <small>Economia aos clientes</small>
        </div>
      </div>

      {/* Partners List with individual referral cards */}
      <div style={{ marginTop: 20 }}>
        {partners.map((partner) => {
          const partnerOrders = orders.filter(
            (o) =>
              (o.couponCode && o.couponCode.toUpperCase() === partner.coupon.toUpperCase()) ||
              o.partnerId === partner.id
          );
          const partnerRevenue = partnerOrders.reduce((sum, o) => sum + o.total, 0);
          const partnerDiscounts = partnerOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

          return (
            <div key={partner.id} className="partner-card">
              <div className="partner-header">
                <div className="partner-meta">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3>{partner.name}</h3>
                    <span className="partner-coupon-badge">
                      <Ticket size={13} /> {partner.coupon} • {partner.discountPercent}% OFF
                    </span>
                  </div>
                  <p>
                    <Phone size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                    {partner.phone} • Cadastrado em {partner.createdAt}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Status do parceiro</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#74bc7d" }} />
                    <strong style={{ fontSize: 12, color: "#364811" }}>Ativo</strong>
                  </div>
                </div>
              </div>

              {/* Partner Quick Stats */}
              <div className="partner-stats-row">
                <div className="partner-stat-box">
                  <span>Indicações realizadas</span>
                  <strong>{partnerOrders.length} pedido(s)</strong>
                </div>
                <div className="partner-stat-box">
                  <span>Faturamento gerado</span>
                  <strong>{formatBRL(partnerRevenue)}</strong>
                </div>
                <div className="partner-stat-box">
                  <span>Descontos concedidos</span>
                  <strong style={{ color: "#4d9b5f" }}>{formatBRL(partnerDiscounts)}</strong>
                </div>
              </div>

              {/* Referred Orders Breakdown for this Partner */}
              <div className="partner-orders-section">
                <div className="partner-orders-title">
                  <ShoppingBag size={14} /> Clientes e pedidos que usaram o cupom ({partnerOrders.length})
                </div>

                {partnerOrders.length > 0 ? (
                  <div className="responsive-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>WhatsApp</th>
                          <th>Pedido / Data</th>
                          <th>Itens solicitados</th>
                          <th>Total pago</th>
                          <th>Desconto</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnerOrders.map((ord) => (
                          <tr key={ord.id}>
                            <td>
                              <strong>{ord.customer}</strong>
                            </td>
                            <td>
                              {ord.customerPhone ? (
                                <span style={{ color: "#256c42", fontWeight: 700, fontSize: 11 }}>
                                  {ord.customerPhone}
                                </span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>—</span>
                              )}
                            </td>
                            <td>
                              <strong>{ord.id}</strong>
                              <small>{ord.time}</small>
                            </td>
                            <td style={{ maxWidth: 260 }}>
                              <small style={{ color: "var(--ink-soft)", lineHeight: 1.4, display: "block" }}>
                                {ord.itemNames.join(", ")}
                              </small>
                            </td>
                            <td><strong>{formatBRL(ord.total)}</strong></td>
                            <td style={{ color: "#4d9b5f", fontWeight: 800 }}>
                              {ord.discountAmount ? `-${formatBRL(ord.discountAmount)}` : `-${partner.discountPercent}%`}
                            </td>
                            <td>
                              <span className={`status-select status-${ord.status.toLowerCase().replace(" ", "-")}`}>
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "16px", borderRadius: 10, background: "#fbfbf7", color: "var(--muted)", fontSize: 12, textAlign: "center" }}>
                    Nenhum indicado utilizou o cupom <strong>{partner.coupon}</strong> ainda. Envie o cupom para o parceiro compartilhar!
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ReportsView({
  period,
  setPeriod,
}: {
  period: "Semana" | "Mês";
  setPeriod: (period: "Semana" | "Mês") => void;
}) {
  const data = period === "Semana" ? weeklySales : monthlySales;
  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <>
      <div className="view-heading">
        <div>
          <p className="content-eyebrow">Dados para decisão</p>
          <h2>Relatórios & insights</h2>
          <p className="content-subtitle">Entenda o que está vendendo e onde agir primeiro.</p>
        </div>
        <div className="period-switch big">
          <button className={period === "Semana" ? "active" : ""} onClick={() => setPeriod("Semana")}>Última semana</button>
          <button className={period === "Mês" ? "active" : ""} onClick={() => setPeriod("Mês")}>Últimos 6 meses</button>
        </div>
      </div>

      <div className="report-kpi-row">
        <div>
          <span>Faturamento no recorte</span>
          <strong>{formatBRL(total)}</strong>
          <small><ArrowUpRight size={13} /> 18,4% contra o recorte anterior</small>
        </div>
        <div>
          <span>Dia mais forte</span>
          <strong>Sexta-feira</strong>
          <small>24% do faturamento semanal</small>
        </div>
        <div>
          <span>Produto campeão</span>
          <strong>Panqueca de frango</strong>
          <small>182 unidades vendidas</small>
        </div>
      </div>

      <div className="reports-grid">
        <section className="panel report-list">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Produtos</p>
              <h3>O que mais sai</h3>
            </div>
            <button className="icon-button"><MoreHorizontal size={18} /></button>
          </div>
          {productReport.map((item, index) => (
            <div className="report-row" key={item.name}>
              <span className="rank">0{index + 1}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.units} unidades vendidas</small>
              </div>
              <b>{formatBRL(item.revenue)}</b>
            </div>
          ))}
        </section>

        <section className="panel report-list">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Dias da semana</p>
              <h3>Quando vender mais</h3>
            </div>
            <BarChart3 size={19} className="panel-icon" />
          </div>
          {weeklySales
            .slice(0, 5)
            .sort((a, b) => b.value - a.value)
            .map((item) => (
              <div className="day-row" key={item.label}>
                <span>{item.label}</span>
                <div className="day-track">
                  <i style={{ width: `${(item.value / 1680) * 100}%` }} />
                </div>
                <strong>{formatBRL(item.value)}</strong>
              </div>
            ))}
          <div className="report-insight">
            <Sparkles size={16} />
            <span>Concentre combos e comunicação de antecipação entre quinta e sexta.</span>
          </div>
        </section>
      </div>
    </>
  );
}

// Modal for manual customer registration
function NewCustomerModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (name: string, phone: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Novo cadastro</p>
        <h3>Cadastrar cliente</h3>
        <p className="modal-description">Insira os dados do cliente para adicioná-lo à base da HouseFit.</p>

        <div className="modal-form-grid">
          <div className="modal-form-group">
            <label>Nome completo</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Carolina Santos"
            />
          </div>
          <div className="modal-form-group">
            <label>WhatsApp (com DDD)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex.: (65) 99876-5432"
            />
          </div>
        </div>

        <button
          className="primary-button full"
          style={{ marginTop: 20 }}
          disabled={!name.trim() || !phone.trim()}
          onClick={() => onSubmit(name, phone)}
        >
          Salvar cliente <Check size={16} />
        </button>
      </div>
    </div>
  );
}

// Modal for partner registration
function NewPartnerModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (name: string, phone: string, coupon: string, discountPercent: number) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Parcerias & Cupons</p>
        <h3>Cadastrar parceiro</h3>
        <p className="modal-description">
          Cadastre nutricionistas, academias e personals para terem cupom próprio rastreado.
        </p>

        <div className="modal-form-grid">
          <div className="modal-form-group">
            <label>Nome do parceiro / estabelecimento</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Dra. Gabriela Nutri"
            />
          </div>
          <div className="modal-form-group">
            <label>Telefone / WhatsApp</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex.: (65) 99234-1122"
            />
          </div>
          <div className="modal-form-group">
            <label>Código do cupom (em maiúsculas, sem espaço)</label>
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              placeholder="Ex.: GABINUTRI"
            />
          </div>
          <div className="modal-form-group">
            <label>% de Desconto que o cupom dará aos indicados</label>
            <select
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            >
              <option value="5">5% de desconto</option>
              <option value="10">10% de desconto</option>
              <option value="12">12% de desconto</option>
              <option value="15">15% de desconto</option>
              <option value="20">20% de desconto</option>
            </select>
          </div>
        </div>

        <button
          className="primary-button full"
          style={{ marginTop: 22 }}
          disabled={!name.trim() || !phone.trim() || !coupon.trim()}
          onClick={() => onSubmit(name, phone, coupon, Number(discountPercent))}
        >
          Criar parceiro e ativar cupom <Check size={16} />
        </button>
      </div>
    </div>
  );
}

// Modal for editing single product
function EditProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (updates: Partial<Product>) => void;
}) {
  const [price, setPrice] = useState(String(product.price));
  const [cost, setCost] = useState(String(product.cost));
  const [stock, setStock] = useState(String(product.stock));
  const [available, setAvailable] = useState(product.available);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Editar Produto</p>
        <h3 style={{ fontSize: 22 }}>{product.name}</h3>
        <p className="modal-description">Categoria: <b>{product.category}</b></p>

        <div className="modal-form-grid">
          <div className="modal-form-group">
            <label>Preço de venda (R$)</label>
            <input
              type="number"
              step="0.50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="modal-form-group">
            <label>Custo de produção (R$)</label>
            <input
              type="number"
              step="0.50"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <div className="modal-form-group">
            <label>Quantidade em estoque (unidades)</label>
            <input
              type="number"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
          <div className="modal-form-group" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <label style={{ margin: 0 }}>Item disponível para venda</label>
            <button
              className={`toggle ${available ? "on" : ""}`}
              onClick={() => setAvailable(!available)}
              type="button"
            >
              <span />
            </button>
          </div>
        </div>

        <button
          className="primary-button full"
          style={{ marginTop: 22 }}
          onClick={() => {
            const p = parseFloat(price);
            const c = parseFloat(cost);
            const s = parseInt(stock, 10);
            onSave({
              price: isNaN(p) ? product.price : p,
              cost: isNaN(c) ? product.cost : c,
              stock: isNaN(s) ? product.stock : s,
              available: available && s > 0,
            });
          }}
        >
          Salvar alterações <Check size={16} />
        </button>
      </div>
    </div>
  );
}
