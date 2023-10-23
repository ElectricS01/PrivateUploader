import { ref, computed, markRaw, type Raw } from "vue";
import { defineStore, getActivePinia } from "pinia";
import type { Collection, CollectionInput, Pager } from "@/gql/graphql";
import { CollectionQuery } from "@/graphql/collections/getCollection.graphql";
import { isNumeric } from "@/plugins/isNumeric";
import { useApolloClient, useMutation, useQuery } from "@vue/apollo-composable";
import {
  AddToCollectionMutation,
  RemoveFromCollectionMutation
} from "@/graphql/collections/addToCollection.graphql";
import { useRoute } from "vue-router";

export const useCollectionsStore = defineStore("collections", () => {
  const items = ref<Collection[]>([]);
  const pager = ref<Pager | null>(null);
  const { resolveClient } = useApolloClient();
  const client = resolveClient();

  async function getCollection(id: string | number) {
    const {
      data: { collection }
    } = await client.query({
      query: CollectionQuery,
      variables: {
        input: {
          id: isNumeric(id) ? id : undefined,
          shareLink: !isNumeric(id) ? id : undefined
        }
      } as CollectionInput,
      fetchPolicy: "network-only"
    });
    return collection;
  }

  async function addToCollection(collectionId: number, items: number[]) {
    const data = useMutation(AddToCollectionMutation, {
      variables: {
        input: {
          collectionId,
          items
        }
      }
    });
    return await data.mutate();
  }

  async function removeFromCollection(collectionId: number, items: number[]) {
    const data = useMutation(RemoveFromCollectionMutation, {
      variables: {
        input: {
          collectionId,
          items
        }
      }
    });
    return await data.mutate();
  }

  const route = useRoute();
  const selected = computed(() => {
    if (!route.path.startsWith("/collections/")) return;
    return items.value.find(
      (collection) => collection.id === parseInt(<string>route.params.id)
    );
  });

  const writable = computed(() => {
    return items.value.filter((item) => item.permissionsMetadata.write);
  });

  return {
    items,
    pager,
    getCollection,
    addToCollection,
    removeFromCollection,
    selected,
    writable
  };
});