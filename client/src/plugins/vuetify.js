/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {},
  theme: {
    defaultTheme: "dark",
    themes: {
      light: {
        colors: {
          primary: "#ff5555",
          secondary: "#6464d3",
          tertiary: "#c7d7ff",
        },
      },
      dark: {
        colors: {
          primary: "#2b2b3b",
          secondary: "#424262",
          tertiary: "#6464a1",
        },
      },
    },
  },
});
