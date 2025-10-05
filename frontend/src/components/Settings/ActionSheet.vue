<template>
  <v-sheet class="rounded-xxl mt-3" outlined>
    <v-card
      class="rounded-xxl w-full h-full flex justify-center align-center"
      color="white"
      elevation="0"
      height="50"
      max-width="100%"
      variant="outlined"
      v-bind="$attrs"
    >
      <v-icon size="30" class="mr-2">{{ props.icon }}</v-icon>
      {{ props.label }}
    </v-card>
  </v-sheet>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string | null | undefined;
  icon: string;
}>();

defineOptions({
  inheritAttrs: false
});
</script>

<style scoped></style>
