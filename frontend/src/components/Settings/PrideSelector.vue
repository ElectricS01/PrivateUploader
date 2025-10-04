<template>
  <v-select
    v-model="$experiments.experiments.PRIDE"
    :label="$t('settings.home.preferences.pride')"
    item-title="title"
    item-value="key"
    :items="prideVariants"
    @update:model-value="$experiments.setExperiment('PRIDE', $event as number)"
  >
    <template #label>
      {{ $t("settings.home.preferences.pride") }}
      <v-chip
        :class="theme.current.value.dark ? 'text-white' : 'text-black'"
        size="x-small"
        variant="tonal"
        style="
          background: linear-gradient(
            to bottom right,
            #f293ab60,
            #f293ab60,
            #88a4f560,
            #88a4f560
          );
          color: white;
        "
      >
        {{ $t("generic.new") }}
      </v-chip>
    </template>
  </v-select>
</template>

<script lang="ts" setup>
import { PrideVariant } from "@/types/pride";
import { isNumeric } from "@/plugins/isNumeric";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
const { t } = useI18n();

const prideVariants = computed(() => {
  const result = [];
  for (const variant of Object.keys(PrideVariant)) {
    if (isNumeric(variant))
      result.push({
        title: t(`settings.home.preferences.prideVariants.${variant}`),
        key: Number(variant)
      });
  }
  return result;
});

const theme = useTheme();
</script>

<style scoped></style>
