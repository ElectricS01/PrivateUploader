import { h } from "vue";
import type { IconSet, IconAliases, IconProps } from "vuetify";
import json from "@iconify-json/ri/icons.json";
import Linux from "@/components/Icons/Linux.vue";
import MdiDice from "@/components/Icons/v5/MdiDice.vue";
import { mdi } from "vuetify/iconsets/mdi";
//@ts-ignore
const aliases: IconAliases = {
  collapse: "arrow-up-s-line",
  expand: "arrow-down-s-line",
  complete: "check-line",
  cancel: "close-line",
  close: "close-line",
  delete: "close-line",
  clear: "close-line",
  magnify: "search-line",
  success: "check-line",
  info: "information-line",
  warning: "alert-line",
  error: "error-warning-line",
  prev: "arrow-left-s-line",
  next: "arrow-right-s-line",
  checkboxOn: "checkbox-fill",
  checkboxOff: "checkbox-blank-line",
  checkboxIndeterminate: "checkbox-indeterminate-fill",
  delimiter: "ellipsis",
  sortAsc: "arrow-up-s-line",
  sortDesc: "arrow-down-s-line",
  menu: "menu-line",
  subgroup: "arrow-down-s-line",
  dropdown: "arrow-down-s-line",
  radioOn: "radio-button-fill",
  radioOff: "checkbox-blank-circle-line",
  edit: "edit-line",
  ratingEmpty: "star-line",
  ratingFull: "star-fill",
  ratingHalf: "star-half-fill",
  loading: "refresh-line",
  first: "arrow-left-double-line",
  last: "arrow-right-double-line",
  unfold: "arrow-down-s-line",
  file: "file-line",
  plus: "add-line",
  minus: "subtraction-line",
  calendar: "calendar-line"
};

const substitutions = {
  magnify: "search-line",
  "magnify-fill": "search-line",
  "chevron-right-fill": "arrow-right-s-line",
  "chevron-left-fill": "arrow-left-s-line",
  "plus-fill": "add-line",
  "alert-circle-fill": "error-warning-fill",
  "alert-circle-line": "error-warning-line",
  "delete-fill": "delete-bin-fill",
  "delete-line": "delete-bin-line",
  "arrow-left-line": "arrow-left-s-line",
  "arrow-right-line": "arrow-right-s-line",
  "arrow-up-line": "arrow-left-s-line",
  "arrow-down-line": "arrow-right-s-line",
  "arrow-left-fill": "arrow-left-s-line",
  "arrow-right-fill": "arrow-right-s-line",
  "arrow-up-fill": "arrow-left-s-line",
  "arrow-down-fill": "arrow-right-s-line",
  "cog-fill": "settings-5-fill",
  "cog-line": "settings-5-line",
  "chevron-down-fill": "arrow-down-s-line",
  "chevron-up-fill": "arrow-up-s-line",
  "chevron-down-line": "arrow-down-s-line",
  "chevron-up-line": "arrow-up-s-line",
  "linux-fill": {
    component: h(Linux)
  },
  "linux-line": {
    component: h(Linux)
  },
  "open-in-new-fill": "external-link-fill",
  "open-in-new-line": "external-link-line",
  "theme-light-dark-fill": "moon-fill",
  "minus-circle-fill": "indeterminate-circle-fill",
  "minus-circle-line": "indeterminate-circle-line",
  "account-multiple-plus-fill": "user-add-fill",
  "content-copy-fill": "file-copy-fill",
  "content-copy-line": "file-copy-line",
  "message-processing-line": "chat-1-line",
  "message-processing-fill": "chat-1-fill",
  "account-plus-fill": "user-add-fill",
  "account-plus-line": "user-add-line",
  "crown-fill": "vip-crown-fill",
  "crown-line": "vip-crown-line",
  "swap-horizontal-fill": "arrow-left-right-fill",
  "swap-horizontal-line": "arrow-left-right-line",
  "account-group-fill": "user-fill",
  "account-group-line": "user-line",
  "emoticon-fill": "emoji-sticker-fill",
  "emoticon-line": "emoji-sticker-line",
  "note-search-fill": "file-search-fill",
  "note-search-line": "file-search-line",
  "gavel-fill": "auction-fill",
  "gavel-line": "auction-line",
  "menu-down-fill": "arrow-down-s-line",
  "menu-down-line": "arrow-down-s-line",
  "dice-multiple-line": {
    component: h(MdiDice)
  },
  "dice-multiple-fill": {
    component: h(MdiDice)
  },
  "check-circle-fill": "checkbox-circle-fill",
  "check-circle-line": "checkbox-circle-line",
  "sync-fill": "loop-right-fill",
  "sync-line": "loop-right-line",
  "rename-fill": "input-field",
  "rename-line": "input-field",
  "account-minus-fill": "user-minus-fill",
  "account-minus-line": "user-minus-line",
  "folder-account-fill": "file-text-fill",
  "folder-account-line": "file-text-line",
  "account-cog-fill": "user-settings-fill",
  "account-cog-line": "user-settings-line",
  "image-multiple-fill": "image-2-fill",
  "image-multiple-line": "image-2-line",
  "folder-multiple-image-fill": "collage-fill",
  "folder-multiple-image-line": "collage-line",
  "image-auto-adjust-fill": "sparkling-2-fill",
  "image-auto-adjust-line": "sparkling-2-line",
  "email-fill": "mail-fill",
  "email-line": "mail-line",
  "chart-timeline-variant-shimmer-fill": "line-chart-line",
  "chart-timeline-variant-shimmer-line": "line-chart-line",
  "new-box-fill": "arrow-up-circle-fill",
  "bell-line": "notification-line",
  "bell-fill": "notification-fill",
  "account-fill": "user-fill",
  "account-line": "user-line",
  "exit-to-app-fill": "logout-box-fill",
  "exit-to-app-line": "logout-box-line",
  "menu-open-fill": "menu-unfold-4-fill",
  "cellphone-cog-fill": "smartphone-fill",
  "web-fill": "global-fill",
  "web-line": "global-line",
  "link-variant-fill": "link",
  "link-variant-line": "link",
  "code-tags-fill": "code-fill",
  "code-tags-line": "code-line",
  "pin-line": "pushpin-2-line",
  "pin-fill": "pushpin-2-fill",
  "identifier-fill": "code-fill",
  "identifier-line": "code-line"
};

const iconify: IconSet = {
  component: (props: IconProps) => {
    //@ts-ignore
    // if (window.DISABLE_V5_ICONSET_HACK) {
    //   return mdi.component
    // }
    if (typeof props.icon !== "string") {
      return props.icon;
    }
    let name = props.icon;
    if (props.icon.startsWith("mdi-") || props.icon.startsWith("ri-")) {
      if (
        !props.icon.includes("-fill") &&
        !props.icon.includes("-line") &&
        !props.icon.includes("-core") &&
        !props.icon.includes("-outline")
      ) {
        name = name + "-fill";
      } else if (props.icon.includes("-outline")) {
        name = name.replace("-outline", "-line");
      } else if (props.icon.includes("-core")) {
        name = name.replace("-core", "");
      }
      name = name.replace("mdi-", "").replace("ri-", "");
    }
    if (substitutions[name]) {
      name = substitutions[name];
    }
    return h("i", {}, [
      typeof name === "object"
        ? (<any>name)!!.component
        : h("svg", {
            class: ["ri"],
            debugName: name,
            innerHTML:
              json["icons"][<string>name]?.body ||
              json["icons"]["question-mark"].body,
            viewBox: "0 0 24 24"
          })
    ]);
  }
};

export { iconify, aliases };
