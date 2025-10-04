<script setup lang="ts">
import { useShimmer } from "@/plugins/composables/useShimmer";
import { useExperimentsStore } from "@/store/experiments.store";

const props = defineProps({
  selected: Boolean,
  highlighted: Boolean,
  badge: [Number, String],
  disabled: Boolean
});

const {
  eligibleForShimmer,
  shimmerX,
  shimmerY,
  isHovered,
  handleMouseMove,
  handleMouseEnter,
  handleMouseLeave
} = useShimmer();

const experimentsStore = useExperimentsStore();
</script>

<template>
  <div
    v-ripple
    class="shimmer-parent rounded-full hover:bg-outline-light cursor-pointer p-2 relative flex items-center justify-center super-bar-item"
    :class="{
      'bg-outline-light dark:bg-outline-dark':
        props.selected || props.highlighted,
      'cursor-not-allowed opacity-50': props.disabled,
      'dark:hover:bg-outline-amoled': !props.selected && !props.highlighted,
      'transition-transform duration-150 ease-out active:scale-[91%] origin-center':
        experimentsStore.experiments.INTERACTIVE_BUTTONS &&
        !experimentsStore.experiments.DISABLE_ANIMATIONS
    }"
    style="width: 40px; height: 40px"
    tabindex="0"
    @keydown.enter="
      //@ts-ignore
      props.disabled ? () => {} : $event.target?.click()
    "
    @keydown.space="
      props.disabled
        ? () => {}
        : () => {
            $event.preventDefault();
            //@ts-ignore
            $event.target?.click();
          }
    "
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      v-if="eligibleForShimmer"
      class="shimmer-effect"
      :class="{ active: isHovered }"
      :style="{
        '--shimmer-x': shimmerX + '%',
        '--shimmer-y': shimmerY + '%',
        '--shimmer-strength': '10%'
      }"
    ></div>
    <div class="blue-line bg-blue" :class="{ active: props.selected }"></div>
    <slot name="badge"></slot>
    <v-chip
      class="absolute text-black z-20 bottom-0 right-0 text-center flex justify-center"
      v-if="props.badge && !$slots.badge"
      color="red"
      variant="flat"
      size="x-small"
    >
      {{ props.badge }}
    </v-chip>
    <slot />
  </div>
</template>
