<template>
  <div class="p-4">
    <label class="block mb-4">
      {{ $t('label.eventCost') }}:
      <input v-model.number="eventCost" type="number" class="border rounded px-2 py-1" >
    </label>
    <label class="block mb-4">
      {{ $t('label.salaryPeriod') }}:
      <select v-model="salaryPeriod" class="border rounded px-2 py-1">
        <option value="annual">{{ $t('option.annual') }}</option>
        <option value="monthly">{{ $t('option.monthly') }}</option>
      </select>
    </label>
    <label class="block mb-4">
      {{ $t('label.salary') }}:
      <input v-model.number="salary" type="number" class="border rounded px-2 py-1" >
    </label>
    <div v-if="isComplete" class="text-2xl font-bold mt-5">
      {{ delayedResult }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      salary: null,
      salaryPeriod: 'monthly',
      eventCost: null,
      delayedResult: '',
      delayTimeout: null
    }
  },
  computed: {
    isComplete() {
      return this.salary != null && this.eventCost != null;
    }
  },
  watch: {
    salary: 'computeDelayed',
    eventCost: 'computeDelayed',
    salaryPeriod: 'computeDelayed'
  },
  beforeUnmount() {
    clearTimeout(this.delayTimeout);
  },
  methods: {
    computeDelayed() {
      if (!this.isComplete) {
        this.delayedResult = '';
        clearTimeout(this.delayTimeout);
        return;
      }
      clearTimeout(this.delayTimeout);
      this.delayTimeout = setTimeout(() => {
        const effectiveHourly = this.salaryPeriod === 'annual'
          ? this.salary / 2080
          : (this.salary * 12) / 2080;
        this.delayedResult = this.eventCost > effectiveHourly
          ? this.$t('result.justDoIt')
          : this.$t('result.notWorthIt');
      }, 1000); // 1秒延遲
    }
  }
}
</script>
