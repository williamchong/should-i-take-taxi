<template>
  <div class="bg-white rounded-xl shadow-md p-6 mb-8">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold text-gray-900">{{ $t('taxiCalculator.title') }}</h2>
      <div class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 flex items-center">
        <span class="mr-1">🇭🇰</span>
        <span>{{ $t('taxiCalculator.regionHongKong') }}</span>
      </div>
    </div>

    <form>
      <div class="space-y-4">
        <!-- 的士類型選擇 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.taxiType') }}</label>
          <div class="flex space-x-4">
            <label class="inline-flex items-center">
              <input v-model="taxiType" type="radio" value="urban" class="form-radio text-red-600">
              <span class="ml-2 h-4 w-4 rounded-full bg-red-600" :title="$t('taxiCalculator.urban')" />
            </label>
            <label class="inline-flex items-center">
              <input v-model="taxiType" type="radio" value="newTerritories" class="form-radio text-green-600">
              <span class="ml-2 h-4 w-4 rounded-full bg-green-600" :title="$t('taxiCalculator.newTerritories')" />
            </label>
            <label class="inline-flex items-center">
              <input v-model="taxiType" type="radio" value="lantau" class="form-radio text-blue-600">
              <span class="ml-2 h-4 w-4 rounded-full bg-blue-600" :title="$t('taxiCalculator.lantau')" />
            </label>
          </div>
        </div>

        <!-- 距離 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <label for="distance" class="text-gray-700 font-medium">{{ $t('taxiCalculator.distance') }}</label>
          <div class="relative rounded-md shadow-sm">
            <input
              id="distance" v-model.number="distance" type="number" min="0" step="0.1"
              class="block w-full pl-3 pr-12 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-500 sm:text-sm">km</span>
            </div>
          </div>
        </div>

        <!-- 隧道費 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <label class="text-gray-700 font-medium pt-1">{{ $t('taxiCalculator.tunnelFee') }}</label>
          <div class="space-y-2">
            <div v-for="tunnel in tunnelOptions" :key="tunnel.id" class="flex items-center">
              <input
                :id="`tunnel-${tunnel.id}`" v-model="selectedTunnels" type="checkbox" :value="tunnel.id"
                class="form-checkbox text-blue-600">
              <label :for="`tunnel-${tunnel.id}`" class="ml-2 block text-sm text-gray-700">
                {{ tunnel.name }} (HK$ {{ tunnel.fee }})
              </label>
            </div>
          </div>
        </div>

        <div v-if="hasSelectedCrossHarbourTunnel" class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.crossHarbourTaxiStand') }}</label>
          <div>
            <label class="inline-flex items-center">
              <input v-model="isCrossHarbourTaxiStand" type="checkbox" class="form-checkbox text-blue-600">
              <span class="ml-2 text-sm text-gray-700">{{ $t('taxiCalculator.yes') }}</span>
            </label>
          </div>
        </div>

        <!-- 行李數量 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.luggage') }}</label>
          <div class="relative rounded-md shadow-sm">
            <input
              v-model.number="luggageCount" type="number" min="0" step="1"
              class="block w-full pl-3 pr-12 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-500 sm:text-sm">{{ $t('taxiCalculator.pieces') }}</span>
            </div>
          </div>
        </div>

      </div>
    </form>

    <!-- 計算結果 始終顯示 -->
    <div class="mt-6 p-4 bg-gray-50 rounded-md">
      <h3 class="text-lg font-medium text-gray-900">{{ $t('taxiCalculator.estimatedFare') }}</h3>
      <p class="text-2xl font-bold text-blue-600">HK$ {{ totalFare.toFixed(2) }}</p>

      <!-- 計算結果詳細內容 -->
      <div class="mt-3 text-sm text-gray-600">
        <div class="grid grid-cols-2 gap-2">
          <span>{{ getTaxiTypeLabel }} {{ $t('taxiCalculator.flagFall') }}:</span>
          <span class="text-right">HK$ {{ rates.flagFall.toFixed(2) }}</span>

          <template v-if="distanceFare > 0">
            <span>{{ $t('taxiCalculator.distanceFare') }}:</span>
            <span class="text-right">HK$ {{ distanceFare.toFixed(2) }}</span>
          </template>

          <template v-if="getTunnelFees > 0">
            <span>{{ $t('taxiCalculator.tunnelTotal') }}:</span>
            <span class="text-right">HK$ {{ getTunnelFees.toFixed(2) }}</span>
          </template>

          <template v-if="getLuggageFees > 0">
            <span>{{ $t('taxiCalculator.luggageTotal') }}:</span>
            <span class="text-right">HK$ {{ getLuggageFees.toFixed(2) }}</span>
          </template>

          <template v-if="getReturnTollFee > 0">
            <span>{{ $t('taxiCalculator.returnToll') }}:</span>
            <span class="text-right">HK$ {{ getReturnTollFee.toFixed(2) }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['update:fare'])

const { t } = useI18n()
const taxiType = ref<'urban' | 'newTerritories' | 'lantau'>('urban')
const distance = ref(0)
const selectedTunnels = ref([] as string[])
const isCrossHarbourTaxiStand = ref(false)
const luggageCount = ref(0)

// 獲取出租車類型標籤的計算屬性
const getTaxiTypeLabel = computed(() => {
  const typeMap: Record<'urban' | 'newTerritories' | 'lantau', string> = {
    'urban': t('taxiCalculator.urban'),
    'newTerritories': t('taxiCalculator.newTerritories'),
    'lantau': t('taxiCalculator.lantau')
  };
  return typeMap[taxiType.value]
})

// 獲取隧道費總額
const getTunnelFees = computed(() =>
  selectedTunnels.value.reduce((total, tunnelId) => {
    const tunnel = tunnelOptions.value.find(t => t.id === tunnelId);
    return total + (tunnel?.fee || 0);
  }, 0)
)

// 獲取行李費總額
const getLuggageFees = computed(() => Number(luggageCount.value) * rates.value.luggageFee)

// 檢查是否選擇了過海隧道
const hasSelectedCrossHarbourTunnel = computed(() => selectedTunnels.value.includes('crossHarbour'))

// 計算回程收費
const getReturnTollFee = computed(() =>
  (hasSelectedCrossHarbourTunnel.value && !isCrossHarbourTaxiStand.value) ? 25 : 0
)

const tunnelOptions = computed(() => [
  { id: 'crossHarbour', name: t('taxiCalculator.tunnels.crossHarbour'), fee: 25 },
  { id: 'tatesCairn', name: t('taxiCalculator.tunnels.tatesCairn'), fee: 20 },
  { id: 'taiLam', name: t('taxiCalculator.tunnels.taiLam'), fee: 58 },
  { id: 'lions', name: t('taxiCalculator.tunnels.lions'), fee: 8 },
  { id: 'shingMun', name: t('taxiCalculator.tunnels.shingMun'), fee: 5 },
  { id: 'aberdeen', name: t('taxiCalculator.tunnels.aberdeen'), fee: 5 },
  { id: 'shaTinHeights', name: t('taxiCalculator.tunnels.shaTinHeights'), fee: 8 },
])

const rates = computed(() => {
  const rateMap = {
    'urban': {
      flagFall: 29,
      firstTierDistance: 2,
      incrementalRate: 2.1,
      incrementalRateAfterThreshold: 1.4,
      thresholdAmount: 102.5,
      luggageFee: 6,
      additionalFee: 5,
    },
    'newTerritories': {
      flagFall: 25.5,
      firstTierDistance: 2,
      incrementalRate: 1.9,
      incrementalRateAfterThreshold: 1.4,
      thresholdAmount: 82.5,
      luggageFee: 6,
      additionalFee: 5,
    },
    'lantau': {
      flagFall: 24,
      firstTierDistance: 2,
      incrementalRate: 1.9,
      incrementalRateAfterThreshold: 1.6,
      thresholdAmount: 195,
      luggageFee: 6,
      additionalFee: 5,
    }
  };

  return rateMap[taxiType.value] || rateMap.urban;
})

// 使用 computed 計算距離費用
const distanceFare = computed(() => {
  // 如果距離為0或未填寫，不計算距離費用
  if (!distance.value || distance.value <= 0 || distance.value <= rates.value.firstTierDistance) {
    return 0;
  }

  const additionalDistance = distance.value - rates.value.firstTierDistance;
  const additionalSegments = Math.ceil(additionalDistance / 0.2);
  const { incrementalRate, incrementalRateAfterThreshold, thresholdAmount } = rates.value;
  const baseFare = rates.value.flagFall;

  const segmentsToThreshold = Math.floor((thresholdAmount - baseFare) / incrementalRate);

  return additionalSegments <= segmentsToThreshold
    ? additionalSegments * incrementalRate // 所有距離費用都在閾值之前
    : (segmentsToThreshold * incrementalRate) + // 閾值之前的部分
    ((additionalSegments - segmentsToThreshold) * incrementalRateAfterThreshold); // 閾值之後的部分
});

// 使用 computed 計算總費用
const totalFare = computed(() => {
  let fare = rates.value.flagFall + distanceFare.value;

  // 加入所有費用(隧道費、行李費、回程費)
  fare += getTunnelFees.value + getLuggageFees.value + getReturnTollFee.value;

  // 四捨五入至小數點後一位 (按運輸署規定)
  return Math.round(fare * 10) / 10;
})

// 監視 totalFare 的變化，自動更新事件成本
watch(totalFare, (newValue) => {
  if (newValue > 0) {
    emit('update:fare', newValue)
  }
}, { immediate: true })

</script>
