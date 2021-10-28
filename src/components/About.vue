<template>
  <div class="modal fade" tabindex="-1" id="About">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body">
          <img
            @dblclick="showDebugOptions = !showDebugOptions"
            src="vox-face.svg"
            alt=""
            class="rounded mx-auto d-block"
          />
          <h2 class="text-center">Vox-Face</h2>

          <p class="fst-normal text-center">
            AR web app for making voxel faces
          </p>

          <p class="text-center">
            <a
              href="https://github.com/ClarkThyLord/Vox-Face"
              class="text-decoration-none"
            >
              GitHub
            </a>
          </p>

          <div v-if="showDebugOptions" class="container debugOptions">
            <div class="row row-cols-2 justify-content-center mx-5">
              <div class="form-check form-switch">
                <input
                  type="checkbox"
                  role="switch"
                  v-model="debugOptions.drawBoxes"
                  class="form-check-input"
                  id="drawBoxes"
                />
                <label class="form-check-label" for="drawBoxes">
                  Draw Boxes
                </label>
              </div>
              <div class="form-check form-switch">
                <input
                  type="checkbox"
                  role="switch"
                  v-model="debugOptions.drawPoints"
                  class="form-check-input"
                  id="drawPoints"
                />
                <label class="form-check-label" for="drawPoints">
                  Draw Points
                </label>
              </div>
              <div class="form-check form-switch">
                <input
                  type="checkbox"
                  role="switch"
                  v-model="debugOptions.drawPolygons"
                  class="form-check-input"
                  id="drawPolygons"
                />
                <label class="form-check-label" for="drawPolygons">
                  Draw Polygons
                </label>
              </div>
              <div class="form-check form-switch">
                <input
                  type="checkbox"
                  role="switch"
                  v-model="debugOptions.drawGaze"
                  class="form-check-input"
                  id="drawGaze"
                />
                <label class="form-check-label" for="drawGaze">
                  Draw Gaze
                </label>
              </div>
              <div class="form-check form-switch">
                <input
                  type="checkbox"
                  role="switch"
                  v-model="debugOptions.drawSegmentation"
                  class="form-check-input"
                  id="drawSegmentation"
                />
                <label class="form-check-label" for="drawSegmentation">
                  Draw Segmentation
                </label>
              </div>

              <button
                @click="reset"
                type="button"
                class="m-auto btn btn-primary btn-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="d-grid gap-2 col-6 mx-auto">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "About",
  data() {
    return {
      _modal: undefined,
      _showDebugOptions:
        window.Cookies.get("showDebugOptions") === "true" ? true : false,
      debugOptions: window.debugOptions,
    };
  },
  computed: {
    showDebugOptions: {
      get() {
        return this.$data._showDebugOptions;
      },
      set(value) {
        Cookies.set("showDebugOptions", value);
        this.$data._showDebugOptions = value;
      },
    },
  },
  mounted() {
    this._modal = new window.Bootstrap.Modal(document.getElementById("About"));
  },
  methods: {
    show() {
      if (this._modal) this._modal.show();
    },
    hide() {
      if (this._modal) this._modal.hide();
    },
    reset() {
      Object.keys(window.Cookies.get()).forEach(function (cookieName) {
        Cookies.remove(cookieName);
      });
    },
  },
};
</script>