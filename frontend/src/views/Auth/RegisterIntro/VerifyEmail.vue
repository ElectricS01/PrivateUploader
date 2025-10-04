<template>
  <div>
    <v-card-title
      class="text-[6vw] md:text-[2.5vw] font-bold text-wrap w-full px-4 font-weight-medium text-center"
    >
      Verify your email.
    </v-card-title>
    <v-card-subtitle class="text-wrap">
      Check {{ userStore.user.email }} for a verification email.
      <br />
      If you don't see it, check your spam folder.
    </v-card-subtitle>
    <v-card-actions>
      <v-spacer />
      <tpu-btn color="red" @click="userStore.logout()">Logout</tpu-btn>
      <tpu-btn color="primary" @click="userStore.resendVerificationEmail()">
        Resend Verification Email
      </tpu-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useUserStore } from "@/store/user.store";

const emit = defineEmits(["next"]);

const userStore = useUserStore();

onMounted(() => {
  if (userStore.user.emailVerified) {
    emit("next");
  }
});

watch(
  () => userStore.user.emailVerified,
  (value) => {
    if (value) {
      emit("next");
    }
  }
);
</script>

<style scoped></style>
