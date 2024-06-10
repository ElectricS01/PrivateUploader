import type { StrikeOptions as TiptapStrikeOptions } from "@tiptap/extension-strike";
import { Strike as TiptapStrike } from "@tiptap/extension-strike";

import ActionButton from "./components/ActionButton.vue";

import type { GeneralOptions } from "@/components/Workspaces/EditorV2/Core/types";
import { RiStrikethrough } from "@remixicon/vue";

export interface StrikeOptions
  extends TiptapStrikeOptions,
    GeneralOptions<StrikeOptions> {}

export const Strike = TiptapStrike.extend<StrikeOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      button: ({ editor, t }) => ({
        component: ActionButton,
        componentProps: {
          action: () => editor.commands.toggleStrike(),
          isActive: () => editor.isActive("strike") || false,
          disabled: !editor.can().toggleStrike(),
          icon: RiStrikethrough,
          tooltip: t("editor.strike.tooltip")
        }
      })
    };
  }
});
