<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600px"
  >
    <v-card elevation="7" class="rounded-xl">
      <v-card-title class="headline">Add API Key</v-card-title>
      <v-card-text v-if="!key">
        <v-text-field
          v-model="name"
          label="Name"
          required
          @keydown.enter="addAPIKey"
          autofocus
        ></v-text-field>
        <v-text-field
          v-model="expiry"
          label="Expiry"
          readonly
          disabled
        ></v-text-field>
        <v-select
          label="Select"
          :items="availableScopes"
          v-model="scopes"
          item-title="name"
          item-value="id"
          multiple
        ></v-select>
      </v-card-text>
      <v-card-text v-else>
        <v-text-field
          v-model="key"
          label="Key"
          disabled
          readonly
        ></v-text-field>
        <p>
          Use this key with any TPU integrations. This is a secret, do not share
          it with anyone.
        </p>
      </v-card-text>
      <v-card-actions v-if="!key">
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="$emit('update:modelValue', false)"
          >Cancel</v-btn
        >
        <v-btn color="primary" text @click="addAPIKey">Add</v-btn>
      </v-card-actions>
      <v-card-actions v-else>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="$emit('update:modelValue', false)"
          >Close</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CreateAPIKey",
  props: ["modelValue"],
  emits: ["update:modelValue", "create"],
  data() {
    return {
      availableScopes: [
        {
          name: "Uploads (Modify)",
          id: "uploads.modify"
        },
        {
          name: "Upload (Create)",
          id: "uploads.create"
        },
        {
          name: "Uploads (View)",
          id: "uploads.view"
        },
        {
          name: "View UserInfo",
          id: "user.view"
        },
        {
          name: "User (Modify)",
          id: "user.modify"
        },
        {
          name: "Collections (Modify)",
          id: "collections.modify"
        },
        {
          name: "Collections (Create)",
          id: "collections.create"
        },
        {
          name: "Collections (View)",
          id: "collections.view"
        },
        {
          name: "Workspaces (Modify)",
          id: "workspaces.modify"
        },
        {
          name: "Workspaces (Create)",
          id: "workspaces.create"
        },
        {
          name: "Workspaces (View)",
          id: "workspaces.view"
        }
      ],
      name: "",
      key: "",
      expiry: "",
      scopes: ["uploads.create", "user.view"]
    };
  },
  methods: {
    async addAPIKey() {
      const { data } = await this.axios.post("/security/keys", {
        name: this.name,
        scopes: this.scopes,
        expiry: this.expiry
      });
      this.key = data.token;
      this.$emit("create", data);
    }
  },
  watch: {
    modelValue() {
      this.key = "";
      this.name = "";
      this.expiry = "";
      this.scopes = ["uploads.create", "user.view"];
    }
  }
});
</script>

<style scoped></style>