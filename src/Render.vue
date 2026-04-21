<template>
  <section class="hxcg">
    <!-- Loading skeletons -->
    <div v-if="loading" class="hxcg__grid" :style="gridVars">
      <div v-for="i in count" :key="i" class="hxcg__card hxcg__card--skeleton">
        <div class="hxcg__shimmer" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!categories.length" class="hxcg__empty">
      Nenhuma categoria encontrada.
    </div>

    <!-- Cards -->
    <div v-else class="hxcg__grid" :style="gridVars">
      <a
        v-for="(cat, i) in categories"
        :key="cat.id"
        :href="`/category/${cat.slug ?? cat.id}`"
        class="hxcg__card"
        :style="{ '--i': i }"
      >
        <!-- Image layer -->
        <figure class="hxcg__figure">
          <img
            class="hxcg__img"
            :src="cat.imageUrl ?? placeholder(cat.name)"
            :alt="cat.name"
            loading="lazy"
          />
        </figure>

        <!-- Gradient overlay -->
        <div class="hxcg__overlay" />

        <!-- Content: name + button -->
        <div class="hxcg__content">
          <p class="hxcg__name">{{ cat.name }}</p>
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

const categories = computed(() => rawCats.value.slice(0, count.value))

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
