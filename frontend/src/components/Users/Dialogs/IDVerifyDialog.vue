<template>
  <CoreDialog v-model="dialog" max-width="700px" :persistent="true">
    <template #title>
      {{ $t("dialogs.compliance.idRequirement.title") }}
    </template>
    <v-card-text>
      {{ $t("dialogs.compliance.idRequirement.subtitle") }}
      <br />
      <v-icon>lock-fill</v-icon>
      <strong>
        &nbsp;{{ $t("dialogs.compliance.idRequirement.security") }}
      </strong>
    </v-card-text>
    <v-alert color="green" variant="tonal">
      {{ $t("dialogs.compliance.idRequirement.placeholder") }}
    </v-alert>
  </CoreDialog>
</template>

<script lang="ts" setup>
import CoreDialog from "@/components/Core/Dialogs/Dialog.vue";

const dialog = defineModel();
</script>
