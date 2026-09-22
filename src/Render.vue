<template>
  <section class="hxcg">
    <!-- Loading skeletons -->
    <div v-if="loading" class="hxcg__grid" :style="gridVars">
      <div v-for="i in count" :key="i" class="hxcg__card hxcg__card--skeleton">
        <div class="hxcg__shimmer" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!cards.length" class="hxcg__empty">
      Nenhuma categoria encontrada.
    </div>

    <!-- Cards -->
    <div v-else class="hxcg__grid" :style="gridVars">
      <a
        v-for="(card, i) in cards"
        :key="card.key"
        :href="card.href"
        class="hxcg__card"
        :style="{ '--i': i }"
      >
        <!-- Image layer -->
        <figure class="hxcg__figure">
          <img
            class="hxcg__img"
            :src="card.image"
            :alt="card.name"
            loading="lazy"
          />
        </figure>

        <!-- Gradient overlay -->
        <div class="hxcg__overlay" />

        <!-- Content: name + button -->
        <div class="hxcg__content">
          <p class="hxcg__name">{{ card.name }}</p>
          <span class="hxcg__btn">
            {{ buttonText }}
            <svg class="hxcg__arrow" viewBox="0 0 22 10" fill="none" aria-hidden="true">
              <path d="M1 5H21M17 1L21 5L17 9" stroke="currentColor" stroke-width="1.3"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </div>
      </a>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHavixApi } from './host/index'

const props = defineProps({
  configuration: { type: Object, default: () => ({}) },
  page:          { type: Object, default: () => ({}) },
  storefront:    { type: Object, default: () => ({}) },
})

const api     = useHavixApi()
const loading = ref(true)
const rawCats = ref([])

const count        = computed(() => Math.min(3, Math.max(1, Number(props.configuration?.content?.count)       || 3)))
const buttonText   = computed(() => props.configuration?.content?.buttonText   || 'Compre agora')
const featuredOnly = computed(() => props.configuration?.content?.featuredOnly ?? true)
const gap          = computed(() => `${props.configuration?.style?.gap ?? 4}px`)

// ── Campo `media` ─────────────────────────────────────────────────────────────
// O valor é só uma string com a URL do arquivo escolhido na biblioteca de mídia
// (o lojista ainda escolhe o formato: thumb/small/medium/large). Vazio = não configurado.
const fallbackImage = computed(() => props.configuration?.content?.fallbackImage || '')

// ── Campo `repeater` ──────────────────────────────────────────────────────────
// O valor é um array de objetos, uma chave por subFields[].id — aqui: image, title, href.
// Nunca confie no formato: é JSON gravado, pode vir undefined, com item sem alguma chave
// (sub-campo criado depois) ou até no formato antigo, se o campo já existiu como texto.
const manualCards = computed(() => {
  const raw = props.configuration?.content?.manualCards
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => ({
      title: String(item?.title ?? '').trim(),
      href:  String(item?.href  ?? '').trim() || '/',
      image: String(item?.image ?? '').trim(),
    }))
    .filter((item) => item.title || item.image)
})

// Cards manuais primeiro; o catálogo preenche o resto até `count`.
const cards = computed(() => {
  const manual = manualCards.value.map((item, i) => ({
    key:   `manual-${i}`,
    name:  item.title,
    href:  item.href,
    image: item.image || fallbackImage.value || placeholder(item.title || 'Card'),
  }))

  const fromCatalog = rawCats.value.map((cat) => ({
    key:   cat.id,
    name:  cat.name,
    href:  `/category/${cat.slug ?? cat.id}`,
    image: cat.imageUrl || fallbackImage.value || placeholder(cat.name),
  }))

  return [...manual, ...fromCatalog].slice(0, count.value)
})

const gridVars = computed(() => ({
  '--cols': count.value,
  '--gap':  gap.value,
}))

function placeholder(name) {
  const encoded = encodeURIComponent(name)
  return `https://placehold.co/800x960/1c1c1c/444?text=${encoded}`
}

onMounted(async () => {
  // Inject Montserrat font once
  if (!document.getElementById('hxcg-font')) {
    const link = document.createElement('link')
    link.id   = 'hxcg-font'
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;300;400&display=swap'
    document.head.appendChild(link)
  }

  // Cards manuais já preencheram tudo: nem precisa bater no catálogo.
  if (manualCards.value.length >= count.value) {
    loading.value = false
    return
  }

  try {
    rawCats.value = await api.category.list(featuredOnly.value)
  } catch {
    rawCats.value = []
  } finally {
    loading.value = false
  }
})
</script>

<!-- Styles live in src/style.css — loaded by the host as a separate stylesheet -->
