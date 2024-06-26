<template>
  <v-autocomplete
    v-model="selected"
    :items="users"
    item-title="username"
    item-value="id"
    label="User"
  />
  <v-card
    v-for="experiment in relevantExperiments"
    :key="experiment.name"
    class="my-2"
  >
    <v-card-title>{{ experiment.name }}</v-card-title>
    <v-card-subtitle style="white-space: pre-line">
      {{ experiment.meta?.description }}
    </v-card-subtitle>
    <v-card-subtitle>
      {{ $date(experiment.meta?.createdAt).format("YYYY-MM-DD") }}
    </v-card-subtitle>
    <v-card-text v-if="experiment.type === 'boolean'">
      <v-radio-group v-model="$experiments.experiments[experiment.name]">
        <v-radio :value="experiment.inheritValue" label="Inherit" />
        <v-radio :value="true" label="Enabled" />
        <v-radio :value="false" label="Disabled" />
      </v-radio-group>
    </v-card-text>
    <v-card-text v-else-if="experiment.type === 'number'">
      <v-text-field
        :model-value="$experiments.experiments[experiment.name]"
        type="number"
        @update:model-value="
          $experiments.setExperiment(experiment.name, parseInt($event || '0'))
        "
      />
    </v-card-text>
  </v-card>
</template>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ExperimentsManager",
  props: ["username"],
  data() {
    return {
      retain: false,
      selected: 0,
      experiments: [] as Record<string, any>[],
      users: [
        {
          id: 0,
          username: "LocalState"
        }
      ]
    };
  },
  computed: {
    relevantExperiments() {
      const experiments = this.experiments.length
        ? this.experiments
        : this.$experiments.experiments;
      return Object.entries(experiments)
        .map(([name, value]) => ({
          name,
          value,
          //@ts-ignore
          inheritValue: this.$experiments.experimentsInherit[name],
          type: typeof value,
          //@ts-ignore
          meta: this.$experiments?.experimentsInherit?.meta?.[name] as {
            description: string;
            createdAt: string;
          }
        }))
        .filter((experiment) => experiment.name !== "meta")
        .sort((a, b) => {
          const metaA = this.$experiments.experimentsInherit?.meta?.[a.name];
          const metaB = this.$experiments.experimentsInherit?.meta?.[b.name];
          if (!metaA || !metaB) return 0;
          if (metaA.createdAt < metaB.createdAt) return 1;
          if (metaA.createdAt > metaB.createdAt) return -1;
          return 0;
        });
    }
  },
  watch: {
    async selected() {
      this.experiments = await this.$admin.getExperimentValues(this.selected);
    }
  },
  async mounted() {
    this.users.push(...(await this.$admin.getUsers()));
  }
});
</script>
