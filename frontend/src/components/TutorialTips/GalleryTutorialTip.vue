<template>
  <v-tooltip
    activator="parent"
    location="right"
    content-class="social-hub-tip"
    max-width="500"
    :close-on-back="false"
    :close-on-content-click="false"
    :no-click-animation="true"
  >
    <v-card color="default" density="compact" style="pointer-events: all">
      <template #title>This is the home to your files.</template>
      <template #text>
        <p>Upload anything to your Personal Files, private to all.</p>
        <strong>Click the "My Files" item to get started!</strong>
        <small
          class="float-right cursor-pointer pa-4"
          @click="
            experimentsStore.setExperiment(
              'REGISTER_INTRO',
              SkipRegisterStepStage.GALLERY_INTRO
            )
          "
        >
          Skip tutorial
        </small>
      </template>
    </v-card>
  </v-tooltip>
</template>

<script setup lang="ts">
import { useAppStore } from "@/store/app.store";
import { useExperimentsStore } from "@/store/experiments.store";
import { SkipRegisterStepStage } from "@/views/Auth/registerSteps";

const appStore = useAppStore();
const experimentsStore = useExperimentsStore();
</script>

<style>
.social-hub-tip {
  background: transparent !important;
  border: none !important;
}
</style>
