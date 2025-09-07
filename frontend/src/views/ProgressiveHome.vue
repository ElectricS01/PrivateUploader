<template>
  <v-container v-if="userStore.user">
    <p class="text-2xl font-bold mb-6">
      Welcome back, {{ userStore.user.username }}
    </p>
    <p class="text-lg font-semibold mb-2">Quick Access</p>

    <!-- Button Row -->
    <div class="flex gap-6">
      <div
        v-for="(item, index) in quickAccess"
        :key="index"
        class="flex flex-col items-center justify-space-between w-full"
      >
        <!-- Bubble Button -->
        <v-btn height="100" color="toolbar" block variant="flat">
          <div class="flex flex-col items-center space-y-1">
            <v-icon :icon="item.icon" size="28" />
            <span>{{ item.title }}</span>
          </div>
        </v-btn>
      </div>
    </div>

    <v-row>
      <v-col />
      <v-col cols="3">
        <div class="pa-2">
          <v-progress-linear
            :color="functions.calculateColorQuota(calculateQuota)"
            :model-value="calculateQuota"
            height="25"
            rounded
            :class="{
              'text-white':
                functions.calculateColorQuota(calculateQuota) === '#256928',
              'text-black':
                functions.calculateColorQuota(calculateQuota) !== '#256928'
            }"
          >
            {{ Math.ceil(calculateQuota) }}% ({{
              $functions.fileSize($user.user?.quota || 0)
            }}/{{ $functions.fileSize($user.user?.plan.quotaMax || 0) }})
          </v-progress-linear>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, h } from "vue";
import { useUserStore } from "@/store/user.store";
import { RiFileFill } from "@remixicon/vue";
import functions from "../plugins/functions";

const userStore = useUserStore();

const calculateQuota = computed(() => {
  if (!userStore.user) return 0;
  return Math.round(
    (userStore.user?.quota / userStore.user?.plan?.quotaMax) * 100
  );
});

const quickAccess = computed(() => [
  {
    title: "My Files",
    icon: h(RiFileFill, { size: "28" })
  },
  {
    title: "Starred",
    icon: "mdi-star"
  },
  {
    title: "Collections",
    icon: "mdi-folder-star",
    subtitle: "4 Recent"
  },
  {
    title: "Chats",
    icon: "mdi-message-text",
    subtitle: "2 Unread"
  },
  {
    title: "Upload",
    icon: "mdi-plus-box"
  }
]);
</script>
