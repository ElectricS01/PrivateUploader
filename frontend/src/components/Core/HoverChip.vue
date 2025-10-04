<template>
  <v-chip
    :aria-label="ariaLabel || text"
    :color="color"
    :disabled="disabled"
    :href="href"
    :size="sizeComputed"
    :to="to"
    class="shimmer-parent mr-2 overflow-hidden"
    :class="{
      'chip-never-active transition-transform duration-150 ease-out active:scale-95 origin-center':
        $experiments.experiments.INTERACTIVE_BUTTONS &&
        !$experiments.experiments.DISABLE_ANIMATIONS
    }"
    style="cursor: pointer"
    @click="() => {}"
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
        '--shimmer-strength': '5%'
      }"
    ></div>
    <template v-if="typeof icon === 'string'">
      <v-icon
        v-if="!shortText && icon"
        :size="icon.includes('numeric') ? 20 : undefined"
      >
        {{ icon }}
      </v-icon>
    </template>
    <template v-else>
      <component v-if="!shortText && icon" :is="icon" size="20" />
    </template>
    <v-img v-if="image" :height="18" :src="image" :width="18" />
    <span v-else class="unselectable">{{ shortText }}</span>
    <v-tooltip
      v-if="text"
      :eager="false"
      activator="parent"
      location="top"
      style="z-index: 5001"
    >
      {{ text }}
    </v-tooltip>
    <span v-if="old" class="ml-1">{{ text }}</span>
    <slot />
  </v-chip>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useShimmer } from "@/plugins/composables/useShimmer";

export default defineComponent({
  name: "HoverChip",
  props: [
    "text",
    "action",
    "icon",
    "color",
    "to",
    "href",
    "small",
    "xSmall",
    "xLarge",
    "large",
    "shortText",
    "textColor",
    "disabled",
    "click",
    "size",
    "old",
    "image",
    "ariaLabel",
    "disabledText"
  ],
  setup() {
    const {
      eligibleForShimmer,
      shimmerX,
      shimmerY,
      isHovered,
      handleMouseMove,
      handleMouseEnter,
      handleMouseLeave
    } = useShimmer();

    return {
      eligibleForShimmer,
      shimmerX,
      shimmerY,
      isHovered,
      handleMouseMove,
      handleMouseEnter,
      handleMouseLeave
    };
  },
  computed: {
    contrast() {
      return "white";
    },
    // if other components still use the old Vuetify props
    sizeComputed() {
      if (this.small) return "small";
      if (this.xSmall) return "x-small";
      if (this.xLarge) return "x-large";
      if (this.large) return "large";
      return this.size;
    }
  }
});
</script>
