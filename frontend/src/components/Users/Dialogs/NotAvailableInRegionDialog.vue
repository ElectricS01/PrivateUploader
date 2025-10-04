<template>
  <CoreDialog v-model="value" :persistent="true" fullscreen>
    <template #title>
      <div class="absolute w-full"></div>
    </template>
    <div class="d-flex h-full w-full justify-center align-center flex-col">
      <FlowinityBanner style="width: 256px; height: auto" class="mb-2" />
      <v-card color="" elevation="0">
        <v-card-title class="text-center">
          {{ t("dialogs.compliance.unavailableInRegion.title") }}
        </v-card-title>
        <v-card-subtitle class="my-3 text-center whitespace-pre-wrap">
          {{ t("dialogs.compliance.unavailableInRegion.subtitle") }}
        </v-card-subtitle>
      </v-card>
    </div>
  </CoreDialog>
</template>

<script setup lang="ts">
import CoreDialog from "@/components/Core/Dialogs/Dialog.vue";
import FlowinityBanner from "@/components/Brand/FlowinityBanner.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const value = defineModel();
</script>

<style scoped></style>
