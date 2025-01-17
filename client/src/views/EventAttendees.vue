<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import PageTitle from "@/components/PageTitle.vue";
import { formatDateTime, padStr } from "@/others/util";
import { useDisplay } from "vuetify";
import RemoveEntity from "@/components/RemoveEntity.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();
const { xs } = useDisplay();

const event = computed(() =>
  store.getters["event/getEventById"](route.params.eventId),
);
const attendees = computed(() =>
  store.state.registration.attendees.map((item) => ({
    ...item,
    registrationData:
      typeof item.registrationData === "string"
        ? JSON.parse(item.registrationData)
        : item.registrationData,
  })),
);
const editingAttendee = reactive({});
const attendeeDetailsDialog = ref(false);

const openAtendeeDetailsDialog = (registrationId) => {
  const attendee = attendees.value.find((item) => item.rId == registrationId);
  Object.assign(editingAttendee, { ...attendee });
  editingAttendee.checkinStatus = attendee.checkinStatus
    ? checkinItems[1]
    : checkinItems[0];
  attendeeDetailsDialog.value = !attendeeDetailsDialog.value;
};

const updateAttendee = (registrationId) => {
  const attendee = attendees.value.find((item) => item.rId == registrationId);
  if (attendee.checkinStatus == editingAttendee.checkinStatus) return;

  store
    .dispatch("checkin/updateCheckinStatus", {
      editingAttendee,
      eventId: route.params.eventId,
    })
    .finally(() => {
      attendeeDetailsDialog.value = !attendeeDetailsDialog.value;
    });
};

const checkinItems = [
  { title: "Pending", value: false },
  { title: "Checked-in", value: true },
];

const searchKeyword = ref(null);

const handleSearchAttendee = () => {
  store.dispatch("registration/searchAttendees", {
    searchKeyword: searchKeyword.value,
    eventId: route.params.eventId,
  });
};

const handleDownloadAttendees = () => {
  store.dispatch("registration/downloadAttendees", {
    eventId: route.params.eventId,
  });
};

const sendTicket = (registrationId) => {
  store.dispatch("registration/sendTicket", {
    registrationId,
    eventId: route.params.eventId,
  });
};

const removeRegistration = (registrationId) => {
  store.dispatch("registration/removeRegistration", {
    registrationId,
    eventId: route.params.eventId,
  });
};

const viewQr = (registration) => {
  router.push({
    name: "qr-viewer",
    params: { registrationId: registration.rId, qrUuid: registration.qrUuid },
  });
};

const sortByCheckin = () => {
  store.dispatch("registration/setAttendees", {
    eventId: route.params.eventId,
    sortBy: "checkin",
  });
};

const fetchData = () => {
  store.dispatch("registration/setAttendees", {
    eventId: route.params.eventId,
    sortBy: "registration",
  });
};
onMounted(() => {
  fetchData();
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <page-title
          :sub-title="event?.name"
          justify="space-between"
          title="Attendee List"
        >
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            @click="$router.back()"
          ></v-btn>
        </page-title>
      </v-col>
    </v-row>

    <div class="d-flex align-center justify-end my-2 my-md-4">
      <v-text-field
        v-model="searchKeyword"
        append-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        label="Search by name/email/phone"
        single-line
        variant="solo"
        @keydown.enter="handleSearchAttendee"
        @click:append-inner="handleSearchAttendee"
      ></v-text-field>
      <!--            download btn for mobile-->
      <v-btn
        v-if="xs"
        class="ml-2"
        color="primary"
        icon="mdi-download"
        rounded
        variant="tonal"
        @click="handleDownloadAttendees"
      ></v-btn>
      <!--            download btn for desktop-->
      <v-btn
        v-else
        class="ml-2"
        color="primary"
        prepend-icon="mdi-download"
        @click="handleDownloadAttendees"
        >Download
      </v-btn>
    </div>

    <v-row v-if="attendees.length > 0">
      <v-col>
        <v-table density="comfortable" hover>
          <thead>
            <tr>
              <th class="text-start">ID</th>
              <th class="text-start">Name</th>
              <th v-if="!xs" class="text-start">Phone</th>
              <th
                v-if="!xs"
                class="text-start v-label--clickable"
                @click="fetchData"
              >
                Registration Time
              </th>
              <th class="text-start v-label--clickable" @click="sortByCheckin">
                Check-in Status
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in attendees"
              :key="'r-' + index"
              class="clickable"
              @click="openAtendeeDetailsDialog(item.rId)"
            >
              <td>{{ padStr(item.rId, 5) }}</td>
              <td>{{ item.registrationData?.name }}</td>
              <td v-if="!xs">{{ item.registrationData?.phone }}</td>
              <td v-if="!xs">{{ formatDateTime(item.registrationTime) }}</td>
              <td class="text-capitalize">
                <v-chip
                  :color="!item.checkinStatus ? 'yellow' : 'success'"
                  variant="flat"
                  >{{
                    !item.checkinStatus
                      ? checkinItems[0].title
                      : checkinItems[1].title
                  }}
                </v-chip>
              </td>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    class="ml-5"
                    icon="mdi-dots-vertical"
                    v-bind="props"
                    variant="text"
                  >
                  </v-btn>
                </template>
                <v-list density="comfortable">
                  <v-list-item
                    density="compact"
                    prepend-icon="mdi-email-fast"
                    title="Send Ticket"
                    @click="sendTicket(item.rId)"
                  ></v-list-item>
                  <v-list-item
                    density="compact"
                    prepend-icon="mdi-eye"
                    title="View QR Code"
                    @click="viewQr(item)"
                  ></v-list-item>
                  <v-divider></v-divider>
                  <remove-entity
                    custom-class="text-error"
                    label="Delete"
                    prepend-icon="mdi-delete"
                    variant="list"
                    @remove-entity="removeRegistration(item.rId)"
                  ></remove-entity>
                </v-list>
              </v-menu>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col>
        <v-alert border="start" closable density="compact"
          >No Users found!
        </v-alert>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="attendeeDetailsDialog" width="500">
    <v-card>
      <v-card-title> Attendee Details</v-card-title>
      <v-card-text>
        <v-table density="compact">
          <tbody>
            <tr>
              <td class="rowTitle">Name</td>
              <td>
                {{ editingAttendee.registrationData?.name }}
              </td>
            </tr>
            <tr>
              <td class="rowTitle">Email</td>
              <td>
                {{ editingAttendee.registrationData?.email }}
              </td>
            </tr>
            <tr>
              <td class="rowTitle">Phone</td>
              <td>
                {{ editingAttendee.registrationData?.phone }}
              </td>
            </tr>
            <tr>
              <td class="rowTitle">Registration Time</td>
              <td>
                {{ formatDateTime(editingAttendee.registrationTime) }}
              </td>
            </tr>
            <tr>
              <td class="rowTitle">Checkin Time</td>
              <td>
                {{
                  editingAttendee.checkinTime
                    ? formatDateTime(editingAttendee.checkinTime)
                    : checkinItems[0].title
                }}
              </td>
            </tr>
            <tr>
              <td class="rowTitle">Checkin Status</td>
              <td class="text-capitalize">
                <v-select
                  v-model="editingAttendee.checkinStatus"
                  :items="checkinItems"
                  class="text-capitalize"
                  density="compact"
                  hide-details="auto"
                  item-title="title"
                  item-value="value"
                ></v-select>
              </td>
            </tr>
            <template v-for="item in editingAttendee.registrationData?.others">
              <tr>
                <td class="rowTitle">{{ item.question }}</td>
                <td>
                  {{ item.answer }}
                </td>
              </tr>
            </template>
          </tbody>
        </v-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="flat"
          color="error"
          @click="attendeeDetailsDialog = false"
          >Close
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          @click="updateAttendee(editingAttendee.rId)"
          >Update
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.rowTitle {
  width: 152px;
}
</style>
