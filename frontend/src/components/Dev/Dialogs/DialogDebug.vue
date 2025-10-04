<template>
  <v-container>
    <tpu-btn
      v-for="dialog in Object.keys($app.dialogs).filter(
        (key) => typeof $app.dialogs[key] === 'boolean'
      )"
      :key="dialog"
      @click="$app.dialogs[dialog] = !$app.dialogs[dialog]"
    >
      {{ dialog }}
    </tpu-btn>

    <tpu-btn
      v-for="dialog in Object.keys($app.dialogs).filter(
        (key) => typeof $app.dialogs[key] === 'object'
      )"
      :key="dialog"
      @click="$app.dialogs[dialog].value = !$app.dialogs[dialog].value"
    >
      {{ dialog }}
    </tpu-btn>
    <tpu-btn
      v-for="dialog in Object.keys($chat.dialogs).filter(
        (key) => typeof $chat.dialogs[key] === 'object'
      )"
      :key="dialog"
      @click="$chat.dialogs[dialog].value = !$chat.dialogs[dialog].value"
    >
      {{ dialog }}
    </tpu-btn>
    <tpu-btn
      v-for="dialog in Object.keys($user.dialogs).filter(
        (key) => typeof $user.dialogs[key] === 'object'
      )"
      :key="dialog"
      @click="$user.dialogs[dialog].value = !$user.dialogs[dialog].value"
    >
      {{ dialog }}
    </tpu-btn>
  </v-container>
</template>

<script setup lang="ts"></script>

<style scoped></style>
