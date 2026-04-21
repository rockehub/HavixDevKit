<template>
  <div class="hxcg-preview">
    <div class="hxcg-preview__grid">
      <div v-for="i in 3" :key="i" class="hxcg-preview__card">
        <div class="hxcg-preview__overlay" />
        <div class="hxcg-preview__content">
          <p class="hxcg-preview__name">Categoria</p>
          <span class="hxcg-preview__btn">Compre agora →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Styles live in src/style.css -->
