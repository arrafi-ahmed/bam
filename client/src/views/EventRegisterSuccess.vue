<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  clientBaseUrl,
  getQueryParam,
  removeQueryParams,
  sendToWhatsapp,
} from "@/others/util";
import { useStore } from "vuex";
import QRCodeVue3 from "qrcode-vue3";
import { useTheme } from "vuetify";
import { toast } from "vue-sonner";

const store = useStore();
const route = useRoute();
const router = useRouter();
const theme = useTheme();

const registration = computed(() => store.state.registration.registration);

const qrCode = computed(() => {
  return JSON.stringify({
    id: registration.value?.id,
    qrUuid: registration.value?.qrUuid,
  });
});

const qrOptions = {
  type: "dot",
  color: theme.global.current.value.colors.primary,
};

const handleSendToWhatsapp = () => {
  const phone = registration.value.registrationData.phone.slice(1);
  const message = `QR code download link: ${clientBaseUrl}/qr/${registration.value.id}/${registration.value.qrUuid}`;
  sendToWhatsapp(phone, message);
};
onMounted(async () => {
  // If landed from Stripe payment
  if (getQueryParam("redirect_stripe") === "1") {
    const registrationId = getQueryParam("registration_id");
    const uuid = getQueryParam("uuid");
    const sessionId = getQueryParam("session_id");

    if (!registrationId || !uuid || !sessionId) return;

    let action = "";
    let msg = "";
    try {
      await store.dispatch("registration/setRegistration", {
        registrationId,
        uuid,
      });

      const result = await store.dispatch("registration/getPaymentStatus", {
        sessionId,
      });

      if (result === "complete") {
        action = "success";
        msg = "Payment succeeded!";
        await store.dispatch("registration/updateStatus", {
          registrationId,
          uuid,
          registrationStatus: true,
        });
      } else if (result === "open") {
        action = "success";
        msg = "Payment failed!";
      }
    } catch (error) {
      action = "error";
      msg = "Error during payment process!";
    } finally {
      if (action && msg) {
        toast[action](msg);
      }
      // Ensure redirection does not happen multiple times
      const cleanUrl = removeQueryParams(window.location.href, [
        "redirect_stripe",
        "session_id",
      ]);
      window.history.replaceState(null, "", cleanUrl); // Replace URL without reloading
    }
  }
  // If page reloaded
  else if (!registration.value?.id) {
    const registrationId = getQueryParam("registration_id");
    const uuid = getQueryParam("uuid");

    if (registrationId && uuid) {
      await store.dispatch("registration/setRegistration", {
        registrationId,
        uuid,
      });
    }
  }
});

onUnmounted(() => {
  store.commit("registration/resetRegistration");
});
</script>
<template>
  <v-row align="center" justify="center">
    <v-col cols="12" md="5" sm="6">
      <v-card
        v-if="registration.id"
        class="mx-auto rounded-xl bg-transparent"
        color=""
        elevation="0"
        max-width="500"
        variant="flat"
      >
        <v-card-text>
          <v-card-title class="text-center text-wrap mt-2 mt-md-5">
            QR Code for the registration:
          </v-card-title>

          <div class="d-flex justify-center">
            <QRCodeVue3
              :cornersSquareOptions="qrOptions"
              :dotsOptions="qrOptions"
              :download="true"
              :height="250"
              :value="qrCode"
              :width="250"
              downloadButton="v-btn v-theme--dark v-btn--block bg-primary v-btn--density-default v-btn--size-small v-btn--variant-flat mt-2"
            />
          </div>
          <div class="d-flex justify-center">
            <v-btn
              :width="250"
              class="mt-1 mt-md-2"
              color="primary"
              size="small"
              variant="flat"
              @click="handleSendToWhatsapp"
              >Send to WhatsApp
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
      <div v-else class="text-center pa-10">Page expired!</div>
      <div class="d-flex justify-center">
        <v-btn
          :to="{
            name: 'club-single',
            params: { clubId: route.params.clubId },
          }"
          class="mt-2"
          size="small"
          variant="text"
          >Go Back
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>

<style></style>
