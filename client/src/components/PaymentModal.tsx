import { useEffect, useState } from "react";
import { Check, Copy, CreditCard, ExternalLink, QrCode, ShieldCheck, X } from "lucide-react";
import { formatBRL } from "@/lib/demoData";
import { createInfinitePayPayment, type InfinitePayPaymentDetails } from "@/lib/infinitepay";

interface PaymentModalProps {
  orderNumber: string;
  total: number;
  customerName: string;
  customerPhone: string;
  itemsSummary: string;
  onClose: () => void;
  onSuccess: (paymentMethod: string) => void;
}

export function PaymentModal({
  orderNumber,
  total,
  customerName,
  customerPhone,
  itemsSummary,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos
  const [paymentDetails, setPaymentDetails] = useState<InfinitePayPaymentDetails | null>(null);
  const [officialCheckoutUrl, setOfficialCheckoutUrl] = useState<string | null>(null);
  const [loadingCheckoutUrl, setLoadingCheckoutUrl] = useState(false);

  useEffect(() => {
    const details = createInfinitePayPayment(orderNumber, total);
    setPaymentDetails(details);

    // Gerar link oficial com valor travado na API da InfinitePay
    let isCancelled = false;
    setLoadingCheckoutUrl(true);

    fetch("/api/infinitepay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber,
        amount: total,
        description: `Pedido #${orderNumber} (${itemsSummary.slice(0, 70)})`,
        customerName,
        customerPhone,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data?.success && data?.url) {
          setOfficialCheckoutUrl(data.url);
        }
      })
      .catch((err) => {
        console.warn("Aviso ao conectar com a API da InfinitePay:", err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingCheckoutUrl(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [orderNumber, total, itemsSummary, customerName, customerPhone]);

  // Contador regressivo de expiração do Pix
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyPix = async () => {
    if (!paymentDetails?.brCode) return;
    try {
      await navigator.clipboard.writeText(paymentDetails.brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback para navegadores sem permissão de clipboard
      const input = document.createElement("input");
      input.value = paymentDetails.brCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleConfirmPaid = () => {
    const selectedMethod = method === "pix" ? "Pix (InfinitePay)" : "Cartão (InfinitePay)";

    // Link do WhatsApp com a mensagem do pedido
    const cleanPhone = "5565999865093"; // WhatsApp HouseFit
    const message = encodeURIComponent(
      `Olá HouseFit! 👋\n\n` +
      `Acabei de realizar o pedido *#${orderNumber}* no site!\n` +
      `*Cliente:* ${customerName}\n` +
      `*Telefone:* ${customerPhone}\n` +
      `*Itens:* ${itemsSummary}\n` +
      `*Total:* ${formatBRL(total)}\n` +
      `*Forma de pagamento:* ${selectedMethod}\n\n` +
      `Segue o comprovante do pagamento! 🧾`
    );

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");

    onSuccess(selectedMethod);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#198038", marginBottom: 6 }}>
          <ShieldCheck size={18} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Pagamento Seguro via InfinitePay
          </span>
        </div>

        <h3 style={{ fontSize: 22, margin: "0 0 4px" }}>Pagar pedido #{orderNumber}</h3>
        <p className="modal-description" style={{ margin: "0 0 16px" }}>
          Escolha como deseja pagar o valor de <b style={{ color: "var(--ink)" }}>{formatBRL(total)}</b>.
        </p>

        {/* Abas Pix ou Cartão */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setMethod("pix")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: `2px solid ${method === "pix" ? "#198038" : "var(--line)"}`,
              background: method === "pix" ? "#f2f9f4" : "#ffffff",
              color: method === "pix" ? "#198038" : "var(--ink)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <QrCode size={18} /> Pix Instantâneo
          </button>

          <button
            type="button"
            onClick={() => setMethod("card")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: `2px solid ${method === "card" ? "#198038" : "var(--line)"}`,
              background: method === "card" ? "#f2f9f4" : "#ffffff",
              color: method === "card" ? "#198038" : "var(--ink)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <CreditCard size={18} /> Cartão de Crédito
          </button>
        </div>

        {/* Conteúdo Aba Pix */}
        {method === "pix" && paymentDetails && (
          <div>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "16px",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "inline-block", padding: 8, background: "#ffffff", borderRadius: 8, border: "1px solid #e0e0e0" }}>
                <img
                  src={paymentDetails.qrCodeUrl}
                  alt="QR Code Pix InfinitePay"
                  style={{ width: 190, height: 190, display: "block" }}
                />
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
                Válido por: <strong style={{ color: "#d14343" }}>{formatMinutes(timeLeft)}</strong>
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: copied ? "#198038" : "#24a148",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 0.2s",
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={18} /> Código Pix Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> Copiar Código Pix (Copia e Cola)
                    </>
                  )}
                </button>
              </div>
            </div>

            <ol style={{ fontSize: 12, color: "#555", margin: "14px 0 0 16px", padding: 0, lineHeight: 1.6 }}>
              <li>Abra o aplicativo do seu banco favorito.</li>
              <li>Escolha a opção <b>Pix ➔ Pix Copia e Cola</b> ou <b>Ler QR Code</b>.</li>
              <li>Cole o código copiado ou aponte a câmera para confirmar o pagamento.</li>
            </ol>
          </div>
        )}

        {/* Conteúdo Aba Cartão */}
        {method === "card" && paymentDetails && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ padding: "4px 8px", background: "#f0f2f5", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Visa</span>
              <span style={{ padding: "4px 8px", background: "#f0f2f5", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Mastercard</span>
              <span style={{ padding: "4px 8px", background: "#f0f2f5", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Elo</span>
              <span style={{ padding: "4px 8px", background: "#f0f2f5", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Hipercard</span>
            </div>

            {officialCheckoutUrl ? (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 14,
                  fontSize: 12,
                  color: "#166534",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <ShieldCheck size={16} /> Link exclusivo gerado: valor de {formatBRL(total)} travado
              </div>
            ) : loadingCheckoutUrl ? (
              <div style={{ fontSize: 11, color: "#666", marginBottom: 12 }}>
                Gerando link oficial na InfinitePay com o valor travado...
              </div>
            ) : null}

            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 16px", lineHeight: 1.5 }}>
              O pagamento por cartão é processado com total segurança através do <b>checkout oficial da InfinitePay</b>, com opção de parcelamento em até 12x.
            </p>

            <a
              href={officialCheckoutUrl || paymentDetails.cardPaymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "13px 18px",
                borderRadius: 10,
                background: "#000000",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {loadingCheckoutUrl ? "Carregando Checkout..." : "Abrir Checkout InfinitePay"} <ExternalLink size={16} />
            </a>
          </div>
        )}

        {/* Botão de Conclusão / Envio para WhatsApp */}
        <div style={{ marginTop: 20 }}>
          <button
            type="button"
            className="primary-button full"
            onClick={handleConfirmPaid}
            style={{
              padding: "13px",
              fontSize: 15,
              fontWeight: 800,
              background: "#198038",
              borderColor: "#198038",
              color: "#ffffff",
            }}
          >
            Já realizei o pagamento / Enviar no WhatsApp <Check size={18} />
          </button>
          <small style={{ display: "block", textAlign: "center", marginTop: 8, color: "#777", fontSize: 11 }}>
            Ao clicar, seu pedido é confirmado e o WhatsApp de atendimento abre com os detalhes do seu pedido.
          </small>
        </div>
      </div>
    </div>
  );
}
