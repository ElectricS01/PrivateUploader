import { computed, ref } from "vue";
import { useExperimentsStore } from "@/store/experiments.store";

export function useShimmer() {
  const shimmerX = ref(50);
  const shimmerY = ref(50);
  const isHovered = ref(false);

  const experimentsStore = useExperimentsStore();
  const eligibleForShimmer = computed(() => {
    return (
      experimentsStore.experiments.INTERACTIVE_BUTTONS &&
      !experimentsStore.experiments.DISABLE_ANIMATIONS
    );
  });

  function handleMouseMove(event: MouseEvent) {
    if (!eligibleForShimmer.value) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    shimmerX.value = ((event.clientX - rect.left) / rect.width) * 100;
    shimmerY.value = ((event.clientY - rect.top) / rect.height) * 100;
  }

  function handleMouseEnter() {
    if (!eligibleForShimmer.value) return;
    isHovered.value = true;
  }

  function handleMouseLeave() {
    if (!eligibleForShimmer.value) return;
    isHovered.value = false;
  }

  return {
    shimmerX,
    shimmerY,
    isHovered,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    eligibleForShimmer
  };
}
