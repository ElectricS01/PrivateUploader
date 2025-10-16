<template>
  <v-card>
    <v-toolbar color="toolbar">
      <v-toolbar-title>
        {{ $t("settings.slideshows.title") }}
      </v-toolbar-title>
    </v-toolbar>
    <v-container>
      <v-card-title>
        {{ $t("settings.slideshows.my") }}
      </v-card-title>
      <v-expansion-panels>
        <v-expansion-panel v-for="slideshow in slideshows" :key="slideshow.id">
          <template #title>
            {{ slideshow.name }}
            <div style="float: right">
              <tpu-btn icon @click="deleteSlideshow(slideshow)">
                <v-icon>mdi-close</v-icon>
              </tpu-btn>
            </div>
          </template>
          <template #text>
            <v-card-text>
              <v-text-field
                :label="$t('settings.slideshows.shareLink')"
                :model-value="`${$app.site.hostnameWithProtocol}/slideshow/${slideshow.shareLink}`"
                readonly
                persistent-hint
                hint="Click to copy"
                class="mb-2"
                @click="
                  $toast.success('Slideshow link copied to clipboard!');
                  functions.copy(
                    `${$app.site.hostnameWithProtocol}/slideshow/${slideshow.shareLink}`
                  );
                "
              />
              <v-text-field
                v-model="slideshow.name"
                :label="$t('settings.slideshows.name')"
              />
              <v-text-field
                v-model="slideshow.speed"
                :label="$t('settings.slideshows.speed')"
              />
              <tpu-switch
                v-model="slideshow.includeGallery"
                :label="$t('settings.slideshows.includeGallery')"
                inset
              />
              <v-select
                v-model="slideshow.collectionIds"
                :items="$collections.persistent"
                :label="$t('settings.slideshows.collections')"
                chips
                deletable-chips
                item-title="name"
                item-value="id"
                multiple
              />
            </v-card-text>

            <ActionSheet
              label="Save"
              icon="mdi-save"
              @click="saveSlideshow(slideshow)"
            />
          </template>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-card-subtitle v-if="!slideshows.length">
        {{ $t("settings.slideshows.none") }}
      </v-card-subtitle>

      <ActionSheet label="Create" icon="mdi-plus" @click="createSlideshow()" />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Slideshow } from "@/models/slideshow";
import ActionSheet from "@/components/Settings/ActionSheet.vue";
import functions from "@/plugins/functions";

export default defineComponent({
  computed: {
    functions() {
      return functions;
    }
  },
  components: {
    ActionSheet
  },
  data() {
    return {
      slideshows: [] as Slideshow[]
    };
  },
  mounted() {
    this.getSlideshows();
  },
  methods: {
    async saveSlideshow(slideshow: Slideshow) {
      await this.axios.put("/slideshows/" + slideshow.id, slideshow);
    },
    async getSlideshows() {
      const { data } = await this.axios.get("/slideshows");
      this.slideshows = data;
    },
    async createSlideshow() {
      await this.axios.post("/slideshows", {
        name: "New Slideshow",
        includeGallery: true,
        collectionIds: []
      });
      await this.getSlideshows();
    },
    async deleteSlideshow(slideshow: Slideshow) {
      await this.axios.delete("/slideshows/" + slideshow.id);
      this.$toast.success("Slideshow deleted!");
      await this.getSlideshows();
    }
  }
});
</script>
