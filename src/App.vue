<template>
  <div class="btn-group options">
    <input
      v-model="showModel"
      type="checkbox"
      class="btn-check"
      id="btncheck1"
    />
    <label class="btn btn-outline-primary" for="btncheck1">Model</label>

    <input
      v-model="showDebug"
      type="checkbox"
      class="btn-check"
      id="btncheck2"
    />
    <label class="btn btn-outline-primary" for="btncheck2">Render</label>

    <button @click="showAbout" type="button" class="btn btn-outline-secondary">
      About
    </button>
  </div>

  <a href="https://github.com/ClarkThyLord/Vox-Face">
    <img src="../public/vox-face.svg" alt="Vox-Face" class="vf-icon" />
  </a>

  <About ref="about" />
</template>

<script>
import About from "./components/About.vue";

import * as THREE from "three/build/three.module.js";
window.THREE = THREE;

export default {
  name: "App",
  components: {
    About,
  },
  data() {
    return {
      showModel: true,
      showRender: true,
    };
  },
  mounted() {
    this.showAbout();
  },
  methods: {
    showAbout() {
      this.$refs.about.show();
    },
    hideAbout() {
      this.$refs.about.hide();
    },
  },
};
</script>

<style>
.options {
  z-index: 10;
  position: absolute;
  top: 12px;
  left: 12px;
}

.vf-icon {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 64px;
  height: 64px;
  z-index: 10000;
}
</style>
