export const HAVIX_HOST_VERSION = 2

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface HavixCartLine {
  entryId: string
  productId: string
  variantId?: string
  name: string
  variantName?: string
  thumbnailUrl?: string | null
  quantity: number
  unitPostTaxes: number
  totalPostTaxes: number
}

export interface HavixCart {
  cartId: string
  entriesCount: number
  lines: HavixCartLine[]
  totalPostTaxes: number
  appliedCouponCode?: string | null
}

export interface HavixCartBridge {
  readonly cart: HavixCart | null
  readonly loading: boolean
  readonly count: number
  readonly total: number
  readonly isEmpty: boolean
  fetch(): Promise<void>
  addItem(productId: string, quantity: number, variantId?: string): Promise<void>
  updateItem(entryId: string, quantity: number): Promise<void>
  removeItem(entryId: string): Promise<void>
  applyDiscount(code: string): Promise<void>
  removeDiscount(code: string): Promise<void>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface HavixCustomer {
  id: string
  email: string
  firstname: string
  lastname: string
  name: string
  phone?: string
  guest: boolean
}

export interface HavixAuthBridge {
  readonly isLoggedIn: boolean
  readonly customer: HavixCustomer | null
  readonly fullName: string
  readonly loading: boolean
  readonly hydrated: boolean
  login(identifier: string, password: string): Promise<{ requires2FA: boolean }>
  logout(): void
  register(data: {
    firstname: string
    lastname: string
    email: string
    password: string
    phone?: string
  }): Promise<void>
}

// ── B2B ───────────────────────────────────────────────────────────────────────

export interface HavixB2bCredit {
  creditLimitCents: number
  usedCreditCents: number
  availableCreditCents: number
  status: 'ACTIVE' | 'SUSPENDED' | 'DELINQUENT'
}

export interface HavixB2bBridge {
  readonly isB2b: boolean
  readonly companyName: string
  readonly canPlaceOrders: boolean
  readonly credit: HavixB2bCredit | null
  readonly contextLoading: boolean
  ensureContext(isLoggedIn: boolean): Promise<void>
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export type HavixToastVariant = 'success' | 'error' | 'info'

export interface HavixToastBridge {
  show(message: string, variant?: HavixToastVariant, duration?: number): void
}

// ── API types ─────────────────────────────────────────────────────────────────

export interface HavixPagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last: boolean
}

export interface HavixProductImage {
  url: string
  altText?: string
}

export interface HavixProductSummary {
  id: string
  slug: string
  name: string
  description?: string
  thumbnailUrl?: string | null
  brand?: string
  pricePostTaxes: number
  originalPricePostTaxes?: number | null
  inStock: boolean
  rating?: number | null
  reviewCount?: number
}

export interface HavixVariantOption {
  groupName: string
  value: string
}

export interface HavixVariant {
  id: string
  sku?: string
  pricePostTaxes: number
  originalPricePostTaxes?: number | null
  inStock: boolean
  options: HavixVariantOption[]
  images?: HavixProductImage[]
}

export interface HavixProductDetail extends HavixProductSummary {
  fullDescription?: string
  images: HavixProductImage[]
  variants: HavixVariant[]
  categoryIds?: string[]
  attributes?: Record<string, string>
}

export interface HavixCategory {
  id: string
  name: string
  slug?: string
  description?: string
  featured: boolean
  imageUrl?: string | null
}

export interface HavixReview {
  id: string
  rating: number
  title?: string
  description?: string
  customerName?: string
  createdAt: string
}

export interface HavixProductSearchResult {
  content: HavixProductSummary[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last: boolean
  facets?: Record<string, Array<{ key: string; label: string; count: number }>>
}

export interface HavixOrderSummary {
  id: string
  number: string
  status: string
  totalPostTaxes: number
  placedAt: string
  itemCount: number
}

export interface HavixOrderItem {
  productId: string
  variantId?: string
  name: string
  variantName?: string
  quantity: number
  unitPostTaxes: number
  totalPostTaxes: number
  thumbnailUrl?: string | null
}

export interface HavixAddress {
  id: string
  firstname: string
  lastname: string
  street: string
  number?: string
  complement?: string
  neighborhood?: string
  city: string
  state: string
  country: string
  postalCode: string
  phone?: string
  isDefault?: boolean
}

export interface HavixQuote {
  id: string
  status: string
  totalCents: number
  createdAt: string
  expiresAt?: string
}

export interface HavixInvoice {
  id: string
  orderId: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  totalCents: number
  dueDate: string
}

// ── API bridge ────────────────────────────────────────────────────────────────

export interface HavixApiBridge {
  catalog: {
    list(params?: { page?: number; size?: number; sort?: string }): Promise<HavixPagedResponse<HavixProductSummary>>
    byCategory(categoryId: string, params?: { page?: number; size?: number; sort?: string }): Promise<HavixPagedResponse<HavixProductSummary>>
    search(params: { q?: string; categoryIds?: string[]; priceMin?: number; priceMax?: number; inStock?: boolean; sort?: string; page?: number; size?: number }): Promise<HavixProductSearchResult>
    detail(slug: string): Promise<HavixProductDetail>
  }
  category: {
    list(featuredOnly?: boolean): Promise<HavixCategory[]>
  }
  reviews: {
    recent(params?: { size?: number; minRating?: number }): Promise<HavixReview[]>
    byProduct(productId: string, params?: { page?: number; size?: number }): Promise<HavixPagedResponse<HavixReview>>
    submit(productId: string, data: { rating: number; title?: string; description?: string }): Promise<HavixReview>
  }
  customer: {
    listOrders(params?: { page?: number; size?: number }): Promise<HavixPagedResponse<HavixOrderSummary>>
    getOrderItems(orderId: string): Promise<HavixOrderItem[]>
    listAddresses(): Promise<HavixAddress[]>
    updateProfile(data: { firstname: string; lastname: string; phone?: string }): Promise<HavixCustomer>
  }
  b2b: {
    listQuotes(params?: { page?: number; size?: number }): Promise<HavixPagedResponse<HavixQuote>>
    getQuote(id: string): Promise<HavixQuote>
    getCreditSummary(): Promise<HavixB2bCredit>
    listInvoices(): Promise<HavixInvoice[]>
  }
}

// ── Root bridge ───────────────────────────────────────────────────────────────

export interface HavixHostBridge {
  version: number
  cart: HavixCartBridge
  auth: HavixAuthBridge
  b2b: HavixB2bBridge
  toast: HavixToastBridge
  api: HavixApiBridge
}

declare global {
  interface Window {
    __HAVIX_HOST__?: HavixHostBridge
  }
}
