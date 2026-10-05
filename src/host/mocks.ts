import { reactive } from 'vue'
import type {
  HavixCart,
  HavixCartBridge,
  HavixAuthBridge,
  HavixB2bBridge,
  HavixB2bCredit,
  HavixCustomer,
  HavixToastBridge,
  HavixApiBridge,
  HavixProductSummary,
  HavixProductDetail,
  HavixCategory,
  HavixReview,
  HavixOrderSummary,
  HavixAddress,
} from './types'
import { createMemoryWidgetStorage } from './storage'

// ── Cart ──────────────────────────────────────────────────────────────────────

const cartState = reactive({
  cart: null as HavixCart | null,
  loading: false,
})

export const mockCartBridge: HavixCartBridge = {
  get cart()    { return cartState.cart },
  get loading() { return cartState.loading },
  get count()   { return cartState.cart?.entriesCount ?? 0 },
  get total()   { return cartState.cart?.totalPostTaxes ?? 0 },
  get isEmpty() { return !cartState.cart?.lines?.length },

  async fetch() {
    cartState.loading = true
    await delay(300)
    if (!cartState.cart) cartState.cart = emptyCart()
    cartState.loading = false
  },

  async addItem(productId, quantity, variantId?) {
    if (!cartState.cart) cartState.cart = emptyCart()
    const existing = cartState.cart.lines.find(
      l => l.productId === productId && l.variantId === variantId,
    )
    if (existing) {
      existing.quantity += quantity
      existing.totalPostTaxes = existing.unitPostTaxes * existing.quantity
    } else {
      const entryId = `mock-${Date.now()}`
      cartState.cart.lines.push({
        entryId, productId, variantId,
        name: `Produto ${productId.slice(0, 6)}`,
        quantity,
        unitPostTaxes: 9990,
        totalPostTaxes: 9990 * quantity,
      })
    }
    recalc(cartState.cart)
  },

  async updateItem(entryId, quantity) {
    if (!cartState.cart) return
    if (quantity === 0) return mockCartBridge.removeItem(entryId)
    const line = cartState.cart.lines.find(l => l.entryId === entryId)
    if (line) {
      line.quantity = quantity
      line.totalPostTaxes = line.unitPostTaxes * quantity
    }
    recalc(cartState.cart)
  },

  async removeItem(entryId) {
    if (!cartState.cart) return
    cartState.cart.lines = cartState.cart.lines.filter(l => l.entryId !== entryId)
    recalc(cartState.cart)
  },

  async applyDiscount(_code) {
    cartState.cart = cartState.cart ? { ...cartState.cart, appliedCouponCode: _code } : null
  },

  async removeDiscount(_code) {
    if (cartState.cart) cartState.cart.appliedCouponCode = null
  },
}

function emptyCart(): HavixCart {
  return { cartId: 'mock-cart', entriesCount: 0, lines: [], totalPostTaxes: 0 }
}

function recalc(cart: HavixCart) {
  cart.totalPostTaxes = cart.lines.reduce((s, l) => s + l.totalPostTaxes, 0)
  cart.entriesCount   = cart.lines.reduce((s, l) => s + l.quantity, 0)
}

// ── Auth ──────────────────────────────────────────────────────────────────────

const authState = reactive({
  customer: null as HavixCustomer | null,
  loading:  false,
  hydrated: true,
})

export const mockAuthBridge: HavixAuthBridge = {
  get isLoggedIn() { return !!authState.customer && !authState.customer.guest },
  get customer()   { return authState.customer },
  get fullName()   {
    const c = authState.customer
    return c ? `${c.firstname} ${c.lastname}`.trim() : ''
  },
  get loading()  { return authState.loading },
  get hydrated() { return authState.hydrated },

  async login(identifier, _password) {
    authState.loading = true
    await delay(400)
    authState.customer = {
      id: 'mock-user-1', email: identifier,
      firstname: 'Dev', lastname: 'User', name: 'Dev User', guest: false,
    }
    authState.loading = false
    return { requires2FA: false }
  },

  logout() {
    authState.customer = null
  },

  async register(data) {
    authState.loading = true
    await delay(400)
    authState.customer = {
      id: 'mock-user-new', email: data.email,
      firstname: data.firstname, lastname: data.lastname,
      name: `${data.firstname} ${data.lastname}`, guest: false,
    }
    authState.loading = false
  },
}

// ── B2B ───────────────────────────────────────────────────────────────────────

const b2bState = reactive({
  isB2b:          false,
  companyName:    '',
  canPlaceOrders: false,
  credit:         null as HavixB2bCredit | null,
  contextLoading: false,
})

export const mockB2bBridge: HavixB2bBridge = {
  get isB2b()          { return b2bState.isB2b },
  get companyName()    { return b2bState.companyName },
  get canPlaceOrders() { return b2bState.canPlaceOrders },
  get credit()         { return b2bState.credit },
  get contextLoading() { return b2bState.contextLoading },
  async ensureContext(_isLoggedIn) { /* devkit: use seedB2b() directly */ },
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export const mockToastBridge: HavixToastBridge = {
  show(message, variant = 'info', _duration?) {
    console.log(`%c[HavixToast:${variant}] ${message}`,
      variant === 'success' ? 'color:green' : variant === 'error' ? 'color:red' : 'color:blue')
  },
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

export function seedAuth(customer: HavixCustomer | null) {
  authState.customer = customer
}

export function seedCart(cart: HavixCart | null) {
  cartState.cart = cart
}

export function seedB2b(opts: Partial<{
  isB2b: boolean
  companyName: string
  canPlaceOrders: boolean
  credit: HavixB2bCredit | null
}>) {
  Object.assign(b2bState, opts)
}

// ── API mock ──────────────────────────────────────────────────────────────────

function pagedOf<T>(content: T[], page = 0, size = 20) {
  return { content, totalElements: content.length, totalPages: 1, number: page, size, last: true }
}

const MOCK_PRODUCTS: HavixProductSummary[] = [
  { id: 'p1', slug: 'produto-exemplo-1', name: 'Produto Exemplo 1', pricePostTaxes: 9990, inStock: true, rating: 4.5, reviewCount: 12 },
  { id: 'p2', slug: 'produto-exemplo-2', name: 'Produto Exemplo 2', pricePostTaxes: 19990, originalPricePostTaxes: 24990, inStock: true, rating: 4.0, reviewCount: 5 },
  { id: 'p3', slug: 'produto-exemplo-3', name: 'Produto Exemplo 3', pricePostTaxes: 4990, inStock: false },
]

const MOCK_CATEGORIES: HavixCategory[] = [
  { id: 'cat1', name: 'Eletrônicos', slug: 'eletronicos', featured: true },
  { id: 'cat2', name: 'Roupas',      slug: 'roupas',      featured: true },
  { id: 'cat3', name: 'Casa',        slug: 'casa',         featured: false },
]

const MOCK_REVIEWS: HavixReview[] = [
  { id: 'r1', rating: 5, title: 'Ótimo produto!',  customerName: 'Ana S.',   createdAt: '2025-01-10T10:00:00Z' },
  { id: 'r2', rating: 4, title: 'Muito bom',       customerName: 'Carlos M.', createdAt: '2025-02-14T08:30:00Z' },
  { id: 'r3', rating: 3, title: 'Razoável',        customerName: 'Julia P.', createdAt: '2025-03-05T15:00:00Z' },
]

const MOCK_ORDERS: HavixOrderSummary[] = [
  { id: 'ord1', number: '00001', status: 'DELIVERED', totalPostTaxes: 19980, placedAt: '2025-01-05T09:00:00Z', itemCount: 2 },
  { id: 'ord2', number: '00002', status: 'PROCESSING', totalPostTaxes: 9990,  placedAt: '2025-03-20T14:00:00Z', itemCount: 1 },
]

const MOCK_ADDRESSES: HavixAddress[] = [
  {
    id: 'addr1', firstname: 'Dev', lastname: 'User',
    street: 'Rua Exemplo', number: '123', city: 'São Paulo',
    state: 'SP', country: 'BR', postalCode: '01310-100', isDefault: true,
  },
]

export const mockApiBridge: HavixApiBridge = {
  catalog: {
    async list(params = {}) {
      await delay(200)
      const size = params.size ?? 20
      const page = params.page ?? 0
      return pagedOf(MOCK_PRODUCTS.slice(page * size, page * size + size), page, size)
    },
    async byCategory(_categoryId, params = {}) {
      await delay(200)
      return pagedOf(MOCK_PRODUCTS.slice(0, 2), params.page ?? 0, params.size ?? 20)
    },
    async search(params) {
      await delay(200)
      const q = params.q?.toLowerCase() ?? ''
      const filtered = q ? MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(q)) : MOCK_PRODUCTS
      return { ...pagedOf(filtered), facets: {} }
    },
    async detail(slug) {
      await delay(200)
      const product = MOCK_PRODUCTS.find(p => p.slug === slug) ?? MOCK_PRODUCTS[0]
      return {
        ...product,
        fullDescription: 'Descrição completa do produto de exemplo.',
        images: [{ url: 'https://placehold.co/400x400', altText: product.name }],
        variants: [],
      } satisfies HavixProductDetail
    },
  },

  category: {
    async list(_featuredOnly = false) {
      await delay(150)
      return _featuredOnly ? MOCK_CATEGORIES.filter(c => c.featured) : MOCK_CATEGORIES
    },
  },

  reviews: {
    async recent(params = {}) {
      await delay(150)
      return MOCK_REVIEWS.slice(0, params.size ?? 12)
    },
    async byProduct(_productId, params = {}) {
      await delay(150)
      return pagedOf(MOCK_REVIEWS, params.page ?? 0, params.size ?? 5)
    },
    async submit(_productId, data) {
      await delay(300)
      return {
        id: `r-${Date.now()}`,
        rating: data.rating,
        title: data.title,
        description: data.description,
        customerName: 'Dev User',
        createdAt: new Date().toISOString(),
      }
    },
  },

  customer: {
    async listOrders(params = {}) {
      await delay(200)
      return pagedOf(MOCK_ORDERS, params.page ?? 0, params.size ?? 10)
    },
    async getOrderItems(_orderId) {
      await delay(150)
      return [
        { productId: 'p1', name: 'Produto Exemplo 1', quantity: 2, unitPostTaxes: 9990, totalPostTaxes: 19980 },
      ]
    },
    async listAddresses() {
      await delay(150)
      return MOCK_ADDRESSES
    },
    async updateProfile(data) {
      await delay(300)
      const c = authState.customer
      if (c) Object.assign(c, data)
      return authState.customer ?? { id: 'mock', email: '', firstname: data.firstname, lastname: data.lastname, name: `${data.firstname} ${data.lastname}`, guest: false }
    },
  },

  b2b: {
    async listQuotes(params = {}) {
      await delay(200)
      return pagedOf([], params.page ?? 0, params.size ?? 10)
    },
    async getQuote(id) {
      await delay(200)
      return { id, status: 'DRAFT', totalCents: 0, createdAt: new Date().toISOString() }
    },
    async getCreditSummary() {
      await delay(150)
      return b2bState.credit ?? { creditLimitCents: 0, usedCreditCents: 0, availableCreditCents: 0, status: 'ACTIVE' as const }
    },
    async listInvoices() {
      await delay(150)
      return []
    },
  },
}

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

// ── Storage ───────────────────────────────────────────────────────────────────
// Em memória: mesmas regras do storage da loja (namespace, 8 KB, 50 chaves, TTL), mas some ao recarregar.

export const mockStorageBridge = createMemoryWidgetStorage()
