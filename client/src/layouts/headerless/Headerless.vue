<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import FOG from "vanta/dist/vanta.fog.min";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import DefaultFooter from "@/layouts/default/Footer.vue";
import { getApiPublicImgUrl } from "@/others/util";
import Logo from "@/components/Logo.vue";
import { useDisplay } from "vuetify";

const route = useRoute();
const store = useStore();
const { xs } = useDisplay();

let vantaEffect = null;
const fogElement = ref(null);

const currentUser = computed(() => store.getters["user/getCurrentUser"]);
const club = computed(() => store.state.club.club);
// const theme = useTheme();
// const themeColors = computed(() => theme.global.current.value.colors);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

onMounted(async () => {
  if (!club.value?.id) store.dispatch("club/setClub", route.params.clubId);

  await nextTick();
  await delay(1500);

  // Initialize VANTA.FOG with options
  if (fogElement.value && !["sudo", "admin"].includes(currentUser.value.role)) {
    vantaEffect = FOG({
      el: fogElement.value,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: fogElement.value.offsetHeight,
      minWidth: fogElement.value.offsetWidth,
      highlightColor: "#ffc300",
      midtoneColor: "#ff1f00",
      lowlightColor: "#2d00ff",
      baseColor: "#f703f7",
      blurFactor: 0.4,
      speed: 1.5,
      zoom: 1.2,
    });
  }
});
</script>

<template>
  <v-app full-height>
    <div ref="fogElement" class="fill-height bg-tertiary d-flex align-center">
      <v-main>
        <v-container class="fill-height">
          <v-row align="center" justify="center" no-gutters>
            <v-col cols="12">
              <div v-if="club.id">
                <logo
                  :img-src="club.logo ? getApiPublicImgUrl(club.logo, 'club-logo') : null"
                  :max-width="xs ? 200 : 300"
                  :title="!club.logo ? club.name : null"
                  container-class="clickable"
                  img-class="mx-auto"
                  @click="
                    $router.push({
                      name: 'club-single',
                      params: { clubId: route.params.clubId },
                    })
                  "
                ></logo>
              </div>
              <router-view :key="route.fullPath" />
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </div>
    <default-footer />
  </v-app>
</template>

<style scoped></style>
