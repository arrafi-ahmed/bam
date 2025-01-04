<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCountryList, isValidEmail, stripePublic } from "@/others/util";
import { useStore } from "vuex";
import Phone from "@/components/Phone.vue";
import FormItems from "@/components/FormItems.vue";
import { useDisplay } from "vuetify";
import { loadStripe } from "@stripe/stripe-js/pure";
import { toast } from "vue-sonner";

const store = useStore();
const route = useRoute();
const router = useRouter();
const { xs } = useDisplay();

const registration = computed(() => store.state.registration.registration);
const event = computed(() => store.state.event.event);
const registrationInit = {
  registrationData: {
    name: null,
    email: null,
    phone: null,
    others: [],
  },
  eventId: null,
  clubId: null,
};
const newRegistration = reactive({ ...registrationInit });

const form = ref(null);
const isFormValid = ref(true);

const registerUser = async () => {
  await form.value.validate();
  if (!isFormValid.value) return;

  newRegistration.eventId = route.params.eventId;
  newRegistration.clubId = route.params.clubId;

  newRegistration.registrationData.others = additionalAnswers.value.map(
    (item, index) => ({
      qId: formQuestions.value?.[index]?.id,
      question: formQuestions.value?.[index]?.text,
      answer: item,
    }),
  );

  // if free ticket
  if (isEventFree.value) {
    newRegistration.registrationStatus = true;
    store
      .dispatch("registration/saveRegistration", newRegistration)
      .then((result) => {
        toast.success("Registration successful!");
        router.push({
          name: "event-register-success",
          params: {
            clubId: route.params.clubId,
            eventId: route.params.eventId,
          },
          query: {
            registration_id: registration.value?.id,
            uuid: registration.value?.qrUuid,
          },
        });
      });
  } else {
    newRegistration.registrationStatus = false;
    const insertedRegistraion = await store.dispatch(
      "registration/saveRegistration",
      newRegistration,
    );

    if (!insertedRegistraion || !insertedRegistraion.id) return;

    const { clientSecret } = await store.dispatch(
      "registration/createCheckout",
      {
        clubId: route.params.clubId,
        eventId: route.params.eventId,
        registrationId: insertedRegistraion.id,
        uuid: insertedRegistraion.qrUuid,
      },
    );
    showCheckout.value = true;
    await nextTick();

    if (!checkout.value) {
      checkout.value = await stripe.initEmbeddedCheckout({
        clientSecret,
      });
      // Mount Checkout
      checkout.value.mount("#checkout");
    } else {
      console.warn("Checkout already mounted. Ignoring.");
    }
  }
};
let checkout = ref(null);
const handleUpdatePhone = ({ formattedPhone }) => {
  newRegistration.registrationData.phone = formattedPhone;
};

const formQuestions = computed(() => store.state.form.formQuestions);
const additionalAnswers = ref([]);
const handleUpdateAdditionalAnswers = ({ newVal }) => {
  additionalAnswers.value = newVal;
};

let stripe = null;
const showCheckout = ref(false);
const isEventFree = computed(() => event.value?.ticketPrice == 0);

const mustLoadStripePublic = computed(() => stripePublic);

onMounted(async () => {
  await store.dispatch("event/setEvent", {
    eventId: route.params.eventId,
  });
  await store.dispatch("form/setFormQuestions", {
    eventId: route.params.eventId,
  });
  if (!isEventFree.value) {
    stripe = await loadStripe(mustLoadStripePublic.value);
  }
});

onUnmounted(() => {
  if (checkout.value) {
    checkout.value.destroy();
  }
  // checkout = null;
});
</script>
<template>
  <v-row align="center" justify="center">
    <v-col cols="12" md="5" sm="6">
      <v-card
        class="mx-auto rounded-xl bg-transparent"
        color=""
        elevation="0"
        max-width="500"
        variant="flat"
      >
        <v-card-text>
          <v-card-title v-if="event" class="text-center text-wrap mt-2 mt-md-5">
            {{ event.name }}
          </v-card-title>
          <v-card-subtitle class="text-center mb-4 mb-md-8"
            >Registration Form
          </v-card-subtitle>
          <v-form
            v-if="!showCheckout"
            ref="form"
            v-model="isFormValid"
            fast-fail
            @submit.prevent="registerUser"
          >
            <!-- Full Name -->
            <v-text-field
              v-model="newRegistration.registrationData.name"
              :density="xs ? 'comfortable' : 'default'"
              :rules="[
                (v) => !!v || 'required!',
                (v) => (v && v.length <= 50) || 'Must not exceed 50 characters',
              ]"
              class="mt-2 mt-md-4 input-color-primary"
              clearable
              color="tertiary"
              hide-details="auto"
              rounded="lg"
              variant="solo-filled"
            >
              <template v-slot:label>
                <div>
                  <span>Full Name</span>
                  <span class="text-error"> *</span>
                </div>
              </template>
            </v-text-field>

            <v-text-field
              v-model="newRegistration.registrationData.email"
              :density="xs ? 'comfortable' : 'default'"
              :rules="[
                (v) => !!v || 'required!',
                (v) => isValidEmail(v) || 'Invalid Email',
              ]"
              class="mt-2 mt-md-4 input-color-primary"
              clearable
              color="tertiary"
              hide-details="auto"
              rounded="lg"
              variant="solo-filled"
            >
              <template v-slot:label>
                <div>
                  <span>E-mail</span>
                  <span class="text-error"> *</span>
                </div>
              </template>
            </v-text-field>

            <phone
              :density="xs ? 'comfortable' : 'default'"
              :input-item="{
                text: 'Phone',
                required: true,
                options: getCountryList('all'),
              }"
              custom-class="mt-2 mt-md-4 input-color-primary"
              rounded="lg"
              variant="solo-filled"
              @update-phone="handleUpdatePhone"
            ></phone>

            <!--              add form questions-->
            <div
              v-if="
                formQuestions && formQuestions.length > 0 && formQuestions[0]
              "
            >
              <form-items
                :items="formQuestions"
                type="question"
                @update="handleUpdateAdditionalAnswers"
              />
            </div>

            <!--              <div class="pb-1 pb-md-3 pl-1 mt-3 mt-md-7 my-1">-->
            <!--                *Registrandoti accetti i-->
            <!--                <router-link-->
            <!--                  :to="{ name: 'page-info', params: { type: 'terms' } }"-->
            <!--                  >Termini e condizioni-->
            <!--                </router-link>-->
            <!--                ,-->
            <!--                <router-link-->
            <!--                  :to="{-->
            <!--                    name: 'page-info',-->
            <!--                    params: { type: 'privacy-policy' },-->
            <!--                  }"-->
            <!--                  >l'Informativa sulla privacy-->
            <!--                </router-link>-->
            <!--                &-->
            <!--                <router-link-->
            <!--                  :to="{ name: 'page-info', params: { type: 'cookie-policy' } }"-->
            <!--                  >l'Informativa sui cookie-->
            <!--                </router-link>-->
            <!--              </div>-->

            <!-- Register Button -->
            <v-btn
              :density="xs ? 'comfortable' : 'default'"
              block
              class="mt-3 mt-md-7"
              color="primary"
              rounded="lg"
              size="x-large"
              @click="registerUser"
              >{{ isEventFree ? "Register" : "Proceed" }}
            </v-btn>
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
          </v-form>
          <div v-else id="checkout"></div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style></style>
