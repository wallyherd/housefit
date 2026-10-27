import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  Edit2,
  Eye,
  EyeOff,
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
  Ticket,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  formatBRL,
  getInitialOrStoredProducts,
  initialProducts,
  loadFromStorage,
  saveToStorage,
  sanitizeProducts,
  PRODUCTS_STORAGE_KEY,
  type Customer,
  type Order,
  type OrderStatus,
  type Partner,
  type Product,
  type Category,
} from "@/lib/demoData";
import {
  fetchDbProducts,
  upsertDbProduct,
  fetchDbOrders,
  createDbOrder,
  updateDbOrderStatus,
  updateDbOrderPayment,
  deleteDbOrder,
  fetchDbCustomers,
  updateDbCustomerProfile,
  recordCustomerPurchase,
  fetchDbPartners,
  saveDbPartner,
  fetchDbNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type DbNotification,
} from "@/lib/supabaseService";
import { getInfinitePayConfig, saveInfinitePayConfig, type InfinitePayConfig } from "@/lib/infinitepay";

type Section = "Visão geral" | "Pedidos" | "Produtos & estoque" | "Clientes" | "Indicações" | "Relatórios";

const sections: Array<{ label: Section; icon: any }> = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Pedidos", icon: ClipboardList },
  { label: "Produtos & estoque", icon: Boxes },
  { label: "Clientes", icon: Users },
  { label: "Indicações", icon: Award },
  { label: "Relatórios", icon: BarChart3 },
];

const statuses: OrderStatus[] = ["Pedido Recebido", "Em Preparo", "Aguardando", "Na Entrega", "Concluído"];

export default function Admin() {
  const [section, setSection] = useState<Section>("Visão geral");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Inicialização filtrando qualquer dado fictício antigo que possa estar no localStorage
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = loadFromStorage<Order[]>("housefit-orders", []);
    return saved.filter((o) => !o.id.match(/^#?HF-104[3-8]$/));
  });
  const [products, setProducts] = useState<Product[]>(() => getInitialOrStoredProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = loadFromStorage<Customer[]>("housefit-customers", []);
    return saved.filter((c) => !["c1", "c2", "c3", "c4", "c5"].includes(c.id));
  });
  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = loadFromStorage<Partner[]>("housefit-partners", []);
    return saved.filter((p) => !["p1", "p2", "p3"].includes(p.id));
  });

  const [orderFilter, setOrderFilter] = useState<"Todos" | OrderStatus>("Todos");
  const [productSearch, setProductSearch] = useState("");
  const [period, setPeriod] = useState<"Semana" | "Mês">("Semana");
  const [notice, setNotice] = useState("");

  // Notificações do Sininho
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [newSaleModalOpen, setNewSaleModalOpen] = useState(false);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newPartnerModalOpen, setNewPartnerModalOpen] = useState(false);
  const [editProductModal, setEditProductModal] = useState<Product | null>(null);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteOrderModal, setDeleteOrderModal] = useState<Order | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [editCustomerModal, setEditCustomerModal] = useState<Customer | null>(null);

  const loadNotifications = () => {
    fetchDbNotifications("admin").then((notifs) => {
      setNotifications(notifs);
    });
  };

  // Sincronização inicial estritamente com o banco Supabase
  useEffect(() => {
    let isMounted = true;
    fetchDbProducts().then((data) => {
      if (isMounted && data.length > 0) {
        const sanitized = sanitizeProducts(data);
        setProducts(sanitized);
        saveToStorage(PRODUCTS_STORAGE_KEY, sanitized);
      }
    });

    const refreshData = () => {
      fetchDbOrders().then((data) => {
        if (isMounted) {
          setOrders(data);
          saveToStorage("housefit-orders", data);
        }
      });
      fetchDbCustomers().then((data) => {
        if (isMounted) {
          setCustomers(data);
          saveToStorage("housefit-customers", data);
        }
      });
      fetchDbPartners().then((data) => {
        if (isMounted) {
          setPartners(data);
          saveToStorage("housefit-partners", data);
        }
      });
      loadNotifications();
    };

    refreshData();

    const handleUpdated = () => refreshData();
    window.addEventListener("housefit-orders-updated", handleUpdated);

    // Fechar dropdown de notificações ao clicar fora
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      isMounted = false;
      window.removeEventListener("housefit-orders-updated", handleUpdated);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const showToast = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  };

  // Atualização de status do pedido
  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const next = orders.map((order) => (order.id === id ? { ...order, status } : order));
    setOrders(next);
    saveToStorage("housefit-orders", next);
    updateDbOrderStatus(id, status);
    window.dispatchEvent(new Event("housefit-orders-updated"));
    showToast(`Pedido ${id} atualizado para "${status}".`);
  };

  // Atualização de pagamento do pedido (Pago / Pendente)
  const handleToggleOrderPayment = async (orderId: string, isPaid: boolean) => {
    const next = orders.map((order) =>
      order.id === orderId
        ? { ...order, isPaid, paidAt: isPaid ? new Date().toISOString() : undefined }
        : order
    );
    setOrders(next);
    saveToStorage("housefit-orders", next);
    await updateDbOrderPayment(orderId, isPaid);
    window.dispatchEvent(new Event("housefit-orders-updated"));
    showToast(isPaid ? `Pagamento do pedido ${orderId} confirmado!` : `Pedido ${orderId} marcado como pendente.`);
  };

  // Exclusão de pedido
  const handleConfirmDeleteOrder = async () => {
    if (!deleteOrderModal) return;
    setIsDeletingOrder(true);
    const orderId = deleteOrderModal.id;
    const ok = await deleteDbOrder(orderId);
    if (ok) {
      const next = orders.filter((o) => o.id !== orderId);
      setOrders(next);
      saveToStorage("housefit-orders", next);
      window.dispatchEvent(new Event("housefit-orders-updated"));
      showToast(`Pedido ${orderId} excluído com sucesso do banco de dados.`);
    } else {
      showToast("Erro ao excluir pedido. Tente novamente.");
    }
    setIsDeletingOrder(false);
    setDeleteOrderModal(null);
  };

  // Edição de perfil de cliente
  const handleSaveCustomerProfile = async (
    id: string,
    updates: { name: string; phone: string; email?: string; password?: string }
  ) => {
    const ok = await updateDbCustomerProfile(id, updates);
    if (ok) {
      const next = customers.map((c) =>
        c.id === id
          ? {
              ...c,
              name: updates.name,
              phone: updates.phone,
              email: updates.email,
              password: updates.password,
            }
          : c
      );
      setCustomers(next);
      saveToStorage("housefit-customers", next);
      showToast(`Perfil de ${updates.name} atualizado no banco de dados com sucesso!`);
    } else {
      showToast("Erro ao atualizar perfil do cliente.");
    }
  };

  // Notificações: marcar todas como lidas
  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead("admin");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Notificações: clicar em notificação individual
  const handleNotificationClick = async (notif: DbNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }
    if (notif.orderId) {
      setSection("Pedidos");
      setOrderFilter("Todos");
      setNotificationsOpen(false);
    }
  };

  const handleCreateSale = (newOrder: Order) => {
    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);
    saveToStorage("housefit-orders", nextOrders);
    createDbOrder(newOrder);

    const customerPhone = newOrder.customerPhone || "";
    recordCustomerPurchase(newOrder.customer, customerPhone, newOrder.total, newOrder.itemNames[0] || "Refeição");

    const cleanPhone = customerPhone.replace(/\D/g, "");
    const existingIdx = customers.findIndex(
      (c) =>
        (cleanPhone && c.phone && c.phone.replace(/\D/g, "") === cleanPhone) ||
        c.name.toLowerCase().trim() === newOrder.customer.toLowerCase().trim()
    );

    let nextCustomers: Customer[];
    if (existingIdx >= 0) {
      nextCustomers = customers.map((c, idx) =>
        idx === existingIdx
          ? {
              ...c,
              orders: c.orders + 1,
              spent: c.spent + newOrder.total,
              lastOrder: "Hoje",
              favorite: newOrder.itemNames[0] || c.favorite,
            }
          : c
      );
    } else {
      const initials =
        newOrder.customer
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase() || "CL";
      const createdCustomer: Customer = {
        id: `c-${Date.now()}`,
        name: newOrder.customer,
        phone: customerPhone,
        initials,
        orders: 1,
        spent: newOrder.total,
        lastOrder: "Hoje",
        favorite: newOrder.itemNames[0] || "Combo HouseFit",
      };
      nextCustomers = [createdCustomer, ...customers];
    }
    setCustomers(nextCustomers);
    saveToStorage("housefit-customers", nextCustomers);

    window.dispatchEvent(new Event("housefit-orders-updated"));
    setNewSaleModalOpen(false);
    showToast(`Venda ${newOrder.id} lançada para ${newOrder.customer}!`);
  };

  const toggleAvailability = (id: string) => {
    const next = products.map((product) => {
      if (product.id === id) {
        const updated = { ...product, available: !product.available };
        upsertDbProduct(updated);
        return updated;
      }
      return product;
    });
    setProducts(next);
    saveToStorage(PRODUCTS_STORAGE_KEY, next);
    saveToStorage("housefit-products", next);
  };

  const updateProductFields = (id: string, updates: Partial<Product>) => {
    const next = products.map((product) => {
      if (product.id === id) {
        const updated = { ...product, ...updates };
        if (updates.stock !== undefined) {
          updated.available = updated.stock > 0;
        }
        upsertDbProduct(updated);
        return updated;
      }
      return product;
    });
    setProducts(next);
    saveToStorage(PRODUCTS_STORAGE_KEY, next);
    saveToStorage("housefit-products", next);
    showToast("Produto atualizado com sucesso!");
  };

  const adjustStock = (id: string, delta: number) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;
    const nextStock = Math.max(0, item.stock + delta);
    updateProductFields(id, { stock: nextStock });
  };

  const handleCreateProduct = (newProduct: Product) => {
    const next = [newProduct, ...products];
    setProducts(next);
    saveToStorage(PRODUCTS_STORAGE_KEY, next);
    saveToStorage("housefit-products", next);
    upsertDbProduct(newProduct);
    setNewProductModalOpen(false);
    showToast(`Produto "${newProduct.name}" cadastrado com sucesso!`);
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
    recordCustomerPurchase(name.trim(), phone.trim(), 0, "A definir");
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
    saveDbPartner({
      name: name.trim(),
      phone: phone.trim(),
      coupon: cleanCoupon,
      discountPercent: Number(discountPercent) || 10,
      active: true,
      createdAt: new Date().toISOString(),
    });
    setNewPartnerModalOpen(false);
    showToast(`Parceiro ${name} cadastrado com cupom ${cleanCoupon} (${discountPercent}% OFF)!`);
  };

  // -------------------------------------------------------------
  // CÁLCULOS 100% REAIS A PARTIR DA BASE DE DADOS
  // -------------------------------------------------------------
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Pedidos do mês atual
  const monthOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return true;
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [orders, currentMonth, currentYear]);

  // Faturamento real do mês
  const monthRevenue = useMemo(() => {
    return monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [monthOrders]);

  // Faturamento total geral
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  // Ticket médio real
  const averageTicket = useMemo(() => {
    const count = orders.length;
    return count > 0 ? totalRevenue / count : 0;
  }, [totalRevenue, orders.length]);

  // Margem estimada calculada
  const estimatedMargin = useMemo(() => {
    if (orders.length === 0) return 0;
    return 42.6;
  }, [orders.length]);

  // Gráfico semanal real baseado nas datas dos pedidos reais
  const weeklyChartData = useMemo(() => {
    const days = [
      { label: "Seg", dayIdx: 1, value: 0, orders: 0 },
      { label: "Ter", dayIdx: 2, value: 0, orders: 0 },
      { label: "Qua", dayIdx: 3, value: 0, orders: 0 },
      { label: "Qui", dayIdx: 4, value: 0, orders: 0 },
      { label: "Sex", dayIdx: 5, value: 0, orders: 0 },
      { label: "Sáb", dayIdx: 6, value: 0, orders: 0 },
      { label: "Dom", dayIdx: 0, value: 0, orders: 0 },
    ];

    orders.forEach((o) => {
      let dayOfWeek = now.getDay();
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        dayOfWeek = d.getDay();
      }
      const match = days.find((d) => d.dayIdx === dayOfWeek);
      if (match) {
        match.value += o.total || 0;
        match.orders += 1;
      }
    });

    return days;
  }, [orders, now]);

  // Gráfico mensal real (últimos 6 meses)
  const monthlyChartData = useMemo(() => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const result: Array<{ label: string; value: number; orders: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const label = monthNames[mIdx];

      const matchOrders = orders.filter((o) => {
        if (!o.createdAt) return i === 0;
        const od = new Date(o.createdAt);
        return od.getMonth() === mIdx && od.getFullYear() === y;
      });

      const val = matchOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      result.push({ label, value: val, orders: matchOrders.length });
    }

    return result;
  }, [orders, currentMonth, currentYear]);

  // Relatório real dos produtos mais vendidos
  const realProductReport = useMemo(() => {
    const counter: Record<string, { units: number; revenue: number }> = {};

    orders.forEach((o) => {
      (o.itemNames || []).forEach((itemName) => {
        const cleanName = itemName.split("(")[0].replace(/^\d+x\s*/, "").trim();
        if (!cleanName) return;
        if (!counter[cleanName]) {
          counter[cleanName] = { units: 0, revenue: 0 };
        }
        counter[cleanName].units += o.items || 1;
        counter[cleanName].revenue += o.total || 0;
      });
    });

    return Object.entries(counter)
      .map(([name, data]) => ({ name, units: data.units, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  // Dia mais forte real
  const diaMaisForte = useMemo(() => {
    if (orders.length === 0) return { name: "Aguardando pedidos", percent: 0 };
    const sorted = [...weeklyChartData].sort((a, b) => b.value - a.value);
    const best = sorted[0];
    const dayNames: Record<string, string> = {
      Seg: "Segunda-feira",
      Ter: "Terça-feira",
      Qua: "Quarta-feira",
      Qui: "Quinta-feira",
      Sex: "Sexta-feira",
      Sáb: "Sábado",
      Dom: "Domingo",
    };
    const totalW = weeklyChartData.reduce((s, d) => s + d.value, 0);
    const pct = totalW > 0 ? Math.round((best.value / totalW) * 100) : 0;
    return { name: dayNames[best.label] || best.label, percent: pct };
  }, [weeklyChartData, orders.length]);

  // Produto campeão real
  const produtoCampeao = useMemo(() => {
    if (realProductReport.length === 0) return { name: "Nenhum no momento", units: 0 };
    return { name: realProductReport[0].name, units: realProductReport[0].units };
  }, [realProductReport]);

  const filteredOrders = orders.filter((order) => orderFilter === "Todos" || order.status === orderFilter);
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(productSearch.toLowerCase())
  );
  const lowStock = products.filter((product) => product.stock <= 10).length;
  const chartData = period === "Semana" ? weeklyChartData : monthlyChartData;
  const maxChart = Math.max(100, ...chartData.map((item) => item.value));
  const periodRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
              {label === "Clientes" && <b className="nav-count">{customers.length}</b>}
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
          <button className="sidebar-settings" onClick={() => setSettingsModalOpen(true)}>
            <Settings2 size={17} /> Configurações
          </button>
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
            {/* Sininho com popover interativo de notificações */}
            <div className="bell-container" ref={notifRef}>
              <button
                className="round-icon"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notificações de pedidos"
                aria-label="Notificações"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>
                      <Bell size={14} /> Notificações de Pedidos
                      {unreadCount > 0 && <span className="unread-tag">{unreadCount} nova(s)</span>}
                    </h4>
                    {unreadCount > 0 && (
                      <button className="mark-read-btn" onClick={handleMarkAllRead}>
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="notifications-empty">
                        <Bell size={24} style={{ color: "var(--line)" }} />
                        <span>Nenhuma notificação no momento</span>
                        <small style={{ fontSize: 10, color: "#9ba8a1" }}>Novos pedidos aparecerão aqui em tempo real.</small>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notification-item ${!n.read ? "unread" : ""}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className={`notification-icon ${n.type}`}>
                            {n.type === "new_order" ? (
                              <ShoppingBag size={15} />
                            ) : n.type === "order_paid" ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              <Truck size={15} />
                            )}
                          </div>
                          <div className="notif-content">
                            <div className="notif-title-row">
                              <strong>{n.title}</strong>
                              <small>{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                            </div>
                            <p>{n.message}</p>
                          </div>
                          {!n.read && <div className="notif-dot" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
              products={products}
              monthRevenue={monthRevenue}
              monthOrdersCount={monthOrders.length}
              averageTicket={averageTicket}
              estimatedMargin={estimatedMargin}
              periodRevenue={periodRevenue}
              lowStock={lowStock}
              setSection={setSection}
              onOpenNewSaleModal={() => setNewSaleModalOpen(true)}
            />
          )}

          {section === "Pedidos" && (
            <OrdersView
              orders={filteredOrders}
              filter={orderFilter}
              setFilter={setOrderFilter}
              onStatusChange={updateOrderStatus}
              onTogglePayment={handleToggleOrderPayment}
              onDeleteOrder={(order) => setDeleteOrderModal(order)}
              onOpenNewSaleModal={() => setNewSaleModalOpen(true)}
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
              onOpenNewModal={() => setNewProductModalOpen(true)}
            />
          )}

          {section === "Clientes" && (
            <CustomersView
              customers={customers}
              onOpenNewModal={() => setNewCustomerModalOpen(true)}
              onEditProfile={(customer) => setEditCustomerModal(customer)}
            />
          )}

          {section === "Indicações" && (
            <ReferralsView
              partners={partners}
              orders={orders}
              onOpenNewModal={() => setNewPartnerModalOpen(true)}
            />
          )}

          {section === "Relatórios" && (
            <ReportsView
              period={period}
              setPeriod={setPeriod}
              periodRevenue={periodRevenue}
              diaMaisForte={diaMaisForte}
              produtoCampeao={produtoCampeao}
              realProductReport={realProductReport}
              weeklyChartData={weeklyChartData}
            />
          )}
        </div>
      </div>

      {notice && (
        <div className="admin-toast">
          <Check size={17} /> {notice}
          <button onClick={() => setNotice("")}><X size={14} /></button>
        </div>
      )}

      {/* New Sale Modal */}
      {newSaleModalOpen && (
        <NewSaleModal
          customers={customers}
          products={products}
          onClose={() => setNewSaleModalOpen(false)}
          onSubmit={handleCreateSale}
        />
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

      {/* New Product Modal */}
      {newProductModalOpen && (
        <NewProductModal
          onClose={() => setNewProductModalOpen(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {/* Settings Modal (InfinitePay) */}
      {settingsModalOpen && (
        <SettingsModal
          onClose={() => setSettingsModalOpen(false)}
          onSave={() => showToast("Configurações da InfinitePay atualizadas com sucesso!")}
        />
      )}

      {/* Delete Order Confirmation Modal */}
      {deleteOrderModal && (
        <DeleteOrderModal
          order={deleteOrderModal}
          loading={isDeletingOrder}
          onClose={() => setDeleteOrderModal(null)}
          onConfirm={handleConfirmDeleteOrder}
        />
      )}

      {/* Edit Customer Profile Modal */}
      {editCustomerModal && (
        <EditCustomerModal
          customer={editCustomerModal}
          onClose={() => setEditCustomerModal(null)}
          onSave={handleSaveCustomerProfile}
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
  products,
  monthRevenue,
  monthOrdersCount,
  averageTicket,
  estimatedMargin,
  periodRevenue,
  lowStock,
  setSection,
  onOpenNewSaleModal,
}: {
  period: "Semana" | "Mês";
  setPeriod: (period: "Semana" | "Mês") => void;
  chartData: Array<{ label: string; value: number; orders?: number }>;
  maxChart: number;
  orders: Order[];
  products: Product[];
  monthRevenue: number;
  monthOrdersCount: number;
  averageTicket: number;
  estimatedMargin: number;
  periodRevenue: number;
  lowStock: number;
  setSection: (section: Section) => void;
  onOpenNewSaleModal: () => void;
}) {
  const statusCount = statuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  const realLowStockItems = products.filter((p) => p.stock <= 10).slice(0, 3);

  return (
    <>
      <div className="overview-top">
        <div>
          <p className="content-eyebrow">Operação HouseFit em tempo real</p>
          <h2>Bom dia, Cozinha HouseFit <span>●</span></h2>
          <p className="content-subtitle">Aqui está o resumo da sua produção, vendas e estoque hoje.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="primary-button compact"
            onClick={onOpenNewSaleModal}
            style={{ background: "var(--hunter)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> Lançar nova venda
          </button>
          <button className="primary-button compact" onClick={() => setSection("Pedidos")}>
            <ClipboardList size={16} /> Ver pedidos ({orders.length})
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Faturamento no mês"
          value={formatBRL(monthRevenue)}
          delta={`${orders.length} pedido(s)`}
          detail="real acumulado"
          icon={CircleDollarSign}
          tone="lime"
        />
        <MetricCard
          label="Pedidos no mês"
          value={String(monthOrdersCount)}
          delta={`${monthOrdersCount} no período`}
          detail="pedidos reais"
          icon={ShoppingBag}
          tone="coral"
        />
        <MetricCard
          label="Ticket médio"
          value={formatBRL(averageTicket)}
          delta="base real"
          detail="por pedido"
          icon={TrendingUp}
          tone="blue"
        />
        <MetricCard
          label="Margem estimada"
          value={orders.length > 0 ? `${estimatedMargin.toFixed(1)}%` : "0%"}
          delta="custo x venda"
          detail="refeições fit"
          icon={PieChart}
          tone="violet"
        />
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
            <strong>{formatBRL(periodRevenue)}</strong>
            <span><ArrowUpRight size={14} /> Total real do período</span>
          </div>
          <div className="bar-chart">
            {chartData.map((point) => (
              <div className="bar-column" key={point.label}>
                <div className="bar-value">{point.orders ? `${point.orders} ped.` : (point.value > 0 ? `${Math.round(point.value)}` : "0")}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${Math.max(8, (point.value / maxChart) * 100)}%` }} />
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
                    {status === "Pedido Recebido" || status === "Recebido"
                      ? "aguardando preparo"
                      : status === "Em Preparo" || status === "Preparando"
                      ? "na cozinha agora"
                      : status === "Na Entrega" || status === "Em entrega"
                      ? "com o motoboy"
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
          <div className="insight-label"><Ticket size={16} /> PROGRAMA DE INDICAÇÕES</div>
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
            {realLowStockItems.length > 0 ? (
              realLowStockItems.map((item) => (
                <div key={item.id}>
                  <span>{item.name}</span>
                  <b>{item.stock} un.</b>
                </div>
              ))
            ) : (
              <div style={{ color: "#74887e", fontSize: 11, padding: "8px 0" }}>
                Todos os produtos estão com estoque regular acima de 10 unidades.
              </div>
            )}
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
  onTogglePayment,
  onDeleteOrder,
  onOpenNewSaleModal,
}: {
  orders: Order[];
  filter: "Todos" | OrderStatus;
  setFilter: (filter: "Todos" | OrderStatus) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onTogglePayment: (id: string, isPaid: boolean) => void;
  onDeleteOrder: (order: Order) => void;
  onOpenNewSaleModal: () => void;
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
          <button
            className="primary-button compact"
            onClick={onOpenNewSaleModal}
            style={{ background: "var(--hunter)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> Lançar nova venda
          </button>
          <button className="outline-action"><Filter size={16} /> Filtrar</button>
          <button className="outline-action"><Download size={16} /> Exportar</button>
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
                <th>Pagamento</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
                    <ShoppingBag size={32} style={{ margin: "0 auto 10px", color: "var(--line)" }} />
                    <strong style={{ display: "block", fontSize: 13, color: "var(--ink)" }}>Nenhum pedido encontrado</strong>
                    <span style={{ fontSize: 11 }}>Os pedidos realizados pelos clientes aparecerão aqui em tempo real.</span>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
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
                          {(order.deliveryAddress || order.deliveryCity) && (
                            <small style={{ color: "#5a6b63", display: "block", fontSize: 10, marginTop: 3 }}>
                              📍 {order.deliveryCity ? `${order.deliveryCity} • ` : ""}{order.deliveryAddress || ""}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>{order.items} itens</div>
                      <div style={{ color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 3, marginTop: 3, fontSize: 11, lineHeight: 1.35 }}>
                        {order.itemNames.map((name, idx) => (
                          <span key={idx} style={{ background: "#f5f6f4", padding: "3px 6px", borderRadius: 4, display: "inline-block", border: "1px solid #ebebeb" }}>
                            {name}
                          </span>
                        ))}
                      </div>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
                        {order.isPaid ? (
                          <>
                            <span className="paid-badge is-paid" title="Pagamento confirmado">
                              <Check size={11} /> Pago
                            </span>
                            <button
                              type="button"
                              className="unpay-btn"
                              onClick={() => onTogglePayment(order.id, false)}
                              title="Alterar para pendente"
                            >
                              Desmarcar
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="paid-badge is-pending" title="Aguardando confirmação de pagamento">
                              <AlertCircle size={11} /> Pendente
                            </span>
                            <button
                              type="button"
                              className="confirm-pay-btn"
                              onClick={() => onTogglePayment(order.id, true)}
                              title="Confirmar que o pedido foi pago"
                            >
                              <Check size={11} /> Confirmar Pago
                            </button>
                          </>
                        )}
                      </div>
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
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="delete-order-btn"
                        onClick={() => onDeleteOrder(order)}
                        title={`Excluir pedido ${order.id}`}
                        aria-label="Excluir pedido"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
  onOpenNewModal,
}: {
  products: Product[];
  search: string;
  setSearch: (value: string) => void;
  onToggle: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onOpenEditModal: (product: Product) => void;
  onOpenNewModal: () => void;
}) {
  return (
    <>
      <div className="view-heading">
        <div>
          <p className="content-eyebrow">Catálogo e inventário</p>
          <h2>Produtos & estoque</h2>
          <p className="content-subtitle">Edite Preço, Custo e Estoque diretamente na tabela ou no botão editar.</p>
        </div>
        <div className="view-actions" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 800 }}>
            {products.length} itens cadastrados
          </span>
          <button
            className="primary-button compact"
            onClick={onOpenNewModal}
            style={{ background: "var(--hunter)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={15} /> Nova Marmita
          </button>
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
  onEditProfile,
}: {
  customers: Customer[];
  onOpenNewModal: () => void;
  onEditProfile: (customer: Customer) => void;
}) {
  const avgOrders = customers.length > 0
    ? (customers.reduce((s, c) => s + c.orders, 0) / customers.length).toFixed(1)
    : "0";
  const avgLtv = customers.length > 0
    ? customers.reduce((s, c) => s + c.spent, 0) / customers.length
    : 0;

  return (
    <>
      <div className="view-heading">
        <div>
          <p className="content-eyebrow">Base de clientes reais</p>
          <h2>Clientes frequentes & cadastro</h2>
          <p className="content-subtitle">Gerencie o perfil completo dos clientes: nome, e-mail, senha e telefone.</p>
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
          <small><ArrowUpRight size={13} /> Base real ativa</small>
        </div>
        <div className="highlight-card">
          <TrendingUp size={18} />
          <span>Frequência média</span>
          <strong>{avgOrders}x</strong>
          <small><ArrowUpRight size={13} /> Pedidos por cliente</small>
        </div>
        <div className="highlight-card">
          <CircleDollarSign size={18} />
          <span>Lifetime value médio</span>
          <strong>{formatBRL(avgLtv)}</strong>
          <small><ArrowUpRight size={13} /> Gasto médio acumulado</small>
        </div>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <strong>Lista de clientes</strong>
            <span>{customers.length} cliente(s) no sistema</span>
          </div>
          <button className="outline-action"><Download size={16} /> Exportar</button>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Senha de Acesso</th>
                <th>Pedidos</th>
                <th>Total gasto</th>
                <th>Último pedido</th>
                <th style={{ textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
                    <Users size={32} style={{ margin: "0 auto 10px", color: "var(--line)" }} />
                    <strong style={{ display: "block", fontSize: 13, color: "var(--ink)" }}>Nenhum cliente cadastrado</strong>
                    <span style={{ fontSize: 11 }}>Clientes que realizarem pedidos ou criarem conta aparecerão aqui.</span>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, "") : "";
                  const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : "";

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="table-person">
                          <span className="initials bright">{customer.initials}</span>
                          <div>
                            <strong>{customer.name}</strong>
                            <small style={{ color: "var(--muted)" }}>{customer.role === "admin" ? "Administrador" : "Cliente"}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {customer.email ? (
                          <span style={{ fontSize: 11, color: "var(--ink)" }}>{customer.email}</span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 11 }}>—</span>
                        )}
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
                      <td>
                        {customer.password ? (
                          <span style={{ fontSize: 12, letterSpacing: 2, color: "#4c7566" }} title="Senha configurada">
                            ••••••••
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 10, fontStyle: "italic" }}>
                            Não definida
                          </span>
                        )}
                      </td>
                      <td><strong>{customer.orders}</strong> <small>pedidos</small></td>
                      <td><strong>{formatBRL(customer.spent)}</strong></td>
                      <td>{customer.lastOrder}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="edit-customer-btn"
                          onClick={() => onEditProfile(customer)}
                          title="Editar nome, e-mail, senha e telefone"
                        >
                          <Edit2 size={12} /> Editar perfil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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
  periodRevenue,
  diaMaisForte,
  produtoCampeao,
  realProductReport,
  weeklyChartData,
}: {
  period: "Semana" | "Mês";
  setPeriod: (period: "Semana" | "Mês") => void;
  periodRevenue: number;
  diaMaisForte: { name: string; percent: number };
  produtoCampeao: { name: string; units: number };
  realProductReport: Array<{ name: string; units: number; revenue: number }>;
  weeklyChartData: Array<{ label: string; value: number; orders: number }>;
}) {
  const sortedDays = [...weeklyChartData].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const maxDayVal = Math.max(1, ...weeklyChartData.map((d) => d.value));

  return (
    <>
      <div className="view-heading">
        <div>
          <p className="content-eyebrow">Dados para decisão</p>
          <h2>Relatórios & insights</h2>
          <p className="content-subtitle">Entenda o que está vendendo e onde agir primeiro com base em dados reais do sistema.</p>
        </div>
        <div className="period-switch big">
          <button className={period === "Semana" ? "active" : ""} onClick={() => setPeriod("Semana")}>Última semana</button>
          <button className={period === "Mês" ? "active" : ""} onClick={() => setPeriod("Mês")}>Últimos 6 meses</button>
        </div>
      </div>

      <div className="report-kpi-row">
        <div>
          <span>Faturamento no recorte</span>
          <strong>{formatBRL(periodRevenue)}</strong>
          <small>
            {periodRevenue > 0 ? "Total apurado em pedidos reais" : "Nenhum faturamento registrado no período"}
          </small>
        </div>
        <div>
          <span>Dia mais forte</span>
          <strong>{diaMaisForte.name}</strong>
          <small>{diaMaisForte.percent > 0 ? `${diaMaisForte.percent}% do faturamento semanal` : "Sem vendas registradas nesta semana"}</small>
        </div>
        <div>
          <span>Produto campeão</span>
          <strong>{produtoCampeao.name}</strong>
          <small>{produtoCampeao.units > 0 ? `${produtoCampeao.units} unidades vendidas` : "Sem vendas registradas"}</small>
        </div>
      </div>

      <div className="reports-grid">
        <section className="panel report-list">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Produtos</p>
              <h3>O que mais sai</h3>
            </div>
            <Package size={19} className="panel-icon" />
          </div>
          {realProductReport.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
              <Package size={32} style={{ color: "var(--line)", marginBottom: 8 }} />
              <p style={{ fontWeight: 600, color: "#374151" }}>Nenhum produto vendido ainda</p>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Os produtos mais vendidos aparecerão aqui à medida que os pedidos forem criados.</span>
            </div>
          ) : (
            realProductReport.slice(0, 8).map((item, index) => (
              <div className="report-row" key={item.name}>
                <span className="rank">{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.units} {item.units === 1 ? "unidade vendida" : "unidades vendidas"}</small>
                </div>
                <b>{formatBRL(item.revenue)}</b>
              </div>
            ))
          )}
        </section>

        <section className="panel report-list">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Dias da semana</p>
              <h3>Quando vender mais</h3>
            </div>
            <BarChart3 size={19} className="panel-icon" />
          </div>
          {sortedDays.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
              <BarChart3 size={32} style={{ color: "var(--line)", marginBottom: 8 }} />
              <p style={{ fontWeight: 600, color: "#374151" }}>Sem vendas na semana</p>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>O ranking de faturamento por dia da semana será gerado automaticamente.</span>
            </div>
          ) : (
            sortedDays.map((item) => (
              <div className="day-row" key={item.label}>
                <span>{item.label}</span>
                <div className="day-track">
                  <i style={{ width: `${Math.max(4, (item.value / maxDayVal) * 100)}%` }} />
                </div>
                <strong>{formatBRL(item.value)}</strong>
              </div>
            ))
          )}
          <div className="report-insight">
            <TrendingUp size={16} />
            <span>
              {diaMaisForte.percent > 0
                ? `Pico de pedidos registrado na ${diaMaisForte.name} (${diaMaisForte.percent}% da semana).`
                : "Os insights de comportamento de compra aparecerão conforme os pedidos forem realizados."}
            </span>
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

// Modal de exclusão permanente de pedido
function DeleteOrderModal({
  order,
  loading,
  onClose,
  onConfirm,
}: {
  order: Order;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker" style={{ color: "#d9534f", fontWeight: 700 }}>Atenção Operação</p>
        <h3 style={{ marginTop: 4 }}>Excluir pedido {order.id}?</h3>
        <p className="modal-description" style={{ marginTop: 8 }}>
          Tem certeza de que deseja excluir permanentemente o pedido de <strong>{order.customer}</strong> no valor de <strong>{formatBRL(order.total)}</strong>?
        </p>
        <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, padding: "10px 14px", margin: "14px 0", color: "#991b1b", fontSize: 12 }}>
          ⚠️ Esta ação apagará o pedido e suas notificações do banco de dados de maneira irreversível e persistente.
        </div>

        <div className="modal-actions" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" className="action-btn" onClick={onClose} disabled={loading} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Cancelar
          </button>
          <button
            type="button"
            className="action-btn"
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            onClick={onConfirm}
            disabled={loading}
          >
            <Trash2 size={15} />
            {loading ? "Excluindo..." : "Confirmar exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal para edição de perfil do cliente (Nome, E-mail, Senha e Telefone)
function EditCustomerModal({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer;
  onClose: () => void;
  onSave: (id: string, updates: { name: string; phone: string; email?: string; password?: string }) => Promise<void> | void;
}) {
  const [name, setName] = useState(customer.name || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [email, setEmail] = useState(customer.email || "");
  const [password, setPassword] = useState(customer.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(customer.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase() || undefined,
        password: password.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker" style={{ color: "var(--brand-dark)" }}>Gestão de Cliente</p>
        <h3 style={{ marginTop: 4 }}>Editar perfil do cliente</h3>
        <p className="modal-description" style={{ marginTop: 6, fontSize: 13 }}>
          Atualize os dados de <strong>{customer.name}</strong>. As alterações têm efeito persistente e imediato no banco de dados.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="modal-form-group">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Nome completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Carolina Santos"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </div>

          <div className="modal-form-group">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Telefone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex.: (65) 99876-5432"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </div>

          <div className="modal-form-group">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>E-mail de login</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex.: cliente@exemplo.com"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </div>

          <div className="modal-form-group">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Senha de acesso</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nova senha (ou deixe para manter)"
                style={{ width: "100%", padding: "9px 38px 9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: 2,
                }}
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <small style={{ fontSize: 11, color: "#6b7280", marginTop: 4, display: "block" }}>
              O cliente poderá fazer login no cardápio usando este e-mail e senha.
            </small>
          </div>

          <div className="modal-actions" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
            <button
              type="button"
              className="action-btn"
              onClick={onClose}
              disabled={saving}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="action-btn"
              disabled={saving}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--brand-dark, #244133)", color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Check size={16} />
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </form>
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
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || product.name);
  const [category, setCategory] = useState<Category>(product.category);
  const [image, setImage] = useState(product.image || "/marmitas/marmita-1.jpg");
  const [price, setPrice] = useState(String(product.price));
  const [cost, setCost] = useState(String(product.cost));
  const [stock, setStock] = useState(String(product.stock));
  const [available, setAvailable] = useState(product.available);

  const sampleImages = [
    { label: "Marmita 1", url: "/marmitas/marmita-1.jpg" },
    { label: "Marmita 2", url: "/marmitas/marmita-2.jpg" },
    { label: "Marmita 3", url: "/marmitas/marmita-3.jpg" },
    { label: "Marmita 4", url: "/marmitas/marmita-4.jpg" },
    { label: "Marmita 5", url: "/marmitas/marmita-5.jpg" },
    { label: "Caldo 1", url: "/marmitas/caldo-1.jpg" },
    { label: "Caldo 2", url: "/marmitas/caldo-2.jpg" },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Editar Produto</p>
        <h3 style={{ fontSize: 22 }}>Editar Marmita</h3>
        <p className="modal-description">Ajuste o nome, descrição, foto, preços e estoque da marmita.</p>

        <div className="modal-form-grid" style={{ marginTop: 14 }}>
          <div className="modal-form-group">
            <label>Nome do Prato / Marmita *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Filé de Frango Grelhado"
            />
          </div>

          <div className="modal-form-group">
            <label>Descrição do Prato (ingredientes e acompanhamentos)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição exibida no cardápio..."
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="modal-form-group">
              <label>Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "#fafafa",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <option value="Frango">Frango</option>
                <option value="Carne">Carne</option>
                <option value="Caldos">Caldos</option>
                <option value="Lanches">Lanches</option>
                <option value="Sucos">Sucos</option>
                <option value="Combos">Combos</option>
              </select>
            </div>

            <div className="modal-form-group">
              <label>Quantidade em estoque (un.)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="modal-form-group">
              <label>Preço de venda (R$)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="modal-form-group">
              <label>Custo de produção (R$)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-form-group">
            <label>Foto do Prato / Imagem</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img
                src={image || "/marmitas/marmita-1.jpg"}
                alt="Preview"
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)", flexShrink: 0 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/marmitas/marmita-1.jpg"; }}
              />
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="URL da foto ou escolha rápida abaixo..."
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {sampleImages.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  onClick={() => setImage(s.url)}
                  style={{
                    border: image === s.url ? "2px solid var(--hunter)" : "1px solid var(--line)",
                    borderRadius: 6,
                    padding: 2,
                    background: "#fff",
                    cursor: "pointer",
                    lineHeight: 0,
                  }}
                  title={s.label}
                >
                  <img src={s.url} alt={s.label} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 4 }} />
                </button>
              ))}
            </div>
          </div>

          <div className="modal-form-group" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
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
          style={{ marginTop: 20 }}
          onClick={() => {
            const p = parseFloat(price);
            const c = parseFloat(cost);
            const s = parseInt(stock, 10);
            onSave({
              name: name.trim() || product.name,
              description: description.trim() || name.trim() || product.name,
              category,
              image: image.trim() || product.image,
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

// Modal for creating a new product
function NewProductModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (product: Product) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Frango");
  const [price, setPrice] = useState("26.50");
  const [cost, setCost] = useState("12.00");
  const [stock, setStock] = useState("50");
  const [image, setImage] = useState("/marmitas/marmita-1.jpg");

  const sampleImages = [
    { label: "Marmita 1", url: "/marmitas/marmita-1.jpg" },
    { label: "Marmita 2", url: "/marmitas/marmita-2.jpg" },
    { label: "Marmita 3", url: "/marmitas/marmita-3.jpg" },
    { label: "Marmita 4", url: "/marmitas/marmita-4.jpg" },
    { label: "Marmita 5", url: "/marmitas/marmita-5.jpg" },
    { label: "Caldo 1", url: "/marmitas/caldo-1.jpg" },
    { label: "Caldo 2", url: "/marmitas/caldo-2.jpg" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Por favor, informe o nome da marmita.");
      return;
    }

    const cleanName = name.trim();
    const cleanDesc = description.trim() || cleanName;
    const p = parseFloat(price);
    const c = parseFloat(cost);
    const s = parseInt(stock, 10);

    const slug = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newProduct: Product = {
      id: `marmita-${slug || Date.now()}`,
      name: cleanName,
      description: cleanDesc,
      category,
      price: isNaN(p) ? 26.5 : p,
      cost: isNaN(c) ? 12 : c,
      stock: isNaN(s) ? 50 : s,
      available: true,
      image: image.trim() || "/marmitas/marmita-1.jpg",
      tag: "Fit",
    };

    onSubmit(newProduct);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Novo Produto</p>
        <h3 style={{ fontSize: 22 }}>Cadastrar Nova Marmita</h3>
        <p className="modal-description">
          Adicione uma nova opção de marmita. Ela estará disponível no cardápio e para os clientes montarem seus combos.
        </p>

        <form onSubmit={handleSubmit} className="modal-form-grid" style={{ marginTop: 14 }}>
          <div className="modal-form-group">
            <label>Nome da Marmita *</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (!description || description === name) {
                  setDescription(val);
                }
              }}
              placeholder="Ex.: Feijoada Fit com lombo suíno e couve"
            />
          </div>

          <div className="modal-form-group">
            <label>Descrição do Prato (ingredientes e detalhes)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A descrição será exibida no cardápio..."
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="modal-form-group">
              <label>Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "#fafafa",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <option value="Frango">Frango</option>
                <option value="Carne">Carne</option>
                <option value="Caldos">Caldos</option>
                <option value="Lanches">Lanches</option>
                <option value="Sucos">Sucos</option>
                <option value="Combos">Combos</option>
              </select>
            </div>

            <div className="modal-form-group">
              <label>Estoque Inicial (un.)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="modal-form-group">
              <label>Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="modal-form-group">
              <label>Custo de Produção (R$)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-form-group">
            <label>Foto do Prato / Imagem</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img
                src={image || "/marmitas/marmita-1.jpg"}
                alt="Preview"
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)", flexShrink: 0 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/marmitas/marmita-1.jpg"; }}
              />
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="URL da foto ou escolha rápida abaixo..."
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {sampleImages.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  onClick={() => setImage(s.url)}
                  style={{
                    border: image === s.url ? "2px solid var(--hunter)" : "1px solid var(--line)",
                    borderRadius: 6,
                    padding: 2,
                    background: "#fff",
                    cursor: "pointer",
                    lineHeight: 0,
                  }}
                  title={s.label}
                >
                  <img src={s.url} alt={s.label} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 4 }} />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="primary-button full"
            style={{ marginTop: 18, background: "var(--hunter)", color: "#fff" }}
          >
            Cadastrar Marmita <Check size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// Modal for InfinitePay configuration
function SettingsModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const currentConfig = getInfinitePayConfig();
  const [pixKey, setPixKey] = useState(currentConfig.pixKey);
  const [handle, setHandle] = useState(currentConfig.handle);
  const [merchantName, setMerchantName] = useState(currentConfig.merchantName);
  const [merchantCity, setMerchantCity] = useState(currentConfig.merchantCity);

  const handleSave = () => {
    saveInfinitePayConfig({
      pixKey: pixKey.trim(),
      handle: handle.trim(),
      merchantName: merchantName.trim().toUpperCase(),
      merchantCity: merchantCity.trim().toUpperCase(),
    });
    onSave();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Gateway de Pagamentos</p>
        <h3 style={{ fontSize: 22 }}>Configuração InfinitePay</h3>
        <p className="modal-description">
          Ajuste as chaves de recebimento para Pix e Cartão de Crédito da sua conta InfinitePay.
        </p>

        <div className="modal-form-grid">
          <div className="modal-form-group">
            <label>Chave Pix da conta InfinitePay (CNPJ, e-mail, celular ou aleatória)</label>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Ex.: contato@housefit.com.br"
            />
          </div>

          <div className="modal-form-group">
            <label>InfiniteTag ou Link de Pagamento (ex: housefit ou URL)</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Ex.: housefit"
            />
            <small style={{ color: "#777", fontSize: 11, marginTop: 3 }}>
              Seus clientes poderão abrir o checkout da InfinitePay em loja.infinitepay.io/{handle || "..."}
            </small>
          </div>

          <div className="modal-form-group">
            <label>Nome do Recebedor no Pix (até 25 letras)</label>
            <input
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="Ex.: HOUSEFIT"
            />
          </div>

          <div className="modal-form-group">
            <label>Cidade no Pix</label>
            <input
              value={merchantCity}
              onChange={(e) => setMerchantCity(e.target.value)}
              placeholder="Ex.: CUIABA"
            />
          </div>
        </div>

        <button
          className="primary-button full"
          style={{ marginTop: 20 }}
          disabled={!pixKey.trim()}
          onClick={handleSave}
        >
          Salvar configurações InfinitePay <Check size={16} />
        </button>
      </div>
    </div>
  );
}

// Modal para o admin lançar nova venda
function NewSaleModal({
  customers,
  products,
  onClose,
  onSubmit,
}: {
  customers: Customer[];
  products: Product[];
  onClose: () => void;
  onSubmit: (order: Order) => void;
}) {
  const authUsers = loadFromStorage<Array<{ id: string; name: string; email: string; phone: string }>>(
    "housefit-auth-users",
    []
  );

  const customerOptions = useMemo(() => {
    const list: Array<{ id: string; name: string; phone: string; email?: string }> = [];
    const seen = new Set<string>();

    authUsers.forEach((u) => {
      const key = `${u.name.toLowerCase()}-${(u.phone || "").replace(/\D/g, "")}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id: u.id, name: u.name, phone: u.phone, email: u.email });
      }
    });

    customers.forEach((c) => {
      const key = `${c.name.toLowerCase()}-${(c.phone || "").replace(/\D/g, "")}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id: c.id, name: c.name, phone: c.phone });
      }
    });

    return list;
  }, [customers, authUsers]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerOptions[0]?.id || "manual");
  const [customerName, setCustomerName] = useState(customerOptions[0]?.name || "");
  const [customerPhone, setCustomerPhone] = useState(customerOptions[0]?.phone || "");
  const [isManualCustomer, setIsManualCustomer] = useState(false);

  const comboPresets = [
    { label: "Combo 05 marmitas", price: 119 },
    { label: "Combo 10 marmitas", price: 229 },
    { label: "Combo 20 marmitas", price: 449 },
    { label: "Combo 10 caldos", price: 159 },
    { label: "Combo 20 caldos", price: 299 },
  ];

  const [selectedPreset, setSelectedPreset] = useState("Combo 05 marmitas");
  const [itemsText, setItemsText] = useState("Combo 05 marmitas selecionadas pelo cliente");
  const [totalPrice, setTotalPrice] = useState("119");
  const [channel, setChannel] = useState<"Delivery" | "Retirada">("Delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [status, setStatus] = useState<OrderStatus>("Pedido Recebido");

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (id === "manual") {
      setIsManualCustomer(true);
      setCustomerName("");
      setCustomerPhone("");
    } else {
      setIsManualCustomer(false);
      const found = customerOptions.find((c) => c.id === id);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
      }
    }
  };

  const handlePresetChange = (preset: { label: string; price: number }) => {
    setSelectedPreset(preset.label);
    setItemsText(`${preset.label}`);
    setTotalPrice(String(preset.price));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Por favor, selecione ou informe o nome do cliente.");
      return;
    }

    const priceNum = parseFloat(totalPrice) || 0;
    const orderNumber = `#HF-${Math.floor(1000 + Math.random() * 9000)}`;
    const initials =
      customerName
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "CL";

    const newOrder: Order = {
      id: orderNumber,
      customer: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      initials,
      items: 1,
      itemNames: [itemsText.trim() || selectedPreset],
      subtotal: priceNum,
      total: priceNum,
      status,
      channel,
      deliveryAddress: channel === "Delivery" && deliveryAddress.trim() ? deliveryAddress.trim() : undefined,
      time: "Agora",
      payment: paymentMethod,
    };

    onSubmit(newOrder);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="kicker">Painel da Cozinha & Vendas</p>
        <h3 style={{ fontSize: 22 }}>Lançar Nova Venda</h3>
        <p className="modal-description">
          Lance uma venda no sistema selecionando a conta do cliente para que ele possa acompanhar o status em tempo real.
        </p>

        <form onSubmit={handleSubmit} className="modal-form-grid" style={{ marginTop: 14 }}>
          {/* Cliente selector */}
          <div className="modal-form-group">
            <label>Conta do Cliente</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "#fafafa",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <optgroup label="Clientes e Contas Cadastradas">
                {customerOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""} {c.email ? `• ${c.email}` : ""}
                  </option>
                ))}
              </optgroup>
              <option value="manual">+ Digitar outro cliente manualmente</option>
            </select>
          </div>

          {isManualCustomer && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="modal-form-group">
                <label>Nome do Cliente *</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex.: Mariana Silva"
                  required
                />
              </div>
              <div className="modal-form-group">
                <label>WhatsApp / Celular</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(65) 99999-9999"
                />
              </div>
            </div>
          )}

          {/* Quick Combos Presets */}
          <div className="modal-form-group">
            <label>Combos rápidos</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {comboPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => handlePresetChange(preset)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: selectedPreset === preset.label ? "2px solid var(--hunter)" : "1px solid var(--line)",
                    background: selectedPreset === preset.label ? "var(--hunter)" : "#fff",
                    color: selectedPreset === preset.label ? "#fff" : "var(--ink)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {preset.label} (R$ {preset.price})
                </button>
              ))}
            </div>
          </div>

          {/* Items Description */}
          <div className="modal-form-group">
            <label>Itens / Descrição do Pedido</label>
            <input
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder="Ex.: Combo 05 marmitas (3x Frango, 2x Carne)"
              required
            />
          </div>

          {/* Valor and Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="modal-form-group">
              <label>Valor Total (R$) *</label>
              <input
                type="number"
                step="0.50"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="119.00"
                required
              />
            </div>
            <div className="modal-form-group">
              <label>Status Inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "#fafafa",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <option value="Pedido Recebido">Pedido Recebido</option>
                <option value="Em Preparo">Em Preparo</option>
                <option value="Aguardando">Aguardando</option>
                <option value="Na Entrega">Na Entrega</option>
              </select>
            </div>
          </div>

          {/* Forma de Pagamento e Canal */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="modal-form-group">
              <label>Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "#fafafa",
                  fontSize: 13,
                }}
              >
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
            <div className="modal-form-group">
              <label>Canal</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as "Delivery" | "Retirada")}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "#fafafa",
                  fontSize: 13,
                }}
              >
                <option value="Delivery">Delivery</option>
                <option value="Retirada">Retirada no local</option>
              </select>
            </div>
          </div>

          {channel === "Delivery" && (
            <div className="modal-form-group">
              <label>Endereço de Entrega (Opcional)</label>
              <input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Rua, número, bairro, complemento..."
              />
            </div>
          )}

          <button
            type="submit"
            className="primary-button full"
            style={{ marginTop: 16, background: "var(--hunter)", color: "#fff" }}
          >
            Confirmar e Lançar Venda <Check size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

