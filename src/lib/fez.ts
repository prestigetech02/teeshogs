type FezState = {
  id: number
  state: string
}

type FezCostResponse = {
  status?: string
  description?: string
  cost?: { state?: string; cost?: number }
  Cost?: { state?: string; cost?: number }
  vat?: { vatAmount?: number; vatPercent?: string }
  totalCost?: number
}

export type FezDeliveryQuote = {
  state: string
  cost: number
  vat: number
  totalCost: number
}

export type FezCreateOrderInput = {
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientState: string
  uniqueID: string
  BatchID: string
  valueOfItem: string
  description?: string
}

function getFezConfig() {
  const secretKey = process.env.FEZ_SECRET_KEY?.trim()
  const baseUrl = (
    process.env.FEZ_BASE_URL?.trim() || "https://apisandbox.fezdelivery.co/v1"
  ).replace(/\/$/, "")

  if (!secretKey) {
    throw new Error("Missing FEZ_SECRET_KEY")
  }

  return { secretKey, baseUrl }
}

async function fezFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { secretKey, baseUrl } = getFezConfig()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "secret-key": secretKey,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  const data = (await response.json().catch(() => ({}))) as T & {
    status?: string
    description?: string
    message?: string
  }

  if (!response.ok) {
    throw new Error(
      data.description || data.message || `Fez request failed (${response.status})`
    )
  }

  return data
}

export async function listFezStates(): Promise<FezState[]> {
  const data = await fezFetch<{ states?: FezState[]; status?: string }>("/states", {
    method: "GET",
  })
  return data.states ?? []
}

export async function getFezDeliveryCost(
  state: string,
  weight?: number
): Promise<FezDeliveryQuote> {
  const defaultWeight = Number(process.env.FEZ_DEFAULT_WEIGHT_KG || "1")
  const body: Record<string, unknown> = { state }
  const resolvedWeight = weight ?? (Number.isFinite(defaultWeight) ? defaultWeight : 1)
  if (resolvedWeight > 0) body.weight = resolvedWeight

  const data = await fezFetch<FezCostResponse>("/order/cost", {
    method: "POST",
    body: JSON.stringify(body),
  })

  const cost = Number(data.cost?.cost ?? data.Cost?.cost ?? 0)
  const vat = Number(data.vat?.vatAmount ?? 0)
  const totalCost = Number(data.totalCost ?? cost + vat)

  if (!Number.isFinite(totalCost) || totalCost < 0) {
    throw new Error("Fez returned an invalid delivery cost")
  }

  return {
    state: data.cost?.state || data.Cost?.state || state,
    cost,
    vat,
    totalCost,
  }
}

export async function createFezDeliveryOrder(input: FezCreateOrderInput) {
  const data = await fezFetch<unknown>("/order", {
    method: "POST",
    body: JSON.stringify([input]),
  })

  // Response shapes vary; try common keys.
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: unknown[] }).data)
      ? (data as { data: unknown[] }).data
      : Array.isArray((data as { orders?: unknown[] }).orders)
        ? (data as { orders: unknown[] }).orders
        : [data]

  const first = (list[0] || {}) as Record<string, unknown>
  const orderNo =
    (first.orderNo as string) ||
    (first.orderNumber as string) ||
    (first.order_no as string) ||
    null

  return {
    raw: data,
    orderNo,
  }
}

export function getDefaultFezWeightKg() {
  const value = Number(process.env.FEZ_DEFAULT_WEIGHT_KG || "1")
  return Number.isFinite(value) && value > 0 ? value : 1
}
