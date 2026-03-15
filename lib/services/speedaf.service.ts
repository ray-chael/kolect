/**
 * Speedaf Logistics API service
 *
 * Two auth modes:
 *  - Old (DES/CBC): createOrder, cancelOrder, updateOrder, printLabel, trackSubscribe, trackQuery
 *    Content-Type: text/plain  Body: BASE64( DES_CBC( JSON ) )
 *    Sign header:  md5( timestamp + secretKey + data )  where data = raw JSON string
 *
 *  - New (sign-only): areaQuery, tariff, queryOrder
 *    Content-Type: application/text  Body: {"data":"<json_string>","sign":"<md5>"}
 *    Sign:         md5( timestamp + secretKey + data )  where data = json_string
 */

import * as crypto from "crypto";

// ─── Types ─────────────────────────────────────────────────────

interface SpeedafCredentials {
  appCode: string;
  secretKey: string; // must be exactly 8 characters
  customerCode: string;
  platformSource: string;
}

interface SpeedafAddress {
  countryCode: "NG";
  /** Speedaf area code for state */
  provinceCode: string;
  /** Speedaf area code for LGA / city */
  cityCode: string;
  addressDetail: string;
}

export interface CreateOrderParams {
  customerOrderNo: string;
  receiverName: string;
  receiverMobile: string;
  receiverAddress: SpeedafAddress;
  parcelWeight: number; // kg, up to 3 decimal places
  parcelValue?: number; // declared value
  remark?: string;
  quantity?: number;
}

export interface CancelOrderParams {
  billCode: string;
  cancelReason: string;
}

export interface UpdateOrderParams {
  billCode: string;
  receiverName?: string;
  receiverMobile?: string;
  receiverAddress?: SpeedafAddress;
  parcelWeight?: number;
}

export interface TrackSubscribeParams {
  mailNo: string;
  notifyUrl: string;
}

export interface TrackQueryParams {
  mailNoList: string[];
}

export interface AreaQueryParams {
  countryCode?: string;
  parentCode?: string;
  /** 0=country 1=state/province 2=city/LGA 3=district */
  type: 0 | 1 | 2 | 3;
}

export interface TariffParams {
  senderProvinceCode: string;
  senderCityCode: string;
  receiverProvinceCode: string;
  receiverCityCode: string;
  parcelWeight: number;
}

// ─── DES / Crypto helpers ──────────────────────────────────────

const DES_IV = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]);

function desEncrypt(plaintext: string, key: string): string {
  const keyBuf = Buffer.from(key, "utf8").slice(0, 8);
  const cipher = crypto.createCipheriv("des-cbc", keyBuf, DES_IV);
  cipher.setAutoPadding(true); // PKCS5 padding
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}

function md5(value: string): string {
  return crypto.createHash("md5").update(value, "utf8").digest("hex");
}

function buildSign(timestamp: number, secretKey: string, data: string): string {
  return md5(`${timestamp}${secretKey}${data}`);
}

// ─── HTTP helpers ──────────────────────────────────────────────

const BASE_URL = "https://apis.speedaf.com";

async function postOld<T>(
  path: string,
  creds: SpeedafCredentials,
  payload: object,
): Promise<T> {
  const timestamp = Date.now();
  const data = JSON.stringify(payload);
  const sign = buildSign(timestamp, creds.secretKey, data);
  const body = desEncrypt(data, creds.secretKey);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      appCode: creds.appCode,
      timestamp: String(timestamp),
      sign,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Speedaf HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { success: boolean; errorMessage?: string; data?: T };
  if (!json.success) {
    throw new Error(`Speedaf API error: ${json.errorMessage ?? "Unknown error"}`);
  }
  return json.data as T;
}

async function postNew<T>(
  path: string,
  creds: SpeedafCredentials,
  payload: object,
): Promise<T> {
  const timestamp = Date.now();
  const dataStr = JSON.stringify(payload);
  const sign = buildSign(timestamp, creds.secretKey, dataStr);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/text",
      appCode: creds.appCode,
      timestamp: String(timestamp),
    },
    body: JSON.stringify({ data: dataStr, sign }),
  });

  if (!res.ok) {
    throw new Error(`Speedaf HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { success: boolean; errorMessage?: string; data?: T };
  if (!json.success) {
    throw new Error(`Speedaf API error: ${json.errorMessage ?? "Unknown error"}`);
  }
  return json.data as T;
}

// ─── Service ───────────────────────────────────────────────────

export const speedafService = {
  /**
   * Create a waybill / shipment order.
   * Returns billCode (waybill number) and other order info.
   */
  async createOrder(creds: SpeedafCredentials, params: CreateOrderParams) {
    return postOld<{ billCode: string; customerOrderNo: string }>(
      "/open-api/express/order/createOrder",
      creds,
      {
        customerCode: creds.customerCode,
        platformSource: creds.platformSource,
        ...params,
      },
    );
  },

  /**
   * Cancel orders before pickup / warehousing.
   */
  async cancelOrder(
    creds: SpeedafCredentials,
    orders: CancelOrderParams[],
  ) {
    return postOld<{ successList: string[]; failList: string[] }>(
      "/open-api/express/order/cancelOrder",
      creds,
      orders.map((o) => ({ customerCode: creds.customerCode, ...o })),
    );
  },

  /**
   * Update receiver address / weight before pickup.
   */
  async updateOrder(creds: SpeedafCredentials, params: UpdateOrderParams) {
    return postOld<{ billCode: string }>(
      "/open-api/express/order/updateOrder",
      creds,
      { customerCode: creds.customerCode, ...params },
    );
  },

  /**
   * Get PDF label URLs for waybills.
   */
  async printLabel(creds: SpeedafCredentials, waybillNoList: string[]) {
    const timestamp = Date.now();
    const payload = { waybillNoList, labelType: 2, withLogo: true };
    const sign = buildSign(timestamp, creds.secretKey, JSON.stringify(payload));

    const res = await fetch(`${BASE_URL}/open-api/express/order/print`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        appCode: creds.appCode,
        timestamp: String(timestamp),
        sign,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Speedaf HTTP ${res.status}`);
    const json = (await res.json()) as { success: boolean; errorMessage?: string; data?: { pdfUrl: string }[] };
    if (!json.success) throw new Error(json.errorMessage ?? "Print failed");
    return json.data ?? [];
  },

  /**
   * Register a webhook for tracking updates on a waybill.
   */
  async trackSubscribe(
    creds: SpeedafCredentials,
    params: TrackSubscribeParams,
  ) {
    return postOld<{ mailNo: string }>(
      "/open-api/express/track/subscribe",
      creds,
      { customerCode: creds.customerCode, ...params },
    );
  },

  /**
   * Query tracking events by waybill numbers (up to 10).
   */
  async trackQuery(creds: SpeedafCredentials, params: TrackQueryParams) {
    return postOld<Array<{ mailNo: string; trackList: unknown[] }>>(
      "/open-api/express/track/query",
      creds,
      params,
    );
  },

  /**
   * Query tracking by your own customer order numbers (up to 10).
   */
  async trackQueryByCustomerOrderNos(
    creds: SpeedafCredentials,
    customerOrderNos: string[],
  ) {
    return postOld<Array<{ mailNo: string; trackList: unknown[] }>>(
      "/open-api/express/track/customer/order/query",
      creds,
      { customerOrderNos },
    );
  },

  /**
   * Fetch area tree for Nigeria (sign-only endpoint).
   * type: 1 = state/province list, 2 = LGA/city list (requires parentCode)
   */
  async getAreas(creds: SpeedafCredentials, params: AreaQueryParams) {
    return postNew<Array<{ code: string; name: string; parentCode: string }>>(
      "/open-api/common/area/new/getArea",
      creds,
      { countryCode: "NG", ...params },
    );
  },

  /**
   * Calculate shipping fee / tariff (sign-only endpoint).
   */
  async getTariff(creds: SpeedafCredentials, params: TariffParams) {
    return postNew<{ freight: number; currencyCode: string }>(
      "/open-api/fee/getFee",
      creds,
      { customerCode: creds.customerCode, ...params },
    );
  },

  /**
   * Fetch full waybill details by billCode (sign-only endpoint).
   */
  async queryOrder(creds: SpeedafCredentials, billCodes: string[]) {
    return postNew<Array<Record<string, unknown>>>(
      "/open-api/express/order/queryByCodes",
      creds,
      { customerCode: creds.customerCode, billCodes },
    );
  },

  /**
   * Get routing / three-sections code from a receiver address.
   */
  async getThreeSectionsCode(
    creds: SpeedafCredentials,
    address: SpeedafAddress,
  ) {
    return postOld<{ bigCode: string; smallCode: string; destCode: string }>(
      "/open-api/network/threeSectionsCode/getByAddress",
      creds,
      { customerCode: creds.customerCode, ...address },
    );
  },
};

/** Speedaf-provided sandbox credentials used when live credentials are not configured. */
const SPEEDAF_TEST_CREDENTIALS: SpeedafCredentials = {
  appCode: "test",
  secretKey: "12345678",
  customerCode: "test",
  platformSource: "WEB",
};

/**
 * Build a SpeedafCredentials object from system settings values.
 * Falls back to Speedaf test credentials (with a console warning) when
 * live credentials are missing or invalid, so the integration keeps working
 * before go-live.
 */
export function buildSpeedafCredentials(settings: Record<string, string>): SpeedafCredentials {
  const appCode = settings.speedafAppCode?.trim();
  const secretKey = settings.speedafSecretKey?.trim();
  const customerCode = settings.speedafCustomerCode?.trim();
  const platformSource = settings.speedafPlatformSource?.trim() || "WEB";

  if (!appCode || !secretKey || !customerCode) {
    console.warn("[Speedaf] Live credentials not configured — falling back to test credentials");
    return SPEEDAF_TEST_CREDENTIALS;
  }

  if (secretKey.length !== 8) {
    console.warn("[Speedaf] Secret key is not 8 characters — falling back to test credentials");
    return SPEEDAF_TEST_CREDENTIALS;
  }

  return { appCode, secretKey, customerCode, platformSource };
}
