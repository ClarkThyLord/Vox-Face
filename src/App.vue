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
    <canvas id="debugCanvas"></canvas>
  </main>
</template>

<script>
import About from "/src/components/About.vue";

import Human from "@vladmandic/human/dist/human.esm";
window.human = new Human({
  backend: "webgl",
  modelBasePath: "models/",
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
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
  Vector3,
} from "three";

import FaceGeometry from "./js/FaceGeometry";

export default {
  name: "App",
  components: {
    About,
  },
  data() {
    return {
      showModel: true,
      showRender: true,
      showWireframe: true,
    };
  },
  mounted() {
    if (window.Cookies.get("seenAbout") === undefined) {
      this.showAbout();
      Cookies.set("seenAbout", true, { expires: 7 });
    }

    window.mainCanvas = document.getElementById("mainCanvas");

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: window.mainCanvas,
    });
    renderer.outputEncoding = sRGBEncoding;

    const camera = new OrthographicCamera();

    const scene = new Scene();
    const faceMesh = new Mesh(
      new FaceGeometry(human.faceTriangulation),
      new MeshBasicMaterial({
        color: 0xffaaaa,
        wireframe: true,
      })
    );
    scene.add(faceMesh);

    const geometry = new BoxGeometry(50, 50, 50);
    const material = new MeshBasicMaterial({ color: 0xffff00 });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    console.debug(mesh);

    const isLive = (input) =>
      input.srcObject &&
      input.srcObject.getVideoTracks()[0].readyState === "live" &&
      input.readyState > 2 &&
      !input.paused;

    const updateSize = () => {
      camera.left = -window.innerWidth / 2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = -window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    (async () => {
      window.addEventListener("unhandledrejection", (evt) => {
        console.error(evt.reason || evt);
        evt.preventDefault();
      });

      await human.load();

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
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream) window.cameraFeed.srcObject = stream;
      else return null;

      const video = await new Promise((resolve) => {
        window.cameraFeed.onloadeddata = async () => {
          window.cameraFeed.play();
          resolve(window.cameraFeed);
        };
      });

      if (video) {
        camera.near = -100;
        camera.far = 100;

        updateSize();
        window.addEventListener("resize", updateSize);

        const render = async (input) => {
          if (isLive(input)) {
            const res = await human.detect(input);
            if (res?.face?.length > 0) {
              const interpolated = human.next(res);
              const face = res.face[0];

              let center = face?.boxRaw;
              if (Array.isArray(center) && center?.length > 0) {
                // mesh.position.x = -(center[0] * window.innerWidth) / 2;
                // mesh.position.y = -center[1] * window.innerHeight;
                // console.debug(mesh.position);
              }

              let debugCanvas = document.getElementById("debugCanvas");
              debugCanvas.width = input.videoWidth;
              debugCanvas.height = input.videoHeight;
              human.draw.face(debugCanvas, res.face);

              mesh.rotation.set(
                face.rotation?.angle?.pitch || 0.0,
                face.rotation?.angle?.yaw || 0.0,
                face.rotation?.angle?.roll || 0.0,
                "XYZ"
              );

              faceMesh.visible = this.showWireframe;
              if (this.showWireframe) {
                faceMesh.geometry.update(
                  input.videoWidth,
                  input.videoHeight,
                  face
                );
                faceMesh.geometry.computeBoundingBox();
                let center = faceMesh.geometry.boundingBox.getCenter(
                  new Vector3()
                );
                mesh.position.copy(center);
                console.debug(center);
              }
            } else {
              faceMesh.visible = false;
            }
            renderer.render(scene, camera);
          }
          requestAnimationFrame(() => render(input));
        };
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
  transform: translate(-50%, 0);
}

#mainCanvas {
  z-index: 1;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  transform: rotateY(180deg);
}

#debugCanvas {
  z-index: 2;
  left: 50%;
  position: absolute;
  min-height: 100%;
  min-width: 100%;
  transform: translate(-50%, 0);
}
</style>
