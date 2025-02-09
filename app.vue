<template>
  <div class="p-4">
    <table class="table-auto w-full max-w-lg mx-auto border-collapse border border-gray-300">
      <caption class="text-2xl font-bold mb-4">Should I Spend Time on This?</caption>
      <tbody>
        <tr>
          <td class="border px-4 py-2">{{ $t('label.eventValue') }}</td>
          <td class="border px-4 py-2">
            <div class="flex items-center">
              <span>$</span>
              <input
                v-model.number="eventValue"
                type="number"
                placeholder="Enter value in $"
                class="border rounded px-2 py-1 w-full">
            </div>
          </td>
        </tr>
        <tr>
          <td class="border px-4 py-2">{{ $t('label.eventDuration') }}</td>
          <td class="border px-4 py-2">
            <div class="flex items-center">
              <input
                v-model.number="eventDuration"
                type="number"
                placeholder="Enter duration in minutes"
                class="border rounded px-2 py-1 w-full">
              <span class="ml-2">{{ $t('minutes') }}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="border px-4 py-2">{{ $t('label.salaryPeriod') }}</td>
          <td class="border px-4 py-2">
            <label class="inline-flex items-center mr-4">
              <input v-model="salaryPeriod" type="radio" value="annual" class="form-radio">
              <span class="ml-2">{{ $t('option.annual') }}</span>
            </label>
            <label class="inline-flex items-center">
              <input v-model="salaryPeriod" type="radio" value="monthly" class="form-radio">
              <span class="ml-2">{{ $t('option.monthly') }}</span>
            </label>
          </td>
        </tr>
        <tr>
          <td class="border px-4 py-2">{{ $t('label.salary') }}</td>
          <td class="border px-4 py-2">
            <div class="flex items-center">
              <span>$</span>
              <input
                v-model.number="salary"
                type="number"
                placeholder="Enter salary"
                class="border rounded px-2 py-1 w-full">
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-5 text-center">
      <span v-if="loading" class="text-xl font-medium text-gray-500">{{ $t('loading.calculating') }}</span>
      <span v-else-if="isComplete" class="text-2xl font-bold">{{ delayedResult }}</span>
      <span v-else class="text-xl font-medium text-gray-500">{{ $t('error.inputAllValues') }}</span>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      salary: null,
      salaryPeriod: 'monthly',
      eventValue: 50,
      eventDuration: 15,
      delayedResult: '',
      delayTimeout: null,
      loading: false
    }
  },
  computed: {
    isComplete() {
      return this.salary != null && this.eventValue != null && this.eventDuration != null;
    }
  },
  watch: {
    salary: 'computeDelayed',
    eventValue: 'computeDelayed',
    eventDuration: 'computeDelayed',
    salaryPeriod: 'computeDelayed'
  },
  beforeUnmount() {
    clearTimeout(this.delayTimeout);
  },
  methods: {
    computeDelayed() {
      if (!this.isComplete) {
        this.delayedResult = '';
        this.loading = false;
        clearTimeout(this.delayTimeout);
        return;
      }
      this.loading = true;
      clearTimeout(this.delayTimeout);
      this.delayTimeout = setTimeout(() => {
        const effectiveHourly = this.salaryPeriod === 'annual'
          ? this.salary / 2080
          : (this.salary * 12) / 2080;
        const eventHourly = this.eventValue / (this.eventDuration / 60);
        this.delayedResult = eventHourly > effectiveHourly
          ? this.$t('result.justDoIt')
          : this.$t('result.notWorthIt');
        this.loading = false;
      }, 1000);
    }
  }
}
</script>
