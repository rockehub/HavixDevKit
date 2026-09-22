<template>
  <div class="devkit">
    <header class="devkit-bar">
      <span class="devkit-title">Havix Widget Devkit</span>
      <div class="devkit-controls">
        <label class="devkit-check">
          <input type="checkbox" v-model="loggedIn" @change="toggleAuth" />
          Logado
        </label>
        <label class="devkit-check" :class="{ disabled: !loggedIn }">
          <input type="checkbox" v-model="isB2b" @change="toggleB2b" :disabled="!loggedIn" />
          B2B
        </label>
        <button class="devkit-btn" @click="addMockItem">+ Item no carrinho</button>
        <button class="devkit-btn secondary" @click="clearCart">Limpar carrinho</button>
      </div>
    </header>

    <div class="devkit-info">
      <span v-if="loggedIn">👤 Dev User</span>
      <span v-else>👤 Visitante</span>
      &nbsp;|&nbsp;
      <span>🛒 {{ cartCount }} iten(s) — R$ {{ cartTotal }}</span>
      <span v-if="isB2b">&nbsp;| 🏢 Acme Corp</span>
    </div>

    <div class="devkit-preview">
      <Render
        :configuration="configuration"
        :page="page"
        :storefront="storefront"
        area-name="main"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue'
import Render from '../Render.vue'
import {
  mockCartBridge,
  mockAuthBridge,
  mockB2bBridge,
  mockToastBridge,
  seedAuth,
  seedCart,
  seedB2b,
} from '../host/mocks'
import type { HavixHostBridge } from '../host/types'

// Popula window.__HAVIX_HOST__ com mocks ANTES de Render.vue montar
onBeforeMount(() => {
  ;(window as Window).__HAVIX_HOST__ = {
    version: 1,
    cart:  mockCartBridge,
    auth:  mockAuthBridge,
    b2b:   mockB2bBridge,
    toast: mockToastBridge,
  } satisfies HavixHostBridge
})

// ── Mock state display ────────────────────────────────────────────────────────

const cartCount = computed(() => mockCartBridge.count)
const cartTotal = computed(() => ((mockCartBridge.total ?? 0) / 100).toFixed(2))

// ── Mock controls ─────────────────────────────────────────────────────────────

const loggedIn = ref(false)
const isB2b    = ref(false)

function toggleAuth() {
  if (loggedIn.value) {
    seedAuth({ id: 'mock-1', email: 'dev@havix.io', firstname: 'Dev', lastname: 'User', name: 'Dev User', guest: false })
  } else {
    seedAuth(null)
    isB2b.value = false
    seedB2b({ isB2b: false, companyName: '', canPlaceOrders: false, credit: null })
  }
}

function toggleB2b() {
  if (!loggedIn.value) return
  seedB2b({
    isB2b: isB2b.value,
    companyName:    isB2b.value ? 'Acme Corp' : '',
    canPlaceOrders: isB2b.value,
    credit: isB2b.value
      ? { creditLimitCents: 500000, usedCreditCents: 120000, availableCreditCents: 380000, status: 'ACTIVE' }
      : null,
  })
}

let mockProductIndex = 1
function addMockItem() {
  mockCartBridge.addItem(`prod-${mockProductIndex++}`, 1)
}

function clearCart() {
  seedCart(null)
}

// ── Widget props (edite aqui para testar diferentes configurações) ─────────────

const configuration = ref({
  content: {
    count: 3,
    featuredOnly: true,
    buttonText: 'Compre agora',

    // Campo `media`: no builder vira um seletor da biblioteca de mídia da loja;
    // aqui é só a URL que ele gravaria.
    fallbackImage: '',

    // Campo `repeater`: array de objetos, uma chave por subFields[].id.
    // Descomente um item pra ver o card manual entrando antes do catálogo.
    manualCards: [
      // { image: 'https://placehold.co/800x960/1d4ed8/ffffff?text=Promo', title: 'Promoções', href: '/promos' },
    ],
  },
  style: { gap: 4 },
})

const page = ref({
  type: 'HOME',
  slug: '',
  title: 'Dev Preview',
})

const storefront = ref({
  storeName:    'Dev Store',
  primaryColor: '#2563eb',
})
</script>

<style scoped>
.devkit { display: flex; flex-direction: column; min-height: 100vh; }

.devkit-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  background: #1e293b; color: #f8fafc; padding: 10px 16px;
}

.devkit-title { font-weight: 600; font-size: 14px; }

.devkit-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-left: auto; }

.devkit-check { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
.devkit-check.disabled { opacity: 0.4; cursor: not-allowed; }

.devkit-btn {
  font-size: 12px; padding: 4px 10px; border-radius: 4px; border: none; cursor: pointer;
  background: #3b82f6; color: white;
}
.devkit-btn.secondary { background: #475569; }
.devkit-btn:hover { opacity: 0.85; }

.devkit-info {
  background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  padding: 6px 16px; font-size: 12px; color: #64748b;
}

.devkit-preview { flex: 1; padding: 24px; }
</style>
