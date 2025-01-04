<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { VueperSlide, VueperSlides } from "vueperslides";
import "vueperslides/dist/vueperslides.css";
import { formatDate, getEventImageUrl } from "@/others/util";

const store = useStore();
const route = useRoute();
const router = useRouter();

const events = computed(() => store.state.event.events);

const fetchData = async () => {
  await store.dispatch("event/setActiveEvents", {
    clubId: route.params.clubId,
    currentDate: new Date().toLocaleDateString("en-CA"),
  });
};
onMounted(async () => {
  await fetchData();
});
</script>
<template>
  <v-row align="center" justify="center" no-gutters>
    <v-col cols="12">
      <div class="text-center text-wrap text-h5 mt-2 mt-md-5">
        Upcoming events
      </div>
      <div class="text-center mb-4 mb-md-8 text-disabled">
        Select and book your entry
      </div>

      <v-sheet v-if="events?.length > 0" class="mx-auto" color="transparent">
        <vueper-slides
          :breakpoints="{ 800: { visibleSlides: 2, slideMultiple: 2 } }"
          :dragging-distance="200"
          :gap="3"
          :infinite="true"
          :slide-ratio="1 / 4"
          :touchable="false"
          :visible-slides="3"
          class="no-shadow"
          slide-multiple
        >
          <vueper-slide
            v-for="item in events"
            :key="item.id"
            :image="getEventImageUrl(item.banner)"
            class="cursor-pointer"
            @click="
              () =>
                $router.push({
                  name: 'event-register',
                  params: { clubId: item.clubId, eventId: item.id },
                })
            "
          >
            <template #content>
              <div
                class="text-center text-overline pa-1"
                style="background-color: rgb(73 73 73 / 70%); line-height: 1.8"
              >
                <div>{{ item.name }}</div>
                <div>
                  <v-icon size="small">mdi-map-marker</v-icon>
                  {{ item.location }}
                </div>
                <div>
                  <v-icon size="small">mdi-calendar</v-icon>
                  {{ formatDate(item.startDate) }} -
                  {{ formatDate(item.endDate) }}
                </div>
              </div>
            </template>
          </vueper-slide>
        </vueper-slides>
      </v-sheet>
      <div v-else>
        <div class="text-center">No events available!</div>
      </div>
    </v-col>
  </v-row>
</template>

<style></style>
