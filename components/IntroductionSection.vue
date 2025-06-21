<template>
  <section class="space-y-8">
    <div class="bg-white rounded-xl shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.title') }}</h2>
      <p class="text-gray-600">
        <i18n-t keypath="intro.description" scope="global">
          <template #taxiCalculator>
            <a
              href="https://shouldispendtimeon.work/"
              target="_blank"
              rel="noopener"
              class="text-blue-600 hover:text-blue-800"
            >{{ $t('intro.taxiCalculator') }}</a>
          </template>
        </i18n-t>
      </p>
    </div>

    <div class="bg-white rounded-xl shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.features.title') }}</h2>
      <div class="space-y-4">
        <div v-for="(feature, index) in $tm('intro.features.list') as any[]" :key="index" class="flex items-start">
          <span class="flex-shrink-0 p-1 bg-blue-100 rounded-lg mr-3">
            <component :is="featureIcons[index]" class="w-5 h-5 text-blue-600" />
          </span>
          <div>
            <h3 class="font-medium text-gray-900">{{ $rt(feature.title) }}</h3>
            <p class="text-gray-600">{{ $rt(feature.description) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.concept.title') }}</h2>
      <p class="text-gray-600 mb-4">{{ $t('intro.concept.description') }}</p>
      <ul class="space-y-2">
        <li
            v-for="(benefit, index) in $tm('intro.concept.benefits')" :key="index"
            class="flex items-start">
          <span class="text-blue-500 mr-2">•</span>
          <span class="text-gray-600">{{ $rt(benefit) }}</span>
        </li>
      </ul>
    </div>

    <div class="bg-white rounded-xl shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.usage.title') }}</h2>
      <ol class="space-y-2">
        <li
          v-for="(step, index) in $tm('intro.usage.steps')" :key="index"
            class="flex">
          <span class="font-bold text-blue-500 mr-2">{{ index + 1 }}.</span>
          <span class="text-gray-600">{{ $rt(step) }}</span>
        </li>
      </ol>
      <p class="mt-4 text-gray-600">{{ $t('intro.concept.conclusion') }}</p>
    </div>

    <div class="bg-white rounded-xl shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.openSource.title') }}</h2>
      <p class="text-gray-600 mb-4">{{ $t('intro.openSource.description') }}</p>
      <p class="text-gray-600 mb-4">{{ $t('intro.openSource.contribute') }}</p>
      <a
        href="https://github.com/williamchong/should-i-take-taxi"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
        {{ $t('intro.openSource.repository') }}
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  CalculatorIcon,
  MapIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/vue/24/outline'

const featureIcons = [
  CalculatorIcon,
  MapIcon,
  ClockIcon,
  CurrencyDollarIcon
]


</script>
