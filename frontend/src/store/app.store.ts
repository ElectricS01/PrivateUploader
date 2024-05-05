// Utilities
import { defineStore } from "pinia";
import axios from "@/plugins/axios";
import ax from "axios";
import { useToast } from "vue-toastification";
import functions from "@/plugins/functions";
import { AxiosProgressEvent } from "axios";
import { useUserStore } from "@/store/user.store";
import { useChatStore } from "@/store/chat.store";
import { useCollectionsStore } from "@/store/collections.store";
import { useWorkspacesStore } from "@/store/workspaces.store";
import vuetify from "@/plugins/vuetify";
import { useExperimentsStore } from "@/store/experiments.store";
import i18nObject, { i18n } from "@/plugins/i18n";
import { SidebarItem } from "@/types/sidebar";
import { WeatherQuery } from "@/graphql/core/weather.graphql";
import { CoreState, Upload } from "@/gql/graphql";
import { useFriendsStore } from "@/store/friends.store";
import { useMailStore } from "@/store/mail.store";
import { useApolloClient } from "@vue/apollo-composable";
import FlowinityLogo from "@/components/Brand/FlowinityLogo.vue";
import { h } from "vue";
import { CoreStateQuery } from "@/graphql/core/stateOnly.graphql";

export enum Platform {
  WEB = "WEB",
  WINDOWS = "WINDOWS",
  MAC = "MAC",
  LINUX = "LINUX"
}

function getPlatform(): Platform {
  if (!window.electron) return Platform.WEB;
  if (window.electron.process.platform === "win32") return Platform.WINDOWS;
  if (window.electron.process.platform === "darwin") return Platform.MAC;
  if (window.electron.process.platform === "linux") return Platform.LINUX;
  return Platform.WEB;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    connected: false,
    token: localStorage.getItem("token") || "",
    _postInitRan: false,
    quickAction: parseInt(localStorage.getItem("quickAction") || "1"),
    railMode: "tpu",
    batterySave: false,
    themeProviderDefaults: {
      theme: {},
      global: {}
    },
    fluidGradient: false,
    demo: false,
    cordova: false,
    lastRoute: null,
    domain: "/i/",
    mainDrawer: true,
    workspaceDrawer: localStorage.getItem("workspaceDrawer") === "true",
    forcedWorkspaceDrawer: false,
    loading: true,
    /**
     * @deprecated
     * Use a custom loading screen, such as a skeleton loader for each individual component/page context
     */
    componentLoading: false,
    apiVersion: "v3",
    title: "",
    notesSaving: false,
    themeEditor: false,
    lastNote: localStorage.getItem("lastNote")
      ? parseInt(localStorage.getItem("lastNote") as string)
      : null,
    shifting: false,
    version: {
      current: import.meta.env.TPU_VERSION || "N/A",
      date: import.meta.env.TPU_BUILD_DATE || "N/A"
    },
    site: {
      name: "Flowinity",
      maintenance: {
        enabled: false
      }
    } as CoreState,
    weather: {
      loading: true,
      data: {
        description: "Clouds",
        icon: "04d",
        temp: 0,
        temp_max: 0,
        temp_min: 0,
        name: "Australia",
        id: 2643743,
        main: "Clouds"
      }
    },
    dialogs: {
      deleteItem: {
        value: false,
        item: undefined,
        emit: false
      },
      selectDefaultMobile: false,
      feedback: false,
      inviteAFriend: false,
      experiments: false,
      nickname: {
        value: false,
        userId: 0
      },
      pi: {
        value: false
      },
      gold: {
        value: false
      },
      colubrina: false,
      quickSwitcher: false,
      upload: {
        value: false,
        files: [],
        percentage: 0,
        loading: false
      },
      ocr: {
        value: false,
        text: ""
      },
      memoryProfiler: false,
      socketProfiler: false,
      actionDialog: false,
      networkInspector: false
    },
    quickSwitcher: [
      {
        route: "/",
        name: "Home"
      },
      {
        route: "/gallery",
        name: "Gallery"
      },
      {
        route: "/collections",
        name: "Collections"
      },
      {
        route: "/insights",
        name: "Insights"
      },
      {
        route: "/settings",
        name: "Settings"
      },
      {
        route: "/autoCollects",
        name: "AutoCollects"
      },
      {
        route: "/starred",
        name: "Starred"
      },
      {
        route: "/users",
        name: "Users"
      },
      {
        route: "/workspaces",
        name: "Workspaces"
      }
    ],
    platform: getPlatform(),
    desktop: {
      updateAvailable: false,
      nagStartup: true,
      version: ""
    }
  }),
  getters: {
    activeNags() {
      const userStore = useUserStore();
      const experimentsStore = useExperimentsStore();
      const iaf = experimentsStore.experiments.IAF_NAG;

      const nags = {
        DOWNLOAD_THE_APP_NAG:
          this.platform === Platform.WEB &&
          (experimentsStore.experiments.DOWNLOAD_THE_APP_NAG === 1
            ? userStore.user?.emailVerified
            : experimentsStore.experiments.DOWNLOAD_THE_APP_NAG === 2) &&
          !vuetify.display.mobile.value,
        EMAIL_VERIFICATION: !userStore.user?.emailVerified,
        ENABLE_AUTOSTART_APP_NAG:
          this.platform !== Platform.WEB &&
          !this.desktop.nagStartup &&
          experimentsStore.experiments.ENABLE_AUTOSTART_APP_NAG === 1,
        IAF_NAG: (iaf === 1 && userStore.user?.emailVerified) || iaf === 2
      };

      return {
        ...nags,
        offset: Object.keys(nags).filter((key) => nags[key]).length * 42,
        IAF_PROMO:
          experimentsStore.experiments.IAF_NAG === 0 || experimentsStore
      };
    },
    quickActionItem(state): SidebarItem {
      const item = this.sidebar.find((item) => item.id === state.quickAction);
      if (!item) return this.sidebar.find((item) => item.id === 1);
      return item;
    },
    sidebar(state): SidebarItem[] {
      const user = useUserStore();
      const chat = useChatStore();
      const experiments = useExperimentsStore();
      const mail = useMailStore();
      const app = useAppStore();

      if (!user.user) return [];
      const items = [
        {
          id: 1,
          externalPath: "",
          path: "/",
          name: i18n.t("core.sidebar.home"),
          icon: "mdi-home",
          scope: "user.view",
          exact: true
        },
        {
          separator: true,
          id: 16,
          name: i18n.t("core.sidebar.account")
        },
        {
          id: 2,
          externalPath: "",
          path: "/settings",
          name: i18n.t("core.sidebar.settings"),
          icon: "mdi-account-cog",
          scope: "user.modify"
        },
        {
          id: 6,
          externalPath: "",
          path: "/gallery",
          exact: false,
          name: i18n.t("core.sidebar.gallery"),
          icon: "mdi-image-multiple",
          scope: "uploads.view"
        },
        {
          id: 10,
          externalPath: "",
          name: i18n.t("core.sidebar.starred"),
          path: "/starred",
          icon: "mdi-star",
          scope: ["uploads.view", "starred.view"],
          new: false
        },
        {
          id: 5,
          externalPath: "",
          name: i18n.t("core.sidebar.files"),
          separator: true
        },
        {
          id: 14,
          externalPath: "",
          name: i18n.t("core.sidebar.mail"),
          path: "/mail",
          icon: "mdi-email",
          scope: "mail.view",
          experimentsRequired: ["WEBMAIL", "OFFICIAL_INSTANCE"],
          warning: mail.unread > 0 ? mail.unread : false
        },
        {
          id: 13,
          externalPath: "",
          path: "/users",
          name: i18n.t("core.sidebar.users"),
          icon: "mdi-account-group",
          scope: "user.view"
        } /*
        {
          id: 29,
          click() {
            state.dialogs.feedback = true;
          },
          externalPath: "",
          path: "",
          name: i18n.t("core.sidebar.feedback"),
          icon: "mdi-comment-question-outline",
          scope: ""
        },
        {
          id: 30,
          externalPath: "",
          path: "/changelog",
          name: i18n.t("core.sidebar.changelog"),
          icon: "mdi-history"
        },*/,
        {
          id: 33,
          click() {
            state.dialogs.gold.value = true;
          },
          externalPath: "",
          path: "",
          name: user.gold
            ? i18n.t("core.sidebar.newWithGold")
            : i18n.t("core.sidebar.upgradeToGold"),
          icon: "mdi-plus",
          new: false,
          scope: "user.view",
          experimentsRequired: ["OFFICIAL_INSTANCE"]
        },
        {
          id: 37,
          separator: true,
          name: i18n.t("core.sidebar.adminSeparator"),
          experimentsRequired: ["ACCOUNT_DEV_ELIGIBLE"]
        },
        {
          id: 38,
          externalPath: "",
          path: "/admin",
          name: i18n.t("core.sidebar.admin"),
          icon: "mdi-gavel",
          new: false,
          scope: "admin.view",
          experimentsRequired: ["ACCOUNT_DEV_ELIGIBLE"]
        },
        {
          id: 39,
          name: i18n.t("core.sidebar.secretMenu"),
          click() {
            state.dialogs.actionDialog = !state.dialogs.actionDialog;
          },
          icon: "mdi-bug",
          experimentsRequired: ["ACCOUNT_DEV_ELIGIBLE"]
        }
      ] as SidebarItem[];

      if (state.platform === Platform.WEB) {
        items.push({
          id: 36,
          externalPath: "",
          path: "/downloads",
          name: i18n.t("core.sidebar.download"),
          icon: "mdi-download",
          new: true,
          scope: ""
        });
      }
      /*
      if (state.site.officialInstance) {
        items.push(
          {
            id: 39,
            path: "/invite/flowinity",
            name: i18n.t("core.sidebar.communicationsPublic"),
            icon: h(FlowinityLogo),
            new: true,
            scope: "",
            externalPath: ""
          },
          {
            id: 39,
            externalPath: "https://discord.gg/4fB6GCR3Qv",
            name: i18n.t("core.sidebar.discord"),
            customIcon: "@/assets/images/discord.svg",
            new: true,
            scope: "",
            path: "",
            icon: ""
          }
        );
      }*/

      // Server feature options
      if (
        state.site.inviteAFriend ||
        user.user?.moderator ||
        user.user?.administrator
      ) {
        items.push({
          id: 15,
          click() {
            state.dialogs.inviteAFriend = true;
          },
          externalPath: "",
          path: "",
          name: i18n.t("core.sidebar.inviteAFriend"),
          icon: "mdi-gift-outline",
          scope: ""
        });
      }

      if (state.site.features?.insights) {
        items.push({
          id: 17,
          externalPath: "",
          name: i18n.t("core.sidebar.insights"),
          path: "/insights",
          scope: "insights.view",
          icon: "mdi-chart-timeline-variant-shimmer"
        });
      }

      items.push({
        id: 11,
        externalPath: "",
        name: i18n.t("core.sidebar.comms"),
        separator: true
      });

      if (state.site.features?.communications) {
        items.push({
          id: 12,
          externalPath: "",
          name: i18n.t("core.sidebar.communications"),
          path: chat.selectedChatId
            ? `/communications/${chat.selectedChatId}`
            : "/communications",
          icon: "mdi-message-processing",
          warning: functions.checkScope("chats.view", user.user?.scopes)
            ? chat.totalUnread
            : false,
          scope: "chats.view",
          experimentsRequired: ["COMMUNICATIONS"]
        });
      }

      if (state.site.features?.workspaces) {
        items.push({
          id: 10,
          externalPath: "",
          name: i18n.t("core.sidebar.workspaces"),
          path: this.$router.currentRoute.value.name
            ?.toString()
            ?.includes("Workspace")
            ? "/workspaces"
            : state.lastNote
              ? `/workspaces/notes/${state.lastNote}`
              : "/workspaces",
          icon: "mdi-folder-account",
          scope: "workspaces.view",
          experimentsRequired: ["INTERACTIVE_NOTES"]
        });
      }

      if (state.site.features?.collections) {
        items.push({
          id: 7,
          externalPath: "",
          name: i18n.t("core.sidebar.collections"),
          path: "/collections",
          icon: "mdi-folder-multiple-image",
          new: false,
          scope: "collections.view"
        });
      }

      if (state.site.features?.autoCollects) {
        items.push({
          id: 9,
          externalPath: "",
          name: i18n.t("core.sidebar.autoCollects"),
          path: "/autoCollect",
          icon: "mdi-image-auto-adjust",
          new: false,
          scope: "collections.modify",
          warning:
            user.user.pendingAutoCollects > 0
              ? user.user.pendingAutoCollects
              : false
        });
      }

      items.sort((a, b) => a.id - b.id);

      return items.filter((item) => {
        if (item.experimentsRequired) {
          for (const experiment of item.experimentsRequired) {
            if (!experiments.experiments[experiment]) {
              return false;
            }
          }
        }
        return true;
      });
    },
    rail() {
      const experiments = useExperimentsStore();
      return (
        experiments.experiments.RAIL_SIDEBAR &&
        !vuetify.display.lgAndUp.value &&
        !vuetify.display.mobile.value
      );
    },
    weatherTemp(state) {
      const temp = state.weather.data?.temp;
      const user = useUserStore()?.user;
      if (!user?.weatherUnit) return 0;
      if (user?.weatherUnit === "kelvin") {
        // round to 2 decimal places
        return Math.round((temp + 273.15) * 100) / 100;
      } else if (user?.weatherUnit === "fahrenheit") {
        return Math.round(((temp * 9) / 5 + 32) * 100) / 100;
      } else {
        return temp;
      }
    }
  },
  actions: {
    async checkForUpdates() {
      if (this.platform !== Platform.LINUX) return;
      const { data } = await ax.get(
        "https://updates.flowinity.com/versions/sorted"
      );

      for (const version of data.items) {
        if (version.channel.name === "stable") {
          if (version.name !== this.desktop.version) {
            this.desktop.updateAvailable = true;
          }
          break;
        }
      }
    },
    toggleWorkspace() {
      this.workspaceDrawer = !this.workspaceDrawer;
      if (vuetify.display.mobile.value && this.workspaceDrawer) {
        this.mainDrawer = false;
      }
    },
    toggleMain() {
      this.mainDrawer = !this.mainDrawer;
      if (vuetify.display.mobile.value && this.mainDrawer) {
        this.workspaceDrawer = false;
      }
    },
    populateQuickSwitcher() {
      const value = [
        {
          route: "/",
          name: "Home"
        },
        {
          route: "/gallery",
          name: "Gallery"
        },
        {
          route: "/collections",
          name: "Collections"
        },
        {
          route: "/insights",
          name: "Insights"
        },
        {
          route: "/settings",
          name: "Settings"
        },
        {
          route: "/autoCollects",
          name: "AutoCollects"
        },
        {
          route: "/starred",
          name: "Starred"
        },
        {
          route: "/users",
          name: "Users"
        },
        {
          route: "/workspaces",
          name: "Workspaces"
        },
        {
          name: "SP Socket Profiler",
          click: () => {
            this.dialogs.socketProfiler = true;
          }
        }
      ];
      const chats = useChatStore();
      for (const chat of chats.chats) {
        value.push({
          route: `/communications/${chat.association?.id}`,
          name: chats.chatName(chat)
        });
      }
      const collections = useCollectionsStore();
      for (const collection of collections.items) {
        value.push({
          route: `/collections/${collection.id}`,
          name: collection.name
        });
      }
      const workspaces = useWorkspacesStore();
      for (const workspace of workspaces.recentOverall) {
        value.push({
          route: `/workspaces/${workspace.id}`,
          name: workspace.name
        });
      }
      this.quickSwitcher = value;
    },
    async deleteItem(item: Upload | undefined) {
      if (!item) return;
      this.dialogs.deleteItem.item = item;
      await axios.delete("/gallery/" + item.id);
      this.dialogs.deleteItem.value = false;
      this.dialogs.deleteItem.emit = true;
    },
    async getWeather() {
      try {
        const {
          data: { weather }
        } = await useApolloClient().client.query({
          query: WeatherQuery
        });
        this.weather.data = weather;
        this.weather.loading = false;
      } catch {
        //
      }
    },
    loadLocalStorage() {
      const chatStore = useChatStore();
      chatStore.init();
      const userStore = useUserStore();
      const experimentsStore = useExperimentsStore();
      const core = localStorage.getItem("coreStore");
      if (core) {
        try {
          this.site = JSON.parse(core);
          this.domain = "https://" + this.site.domain + "/i/";
          this.loading = false;
        } catch {
          //
        }
      }
      const user = localStorage.getItem("userStore");
      if (user) {
        try {
          userStore.user = JSON.parse(user);
        } catch {
          //
        }
      }
      const tracked = localStorage.getItem("trackedUsersStore");
      if (tracked) {
        try {
          userStore.tracked = JSON.parse(tracked);
        } catch {
          //
        }
      }
      let experiments: any = localStorage.getItem("experimentsStore");
      if (experiments) {
        try {
          experiments = JSON.parse(experiments);
          for (const experiment of experiments) {
            experimentsStore.experiments[experiment.id] = experiment.value;
          }
          if (experimentsStore.experiments.PRIDE) {
            document.body.classList.add("rainbow");
          }
        } catch {
          //
        }
      }
    },
    postInit() {
      if (this._postInitRan) return;
      this.$app.$socket.on("disconnect", () => {
        this.connected = false;
      });
      this.$app.$socket.on("connect", () => {
        this.connected = true;
      });
      const user = useUserStore();
      setInterval(
        () => {
          this.getWeather();
        },
        1000 * 60 * 15
      );
      this._postInitRan = true;
      this.populateQuickSwitcher();
      this.getWeather();
      if (
        user.user?.plan?.internalName === "GOLD" ||
        !this.site.officialInstance
      ) {
        document.body.classList.add("gold");
        user.applyTheme();
      }
      this.setFavicon();
      i18nObject.global.locale =
        (user.user?.language as "en" | "en-GB" | "fr" | "ru") || "en";
    },
    setFavicon() {
      const chat = useChatStore();
      const user = useUserStore();
      const experimentsStore = useExperimentsStore();
      const links = document.getElementsByTagName("link");
      //@ts-ignore
      for (const link of links) {
        if (
          link.getAttribute("rel") !== "manifest" &&
          link.getAttribute("rel") !== "stylesheet" &&
          link.getAttribute("rel") !== "preload" &&
          link.getAttribute("rel") !== "modulepreload"
        ) {
          link.remove();
        }
      }
      // set favicon to gold
      const link =
        (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
        (document.createElement("link") as HTMLLinkElement);
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = `/api/v3/user/favicon.png?cache=${Date.now()}&username=${
        user.user?.username
      }&unread=${chat.totalUnread || 0}&debug=${
        experimentsStore.experiments.DEBUG_FAVICON
      }&client=TPUvNEXT`;
      document.head.appendChild(link);
    },
    async init() {
      this.loading = true;
      this.loadLocalStorage();
      const chatStore = useChatStore();
      const collectionsStore = useCollectionsStore();
      if (!window.tpuInternals) {
        window.tpuInternals = {
          processLink: chatStore.processLink,
          readChat: chatStore.readChat,
          lookupUser: chatStore.lookupUser,
          setChat: (id) => window._tpu_router.push(`/communications/${id}`),
          lookupChat: chatStore.lookupChat,
          openUser: chatStore.openUser,
          router: window._tpu_router,
          lookupCollection: (id) => {
            return (
              collectionsStore.persistent.find(
                (collection) => collection.id === id
              ) || {
                name: "Unknown Collection"
              }
            );
          },
          openCollection: ((id) =>
            window._tpu_router.push("/collections/" + id)) as (
            id: number
          ) => void,
          pulse: this.$app.$sockets.pulse,
          openEmoji: chatStore.openEmoji
        };
      }
      const {
        data: { coreState, experiments }
      } = await useApolloClient().client.query({
        query: CoreStateQuery,
        fetchPolicy: "no-cache"
      });
      this.site = coreState;
      const userStore = useUserStore();
      userStore.defaultVuetify = vuetify.theme.themes;
      //userStore.applyTheme();
      // userStore.user = currentUser;
      // userStore.tracked = trackedUsers;
      // userStore.blocked = blockedUsers;
      // if (collections) {
      //   collectionsStore.persistent = collections.items;
      // }
      // chatStore.emoji = userEmoji;
      // chatStore.chats = chats
      //   .map((chat) => {
      //     return {
      //       ...chat,
      //       messages: chatStore.chats.find((c) => c.id === chat.id)?.messages
      //     };
      //   })
      //   .sort((a: Chat, b: Chat) => {
      //     return (
      //       Number(b._redisSortDate) - Number(a._redisSortDate) ||
      //       Number(b.id) - Number(a.id)
      //     );
      //   });
      this.loading = false;
      const experimentsStore = useExperimentsStore();
      for (const experiment of experiments) {
        experimentsStore.experiments[experiment.id] = experiment.value;
        if (!experimentsStore.experiments["meta"])
          experimentsStore.experiments["meta"] = {};
        experimentsStore.experiments["meta"][experiment.id] = experiment;
      }
      experimentsStore.experimentsInherit = experimentsStore.experiments;
      if (experimentsStore.experiments.PRIDE) {
        document.body.classList.add("rainbow");
      } else {
        document.body.classList.remove("rainbow");
      }
      if (experimentsStore.experiments.WEBMAIL) useMailStore().init();
      this.experimentsInherit = experimentsStore.experiments;
      this.domain = "https://" + this.site.domain + "/i/";
      localStorage.setItem("coreStore", JSON.stringify(coreState));
      localStorage.setItem("experimentsStore", JSON.stringify(experiments));
      await useUserStore().init();
      this.postInit();
      useChatStore().init();
      useCollectionsStore().init();
      useWorkspacesStore().init();
      useFriendsStore().init();
    },
    async refresh() {
      const {
        data: { coreState }
      } = await useApolloClient().client.query({
        query: CoreStateQuery
      });
      this.site = coreState;
      this.domain = "https://" + this.site.domain + "/i/";
      localStorage.setItem("coreStore", JSON.stringify(coreState));
    },
    async upload() {
      try {
        const toast = useToast();
        if (!this.dialogs.upload.files.length)
          toast.error("No files selected!");
        const formData = new FormData();
        for (const file of this.dialogs.upload.files) {
          formData.append("attachments", file);
        }
        this.dialogs.upload.loading = true;
        const { data } = await axios.post("/gallery/site", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (!progressEvent.total) return;
            this.dialogs.upload.percentage = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
          }
        });
        if (this.dialogs.upload.files.length === 1) {
          functions.copy(data[0].url);
          toast.success(
            `Successfully uploaded file and copied the ${this.site.name} link to the clipboard!`
          );
        } else {
          toast.success("Successfully uploaded files!");
        }
        this.dialogs.upload.value = false;
        this.dialogs.upload.files = [];
        this.dialogs.upload.percentage = 0;
        this.dialogs.upload.loading = false;
      } catch (e) {
        this.dialogs.upload.percentage = 0;
        this.dialogs.upload.loading = false;
        return e;
      }
    },
    reconnectSocket(token: string) {
      this.$app.$socket.auth = { token };
      this.$app.$sockets.user.auth = { token };
      this.$app.$sockets.chat.auth = { token };
      this.$app.$sockets.autoCollects.auth = { token };
      this.$app.$sockets.friends.auth = { token };
      this.$app.$sockets.gallery.auth = { token };
      this.$app.$sockets.mail.auth = { token };
      this.$app.$sockets.pulse.auth = { token };

      this.$app.$sockets.user.disconnect().connect();
      this.$app.$sockets.chat.disconnect().connect();
      this.$app.$sockets.autoCollects.disconnect().connect();
      this.$app.$sockets.friends.disconnect().connect();
      this.$app.$sockets.gallery.disconnect().connect();
      this.$app.$sockets.mail.disconnect().connect();
      this.$app.$sockets.pulse.disconnect().connect();
      this.$app.$socket.disconnect().connect();
    }
  }
});
