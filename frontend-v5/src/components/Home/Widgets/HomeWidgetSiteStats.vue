<template>
  <card outlined padding>
    <template #header>{{ t("home.widgets.statistics.title") }}</template>
    <div
      v-if="appStore.state?.stats"
      class="grid 2xl:grid-cols-4 sm:grid-cols-3 gap-4 mt-4"
    >
      <card :secondary="false" class="text-center" padding>
        <template #header>{{ t("home.widgets.statistics.categories.uploads") }}</template>
        <p class="mt-2 text-4xl">
          {{ appStore.state.stats.uploads.toLocaleString() }}
        </p>
      </card>
      <card :secondary="false" class="text-center" padding>
        <template #header>{{ t("home.widgets.statistics.categories.users") }}</template>
        <p class="mt-2 text-4xl">
          {{ appStore.state.stats.users.toLocaleString() }}
        </p>
      </card>
      <card :secondary="false" class="text-center" padding>
        <template #header>{{ t("home.widgets.statistics.categories.messages") }}</template>
        <p class="mt-2 text-4xl">
          {{ appStore.state.stats.messages.toLocaleString() }}
        </p>
      </card>
      <card :secondary="false" class="text-center" padding>
        <template #header>{{ t("home.widgets.statistics.categories.timeSpent") }}</template>
        <p class="mt-2 text-4xl">
          {{ appStore.state.stats.pulse.toLocaleString() }}h
        </p>
      </card>
    </div>
  </card>
</template>

<script setup lang="ts">
import Card from "@/components/Framework/Card/Card.vue";
import { useAppStore } from "@/stores/app.store";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const appStore = useAppStore();
</script>

<style scoped></style>
