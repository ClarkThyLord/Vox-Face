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
      v-model="debugMode"
      type="checkbox"
      class="btn-check"
      id="btncheck2"
    />
    <label class="btn btn-outline-primary" for="btncheck2">Debug</label>

    <button @click="showAbout" type="button" class="btn btn-outline-secondary">
      About
    </button>
  </div>

  <a href="https://github.com/ClarkThyLord/Vox-Face">
    <img src="../public/vox-face.svg" alt="Vox-Face" class="vf-icon" />
  </a>

  <About ref="about" />

  <main>
    <video id="cameraVideo"></video>
    <canvas id="threeCanvas"></canvas>
    <canvas :class="{ 'd-none': !debugMode }" id="humanCanvas"></canvas>
    <canvas :class="{ 'd-none': !debugMode }" id="segmentationCanvas"></canvas>
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
  MeshNormalMaterial,
  OrthographicCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
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
      debugMode: true,
    };
  },
  mounted() {
    if (window.Cookies.get("seenAbout") === undefined) {
      this.showAbout();
      Cookies.set("seenAbout", true, { expires: 7 });
    }

    window.threeCanvas = document.getElementById("threeCanvas");
    window.humanCanvas = document.getElementById("humanCanvas");
    window.segmentationCanvas = document.getElementById("segmentationCanvas");
    window.segmentationContext = window.segmentationCanvas.getContext("2d");

    window.threeRenderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: window.threeCanvas,
    });
    window.threeRenderer.outputEncoding = sRGBEncoding;

    window.threeCamera = new OrthographicCamera();
    window.threeCamera.near = -1000;
    window.threeCamera.far = 1000;

    window.threeScene = new Scene();

    const faceMesh = new Mesh(
      new FaceGeometry(human.faceTriangulation),
      new MeshBasicMaterial({
        color: 0xffaaaa,
        wireframe: true,
      })
    );
    faceMesh.visible = false;
    window.threeScene.add(faceMesh);

    const voxFaceMesh = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshNormalMaterial()
    );
    voxFaceMesh.visible = false;
    window.threeScene.add(voxFaceMesh);

    const isLive = (input) =>
      input.srcObject &&
      input.srcObject.getVideoTracks()[0].readyState === "live" &&
      input.readyState > 2 &&
      !input.paused;

    const updateSize = () => {
      window.threeCamera.left = -window.innerWidth / 2;
      window.threeCamera.right = window.innerWidth / 2;
      window.threeCamera.top = window.innerHeight / 2;
      window.threeCamera.bottom = -window.innerHeight / 2;

      window.threeCamera.aspect = window.innerWidth / window.innerHeight;
      window.threeCamera.updateProjectionMatrix();

      window.threeRenderer.setSize(window.innerWidth, window.innerHeight);
    };

    (async () => {
      window.addEventListener("unhandledrejection", (evt) => {
        console.error(evt.reason || evt);
        evt.preventDefault();
      });

      await human.load();

      if (!navigator.mediaDevices) return null;

      window.cameraVideo = document.getElementById("cameraVideo");
      window.threeCanvas.addEventListener("click", () => {
        if (isLive(window.cameraVideo)) window.cameraVideo.pause();
        else window.cameraVideo.play();
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
      if (stream) window.cameraVideo.srcObject = stream;
      else return null;

      const video = await new Promise((resolve) => {
        window.cameraVideo.onloadeddata = async () => {
          window.cameraVideo.play();
          resolve(window.cameraVideo);
        };
      });

      if (video) {
        updateSize();
        window.addEventListener("resize", updateSize);

        const render = async (input) => {
          let rendered = false;

          if (isLive(input)) {
            const res = await human.detect(input);
            if (res?.face?.length > 0) {
              const interpolated = human.next(res);
              const face = res.face[0];

              faceMesh.geometry.update(
                input.videoWidth,
                input.videoHeight,
                face
              );
              faceMesh.geometry.computeBoundingBox();

              faceMesh.geometry.boundingBox.getCenter(voxFaceMesh.position);
              voxFaceMesh.rotation.set(
                face.rotation?.angle?.pitch || 0.0,
                face.rotation?.angle?.yaw || 0.0,
                face.rotation?.angle?.roll || 0.0,
                "XYZ"
              );
              faceMesh.geometry.boundingBox.getSize(voxFaceMesh.scale);
              voxFaceMesh.scale.y *= 1.25;
              voxFaceMesh.scale.x = voxFaceMesh.scale.y;
              voxFaceMesh.scale.z = voxFaceMesh.scale.y;

              if (face.box[2] > 0 && face.box[3] > 0) {
                window.segmentationCanvas.width = face.box[2];
                window.segmentationCanvas.height = face.box[3];
                window.segmentationContext.drawImage(
                  cameraVideo,
                  face.box[0],
                  face.box[1],
                  face.box[2],
                  face.box[3],
                  0,
                  0,
                  window.segmentationCanvas.width,
                  window.segmentationCanvas.height
                );

                console.debug(
                  0,
                  0,
                  window.segmentationCanvas.width,
                  window.segmentationCanvas.height
                );

                const imageData = window.segmentationContext.getImageData(
                  0,
                  0,
                  window.segmentationCanvas.width,
                  window.segmentationCanvas.height
                );
                for (let i = 0; i < imageData.data.length; i += 4) {
                  const red = imageData.data[i];
                  const green = imageData.data[i + 1];
                  const blue = imageData.data[i + 2];
                  const alpha = imageData.data[i + 3];

                  const delta = 128;
                  const Y = 0.299 * red + 0.587 * green + 0.114 * blue;
                  const Cr = (red - Y) * 0.713 + delta;
                  const Cb = (blue - Y) * 0.564 + delta;
                  // imageData.data[i] = Y + 1.403 * (Cr - delta);
                  // imageData.data[i + 1] =
                  //   Y - 0.714 * (Cr - delta) - 0.344 * (Cb - delta);
                  // imageData.data[i + 2] = Y + 1.773 * (Cb - delta);

                  if (
                    Y >= 0.0 &&
                    Y <= 235.0 &&
                    Cr >= 133.0 &&
                    Cr <= 173.0 &&
                    Cb >= 77.0 &&
                    Cb <= 127.0
                  ) {
                    imageData.data[i] = 255;
                    imageData.data[i + 1] = 0;
                    imageData.data[i + 2] = 0;
                  }
                }
                window.segmentationContext.putImageData(imageData, 0, 0);
              }

              if (this.debugMode) {
                window.humanCanvas.width = input.videoWidth;
                window.humanCanvas.height = input.videoHeight;
                human.draw.face(window.humanCanvas, res.face);
              }

              rendered = true;
            }
          }

          voxFaceMesh.visible = rendered && this.showModel;

          window.threeRenderer.render(window.threeScene, window.threeCamera);
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

#cameraVideo {
  z-index: 1;
  left: 50%;
  position: absolute;
  min-height: 100%;
  min-width: 100%;
  transform: translate(-50%, 0);
}

#threeCanvas {
  z-index: 2;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  transform: rotateY(180deg);
}

#humanCanvas {
  z-index: 3;
  left: 50%;
  position: absolute;
  min-height: 100%;
  min-width: 100%;
  transform: translate(-50%, 0);
}

#segmentationCanvas {
  z-index: 4;
  position: absolute;
  right: 0px;
  top: 0px;
  width: 9%;
}
</style>
