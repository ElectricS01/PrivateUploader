<template>
  <div
    v-if="!$vuetify.display.mobile"
    :class="{ 'no-hide': avoid }"
    class="message-actions mr-2 rounded-xl v-card glass"
    style="z-index: 5001; background-color: rgb(var(--v-theme-dark))"
  >
    <template v-if="!message.pending && !message.error">
      <button
        v-if="
          $chat.hasPermission('PIN_MESSAGES') &&
          message.type === MessageType.Message
        "
        type="button"
        class="v-btn v-btn--icon v-theme--amoled v-btn--density-default rounded-0 v-btn--size-small v-btn--variant-text"
        @click="$chat.pinMessage(message.id, !message.pinned)"
      >
        <v-tooltip activator="parent" location="top" :eager="false">
          {{ message.pinned ? "Unpin" : "Pin" }}
        </v-tooltip>
        <RiPushpin2Fill v-if="message.pinned" size="20" />
        <RiPushpin2Line v-else size="20" />
      </button>
      <button
        v-if="
          message.userId === $user.user?.id &&
          message.type === MessageType.Message
        "
        type="button"
        class="v-btn v-btn--icon v-theme--amoled v-btn--density-default rounded-0 v-btn--size-small v-btn--variant-text"
        @click="$emit('edit')"
      >
        <v-tooltip activator="parent" location="top" :eager="false">
          Edit
        </v-tooltip>
        <RiEditLine size="20" />
      </button>
      <button
        v-if="
          (message.userId === $user.user?.id &&
            message.type === MessageType.Message) ||
          ($chat.hasPermission('DELETE_MESSAGES') &&
            message.type === MessageType.Message)
        "
        type="button"
        class="v-btn v-btn--icon v-theme--amoled v-btn--density-default rounded-0 v-btn--size-small v-btn--variant-text"
        @click="$emit('delete', $event.shiftKey)"
      >
        <v-tooltip activator="parent" location="top" :eager="false">
          Delete
        </v-tooltip>
        <RiDeleteBinLine size="20" />
      </button>
      <button
        type="button"
        class="v-btn v-btn--icon v-theme--amoled v-btn--density-default rounded-0 v-btn--size-small v-btn--variant-text"
        @click="$emit('reply')"
      >
        <v-tooltip activator="parent" location="top" :eager="false">
          Reply
        </v-tooltip>
        <RiReplyLine size="20" />
      </button>
      <button
        v-if="$experiments.experiments.COPY_MSG_ID"
        type="button"
        class="v-btn v-btn--icon v-theme--amoled v-btn--density-default rounded-0 v-btn--size-small v-btn--variant-text"
        @click="$functions.copy(message.id)"
      >
        <v-tooltip activator="parent" location="top" :eager="false">
          Copy ID
        </v-tooltip>
        <v-icon>mdi-identifier</v-icon>
      </button>
    </template>
    <template v-else-if="message.error">
      <button
        type="button"
        class="v-btn v-btn--icon v-theme--amoled v-btn--density-default rounded-0 v-btn--size-small v-btn--variant-text"
        @click="attemptResend"
      >
        <v-tooltip activator="parent" location="top" :eager="false">
          Resend
        </v-tooltip>
        <v-icon>mdi-refresh</v-icon>
      </button>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { MessageType } from "@/gql/graphql";
import {
  RiDeleteBinLine,
  RiEditLine,
  RiPushpin2Fill,
  RiPushpin2Line,
  RiPushpinLine,
  RiReplyLine
} from "@remixicon/vue";

export default defineComponent({
  components: {
    RiReplyLine,
    RiDeleteBinLine,
    RiPushpin2Fill,
    RiPushpin2Line,
    RiPushpinLine,
    RiEditLine
  },
  props: ["message", "avoid", "merge"],
  emits: ["delete", "reply", "edit"],
  data() {
    return {
      size: "small"
    };
  },
  computed: {
    MessageType() {
      return MessageType;
    }
  },
  methods: {
    async attemptResend() {
      await this.$chat.sendMessage(
        this.message.content,
        this.message.attachments,
        this.message.replyId
      );
      const messageIndex = this.$chat.selectedChat?.messages.findIndex(
        (message) => message.id === this.message.id
      );
      if (
        messageIndex === -1 ||
        messageIndex === undefined ||
        !this.$chat.selectedChat
      )
        return;
      this.$chat.selectedChat.messages.splice(messageIndex, 1);
    }
  }
});
</script>
