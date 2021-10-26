<template>
  <div class="modal fade" tabindex="-1" id="About">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body">
          <img src="vox-face.svg" alt="" class="rounded mx-auto d-block" />
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
    };
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
  },
};
</script>