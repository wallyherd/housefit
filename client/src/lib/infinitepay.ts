import { loadFromStorage, saveToStorage } from "./demoData";

export interface InfinitePayConfig {
  pixKey: string;
  handle: string;
  merchantName: string;
  merchantCity: string;
}

const CONFIG_STORAGE_KEY = "housefit-infinitepay-config";

export function getInfinitePayConfig(): InfinitePayConfig {
  const stored = loadFromStorage<Partial<InfinitePayConfig>>(CONFIG_STORAGE_KEY, {});
  return {
    pixKey: stored.pixKey || import.meta.env.VITE_INFINITEPAY_PIX_KEY || "contato@housefit.com.br",
    handle: stored.handle || import.meta.env.VITE_INFINITEPAY_HANDLE || "housefit",
    merchantName: stored.merchantName || import.meta.env.VITE_INFINITEPAY_MERCHANT_NAME || "HOUSEFIT",
    merchantCity: stored.merchantCity || import.meta.env.VITE_INFINITEPAY_MERCHANT_CITY || "CUIABA",
  };
}

export function saveInfinitePayConfig(config: InfinitePayConfig): void {
  saveToStorage(CONFIG_STORAGE_KEY, config);
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixBRCode({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txId,
}: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txId: string;
}): string {
  const cleanKey = pixKey.trim();
  const cleanName = (merchantName || "HOUSEFIT")
    .slice(0, 25)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const cleanCity = (merchantCity || "CUIABA")
    .slice(0, 15)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const formattedAmount = amount.toFixed(2);
  const cleanTxId = (txId || "HOUSEFIT").slice(0, 25).replace(/[^a-zA-Z0-9]/g, "");

  const merchantAccountInfo =
    formatField("00", "br.gov.bcb.pix") +
    formatField("01", cleanKey);

  const additionalData = formatField("05", cleanTxId);

  const raw =
    formatField("00", "01") +
    formatField("01", "12") +
    formatField("26", merchantAccountInfo) +
    formatField("52", "0000") +
    formatField("53", "986") +
    formatField("54", formattedAmount) +
    formatField("58", "BR") +
    formatField("59", cleanName) +
    formatField("60", cleanCity) +
    formatField("62", additionalData) +
    "6304";

  const crc = calculateCRC16(raw);
  return `${raw}${crc}`;
}

export interface InfinitePayPaymentDetails {
  brCode: string;
  qrCodeUrl: string;
  txId: string;
  amount: number;
  expiresInMinutes: number;
  cardPaymentUrl: string;
}

export function createInfinitePayPayment(orderNumber: string, amount: number): InfinitePayPaymentDetails {
  const config = getInfinitePayConfig();
  const cleanNumber = orderNumber.replace(/[^a-zA-Z0-9]/g, "");
  const txId = `HF${cleanNumber}`;

  const brCode = generatePixBRCode({
    pixKey: config.pixKey,
    merchantName: config.merchantName,
    merchantCity: config.merchantCity,
    amount,
    txId,
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(brCode)}`;

  const cleanHandle = config.handle.replace("@", "").trim();
  const cardPaymentUrl = cleanHandle.startsWith("http")
    ? cleanHandle
    : `https://loja.infinitepay.io/${cleanHandle}`;

  return {
    brCode,
    qrCodeUrl,
    txId,
    amount,
    expiresInMinutes: 15,
    cardPaymentUrl,
  };
}
