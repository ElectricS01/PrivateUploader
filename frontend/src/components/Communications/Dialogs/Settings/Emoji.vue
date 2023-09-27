<template>
  <UploadCropper
    v-model="upload"
    @finish="uploadIcon"
    type="chatIcon"
    :supports-removal="false"
  />
  <overline position="center">
    {{ $t("chats.settings.emoji.name") }} ({{ emojis.length }}/30)
  </overline>
  <div>
    <v-card-subtitle class="initial" style="max-width: 600px">
      {{ $t("chats.settings.emoji.description") }}
    </v-card-subtitle>
    <v-btn @click="upload = true" class="my-1 ml-2">
      {{ $t("chats.settings.emoji.add") }}
    </v-btn>
    <v-list v-for="emoji in emojis" :key="emoji.id" max-width="600">
      <v-list-item>
        <template v-slot:prepend>
          <v-img
            width="40"
            :src="$app.domain + emoji.icon"
            class="mr-4"
          ></v-img>
        </template>
        <template v-slot:append>
          <v-btn icon @click="deleteEmoji(emoji.id)" size="small">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
        <v-list-item-title
          @click="
            editing = emoji.id;
            oldName = emoji.name;
          "
          class="pointer"
          v-if="editing !== emoji.id"
        >
          {{ emoji.name }}
        </v-list-item-title>
        <v-text-field
          @keydown.esc.prevent.stop="
            editing = '';
            emoji.name = oldName;
          "
          style="max-width: 200px"
          label="Emoji name"
          v-else
          @blur="
            editing = '';
            emoji.name = oldName;
          "
          @keydown.enter="updateEmoji(emoji.id, emoji.name)"
          maxlength="24"
          autofocus
          v-model="emoji.name"
        />
        <template v-slot:subtitle>
          <div>
            {{ $t("chats.settings.emoji.uploadedBy") }}
            <UserAvatar size="18" :user="$user.users[emoji.userId]" />
            {{ $user.users[emoji.userId]?.username }}
          </div>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Overline from "@/components/Core/Typography/Overline.vue";
import UploadCropper from "@/components/Core/Dialogs/UploadCropper.vue";
import UserAvatar from "@/components/Users/UserAvatar.vue";
import { UpdateEmojiMutation } from "@/graphql/chats/updateEmoji.graphql";
import { DeleteEmojiMutation } from "@/graphql/chats/deleteEmoji.graphql";

export default defineComponent({
  name: "ChatSettingsEmoji",
  components: { UserAvatar, UploadCropper, Overline },
  data() {
    return {
      upload: false,
      editing: "",
      oldName: ""
    };
  },
  computed: {
    emojis() {
      return this.$chat.emoji.filter(
        (emoji) => emoji.chatId === this.$chat.editingChat.id
      );
    }
  },
  methods: {
    async deleteEmoji(id: string) {
      await this.$apollo.mutate({
        mutation: DeleteEmojiMutation,
        variables: {
          input: {
            associationId: this.$chat.editingChat.association.id,
            id
          }
        }
      });
    },
    async updateEmoji(id: string, name: string) {
      const emoji = this.$chat.emoji.find((emoji) => emoji.id === this.editing);
      this.editing = "";
      try {
        await this.$apollo.mutate({
          mutation: UpdateEmojiMutation,
          variables: {
            input: {
              associationId: this.$chat.editingChat.association.id,
              name,
              id
            }
          }
        });
        this.oldName = "";
      } catch {
        emoji.name = this.oldName;
      }
    },
    async uploadIcon(file: File) {
      if (this.$chat.editingChat) {
        const formData = new FormData();
        formData.append("icon", file);
        await this.axios.post(
          `/chats/${this.$chat.editingChat.association.id}/icon?type=emoji`,
          formData
        );
        this.upload = false;
      }
    }
  }
});
</script>

<style scoped></style>