<script setup>
import { useDisplay } from "vuetify";
import { appInfo } from "@/others/util";

const { xs } = useDisplay();
const { imgSrc, title, imgClass, containerClass, maxWidth, width } =
  defineProps([
    "imgSrc",
    "title",
    "imgClass",
    "containerClass",
    "maxWidth",
    "width",
  ]);
</script>

<template>
  <div :class="`d-flex justify-center align-center ${containerClass}`">
    <v-img
      v-if="imgSrc"
      :class="` ${imgClass}`"
      :max-width="maxWidth"
      :src="imgSrc"
      :width="width"
    ></v-img>

    <div v-if="title" :class="{ 'pl-2': imgSrc }">
      <component :is="xs ? 'h3' : 'h2'">
        <span class="text-primary">{{ title }}</span>
      </component>
    </div>
  </div>
</template>

<style scoped></style>
