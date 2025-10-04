import { h } from "vue";
import type { IconSet, IconAliases, IconProps } from "vuetify";
import json from "@iconify-json/ri/icons.json";
import Linux from "@/components/Icons/Linux.vue";
import MdiDice from "@/components/Icons/v5/MdiDice.vue";
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
  "account-plus-fill": "user-add-fill",
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
  "sync-line": "loop-right-line"
};

const iconify: IconSet = {
  component: (props: IconProps) => {
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
