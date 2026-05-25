<template>
  <div class="space-y-8">
    <UCard>
      <h2 class="text-2xl font-bold text-highlighted mb-4">{{ $t('intro.title') }}</h2>
      <p class="text-muted">
        {{ $t('intro.description') }}
      </p>
    </UCard>

    <UCard>
      <h2 class="text-2xl font-bold text-highlighted mb-4">{{ $t('intro.features.title') }}</h2>
      <div class="space-y-4">
        <div v-for="(feature, index) in $tm('intro.features.list') as any[]" :key="index" class="flex items-start">
          <span class="shrink-0 p-1 bg-primary/10 rounded-lg mr-3">
            <UIcon :name="featureIcons[index]" class="w-5 h-5 text-primary" />
          </span>
          <div>
            <h3 class="font-medium text-highlighted">{{ $rt(feature.title) }}</h3>
            <p class="text-muted">{{ $rt(feature.description) }}</p>
          </div>
        </div>
      </div>
    </UCard>

    <UCard>
      <h2 class="text-2xl font-bold text-highlighted mb-4">{{ $t('intro.concept.title') }}</h2>
      <p class="text-muted mb-4">{{ $t('intro.concept.description') }}</p>
      <ul class="space-y-2">
        <li
            v-for="(benefit, index) in $tm('intro.concept.benefits')" :key="index"
            class="flex items-start">
          <span class="text-primary mr-2">•</span>
          <span class="text-muted">{{ $rt(benefit) }}</span>
        </li>
      </ul>
    </UCard>

    <UCard>
      <h2 class="text-2xl font-bold text-highlighted mb-4">{{ $t('intro.usage.title') }}</h2>
      <ol class="space-y-2">
        <li
          v-for="(step, index) in $tm('intro.usage.steps')" :key="index"
            class="flex">
          <span class="font-bold text-primary mr-2">{{ Number(index) + 1 }}.</span>
          <span class="text-muted">{{ $rt(step) }}</span>
        </li>
      </ol>
      <p class="mt-4 text-muted">{{ $t('intro.concept.conclusion') }}</p>
    </UCard>

    <UCard>
      <h2 class="text-2xl font-bold text-highlighted mb-4">{{ $t('intro.openSource.title') }}</h2>
      <p class="text-muted mb-4">{{ $t('intro.openSource.description') }}</p>
      <p class="text-muted mb-4">{{ $t('intro.openSource.contribute') }}</p>
      <div class="flex flex-col items-start gap-3">
        <a
          href="https://github.com/williamchong/should-i-take-taxi"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center text-primary hover:text-primary/80"
        >
          <UIcon name="i-simple-icons-github" class="w-5 h-5 mr-2" />
          {{ $t('intro.openSource.repository') }}
        </a>
        <a
          href="https://blog.williamchong.cloud?utm_source=shoulditake.taxi&utm_medium=referral&utm_campaign=author_link"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center text-primary hover:text-primary/80"
        >
          <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 mr-2" />
          {{ $t('intro.openSource.blog') }}
        </a>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Iconify names served on-demand by @nuxt/icon (local @iconify-json/heroicons).
const featureIcons = [
  'i-heroicons-calculator',
  'i-heroicons-map',
  'i-heroicons-clock',
  'i-heroicons-currency-dollar',
  'i-heroicons-arrows-right-left',
]
</script>
