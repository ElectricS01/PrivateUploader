<template>
  <v-container>
    <overline>UI Options</overline>
    <tpu-btn
      :color="$experiments.experiments.PROGRESSIVE_UI ? 'red' : 'blue'"
      variant="tonal"
      @click="
        $experiments.setExperiment(
          'PROGRESSIVE_UI',
          $experiments.experiments.PROGRESSIVE_UI ? 0 : 1
        )
      "
    >
      {{ $experiments.experiments.PROGRESSIVE_UI ? "Disable" : "Enable" }}
      New UI (v5in4)
    </tpu-btn>
    <tpu-btn
      @click="
        $experiments.setExperiment(
          'DISABLE_ANIMATIONS',
          $experiments.experiments.DISABLE_ANIMATIONS ? 0 : 1
        )
      "
    >
      {{ $experiments.experiments.DISABLE_ANIMATIONS ? "Enable" : "Disable" }}
      Animations (New UI)
    </tpu-btn>
  </v-container>
</template>
<script setup lang="ts">
import Overline from "@/components/Core/Typography/Overline.vue";
</script>
