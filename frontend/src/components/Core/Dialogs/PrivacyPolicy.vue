<template>
  <CoreDialog max-width="900px" :model-value="true" :eager="true">
    <template #title>
      {{ $t("core.privacy.title") }}
    </template>
    <p class="mx-4">
      {{ $t("core.privacy.desc") }}
    </p>
    <v-divider />
    <PrivacyPolicy class="mx-4 mt-n11 mb-n16" />
    <tpu-btn style="z-index: 9999" @click="acceptPrivacyPolicy()">
      {{ $t("core.privacy.close") }}
    </tpu-btn>
  </CoreDialog>
</template>

<script lang="ts" setup>
import { defineComponent } from "vue";
import CoreDialog from "@/components/Core/Dialogs/Dialog.vue";
import PrivacyPolicy from "@/views/Policies/Privacy.vue";
import { useUserStore } from "@/store/user.store";

const userStore = useUserStore();

async function acceptPrivacyPolicy() {
  userStore.user.privacyPolicyAccepted = true;
  await userStore.save();
  // ensure the websocket and data is fetched correctly.
  location.reload();
}
</script>
