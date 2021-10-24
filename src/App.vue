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

  <main>
    <video id="cameraFeed"></video>
    <canvas id="mainCanvas"></canvas>
  </main>
</template>

<script>
import About from "/src/components/About.vue";

import Human from "@vladmandic/human/dist/human.esm";
window.human = new Human({
  modelBasePath: "models/",
  backend: "webgl",
  face: {
    enabled: true,
    detector: { rotation: true, maxDetected: 1 },
    mesh: { enabled: true },
    iris: { enabled: true },
    description: { enabled: false },
    emotion: { enabled: false },
  },
  hand: { enabled: false },
  body: { enabled: false },
  object: { enabled: false },
  filter: { enabled: false },
  gesture: { enabled: false },
});

import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  sRGBEncoding,
  VideoTexture,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
} from "three";

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
    if (window.Cookies.get("seenAbout") === undefined) {
      this.showAbout();
      Cookies.set("seenAbout", true, { expires: 7 });
    }

    const wireframe = false;

    window.mainCanvas = document.getElementById("mainCanvas");
    let width = 0;
    let height = 0;

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: window.mainCanvas,
    });
    renderer.outputEncoding = sRGBEncoding;

    const camera = new OrthographicCamera();

    const materialWireFrame = new MeshBasicMaterial({
      color: 0xffaaaa,
      wireframe: true,
    });
    const materialFace = new MeshBasicMaterial({
      color: 0xffffff,
      side: DoubleSide,
      map: null,
    });

    class FaceGeometry extends BufferGeometry {
      constructor(triangulation) {
        super();
        this.positions = new Float32Array(478 * 3);
        this.uvs = new Float32Array(478 * 2);
        this.setAttribute("position", new BufferAttribute(this.positions, 3));
        this.setAttribute("uv", new BufferAttribute(this.uvs, 2));
        this.setIndex(triangulation);
      }

      update(face) {
        let ptr = 0;
        for (const p of face.mesh) {
          this.positions[ptr + 0] = -p[0] + width / 2;
          this.positions[ptr + 1] = height - p[1] - height / 2;
          this.positions[ptr + 2] = -p[2];
          ptr += 3;
        }
        ptr = 0;
        for (const p of face.meshRaw) {
          this.uvs[ptr + 0] = 0 + p[0];
          this.uvs[ptr + 1] = 1 - p[1];
          ptr += 2;
        }
        materialFace.map.update();
        this.attributes.position.needsUpdate = true;
        this.attributes.uv.needsUpdate = true;
        this.computeVertexNormals();
      }
    }

    const scene = new Scene();
    const faceGeometry = new FaceGeometry(human.faceTriangulation);
    const mesh = new Mesh(faceGeometry, materialFace);
    scene.add(mesh);

    function updateSize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    const isLive = (input) =>
      input.srcObject &&
      input.srcObject.getVideoTracks()[0].readyState === "live" &&
      input.readyState > 2 &&
      !input.paused;

    async function render(input) {
      if (isLive(input)) {
        if (width !== input.videoWidth || height !== input.videoHeight) {
          width = input.videoWidth;
          height = input.videoHeight;
          camera.left = -width / 2;
          camera.right = width / 2;
          camera.top = height / 2;
          camera.bottom = -height / 2;
          camera.near = -100;
          camera.far = 100;
          // camera.zoom = 2;
          updateSize();
        }

        const res = await human.detect(input);
        if (res?.face?.length > 0) {
          faceGeometry.update(res.face[0]);
          mesh.material = materialFace;
          renderer.autoClear = true;
          renderer.render(scene, camera);

          if (wireframe) {
            mesh.material = materialWireFrame;
            renderer.autoClear = false;
            renderer.render(scene, camera);
          }
        }
      }
      requestAnimationFrame(() => render(input));
    }

    async function setupCameraFeed() {
      if (!navigator.mediaDevices) return null;

      window.cameraFeed = document.getElementById("cameraFeed");
      window.mainCanvas.addEventListener("click", () => {
        if (isLive(window.cameraFeed)) window.cameraFeed.pause();
        else window.cameraFeed.play();
      });
      const constraints = {
        audio: false,
        video: {
          facingMode: "user",
          resizeMode: "crop-and-scale",
          width: { ideal: 1920 },
          aspectRatio: 1920 / 1080,
        },
      };
      // if (window.innerWidth > window.innerHeight)
      //   constraints.video.width = { ideal: window.innerWidth };
      // else constraints.video.height = { ideal: window.innerHeight };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream) window.cameraFeed.srcObject = stream;
      else return null;

      return new Promise((resolve) => {
        window.cameraFeed.onloadeddata = async () => {
          window.cameraFeed.play();
          resolve(window.cameraFeed);
        };
      });
    }

    (async function main() {
      window.addEventListener("unhandledrejection", (evt) => {
        console.error(evt.reason || evt);
        evt.preventDefault();
      });

      await human.load();
      const video = await setupCameraFeed();
      if (video) {
        updateSize();
        window.addEventListener("resize", updateSize);

        const videoTexture = new VideoTexture(video);
        videoTexture.encoding = sRGBEncoding;
        materialFace.map = videoTexture;

        render(video);
      }
    })();
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
html,
body,
#app {
  widows: 100%;
  height: 100%;
  overflow: hidden;
}

.options {
  z-index: 10;
  position: absolute;
  top: 12px;
  left: 12px;
}

.vf-icon {
  z-index: 10000;
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 64px;
  height: 64px;
}

main {
  z-index: 0;
  position: absolute;
  top: 0;
  min-height: 100%;
  min-width: 100%;
}

#cameraFeed {
  z-index: 0;
  left: 50%;
  position: absolute;
  min-height: 100%;
  min-width: 100%;
  transform: translate(-50%, 0) rotateY(180deg);
}

#mainCanvas {
  z-index: 1;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
}
</style>
