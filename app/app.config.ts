export default defineAppConfig({
  ui: {
    colors: {
      // The app's accent has always been blue; map Nuxt UI's primary token to it
      // so existing blue chrome (links, focus rings, fare figures) carries over.
      primary: 'blue',
      // `gray-*` is used throughout the codebase; `slate` is the closest neutral.
      neutral: 'slate',
    },
    // Nuxt UI's built-in icons default to Lucide. We only ship the Heroicons
    // collection, so remap the aliases its components use internally (loading
    // spinners, checkmarks, chevrons, close buttons) to Heroicons equivalents.
    icons: {
      loading: 'i-heroicons-arrow-path',
      close: 'i-heroicons-x-mark',
      check: 'i-heroicons-check',
      minus: 'i-heroicons-minus',
      plus: 'i-heroicons-plus',
      search: 'i-heroicons-magnifying-glass',
      external: 'i-heroicons-arrow-top-right-on-square',
      chevronDown: 'i-heroicons-chevron-down',
      chevronUp: 'i-heroicons-chevron-up',
      chevronLeft: 'i-heroicons-chevron-left',
      chevronRight: 'i-heroicons-chevron-right',
      chevronDoubleLeft: 'i-heroicons-chevron-double-left',
      chevronDoubleRight: 'i-heroicons-chevron-double-right',
      arrowLeft: 'i-heroicons-arrow-left',
      arrowRight: 'i-heroicons-arrow-right',
      ellipsis: 'i-heroicons-ellipsis-horizontal',
    },
  },
})
