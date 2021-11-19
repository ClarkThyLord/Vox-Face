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
  OrthographicCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
  FogExp2,
} from "three";

import FaceGeometry from "./js/FaceGeometry";

export default {
  name: "App",
  components: {
    About,
  },
  data() {
    return {
      _showModel: window.Cookies.get("showModel") === "false" ? false : true,
      _debugMode: window.Cookies.get("debugMode") === "true" ? true : false,
    };
  },
  computed: {
    showModel: {
      get() {
        return this.$data._showModel;
      },
      set(value) {
        Cookies.set("showModel", value);
        this.$data._showModel = value;
      },
    },
    debugMode: {
      get() {
        return this.$data._debugMode;
      },
      set(value) {
        Cookies.set("debugMode", value);
        this.$data._debugMode = value;
      },
    },
  },
  methods: {
    showAbout() {
      this.$refs.about.show();
    },
    hideAbout() {
      this.$refs.about.hide();
    },
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
    window.threeScene.fog = new FogExp2(0xefd1b5, 0.0025);

    const faceMesh = new Mesh(
      new FaceGeometry(human.faceTriangulation),
      new MeshBasicMaterial({
        color: 0xffaaaa,
        wireframe: true,
      })
    );
    faceMesh.visible = false;
    window.threeScene.add(faceMesh);

    window.voxFaceMesh = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: "yellow" })
    );
    window.voxFaceMesh.visible = false;
    window.threeScene.add(window.voxFaceMesh);

    const browLeft = new Mesh(
      new BoxGeometry(0.25, 0.05, 0.25),
      new MeshBasicMaterial({ color: "brown" })
    );
    browLeft.position.x = -0.25;
    browLeft.position.y = 0.425;
    browLeft.position.z = 0.5;
    window.voxFaceMesh.add(browLeft);

    const browRight = new Mesh(
      new BoxGeometry(0.25, 0.05, 0.25),
      new MeshBasicMaterial({ color: "brown" })
    );
    browRight.position.x = 0.25;
    browRight.position.y = 0.425;
    browRight.position.z = 0.5;
    window.voxFaceMesh.add(browRight);

    const eyeLeft = new Mesh(
      new BoxGeometry(0.25, 0.25, 0.25),
      new MeshBasicMaterial({ color: "red" })
    );
    eyeLeft.position.x = -0.25;
    eyeLeft.position.y = 0.25;
    eyeLeft.position.z = 0.5;
    window.voxFaceMesh.add(eyeLeft);

    const eyeRight = new Mesh(
      new BoxGeometry(0.25, 0.25, 0.25),
      new MeshBasicMaterial({ color: "red" })
    );
    eyeRight.position.x = 0.25;
    eyeRight.position.y = 0.25;
    eyeRight.position.z = 0.5;
    window.voxFaceMesh.add(eyeRight);

    const mouth = new Mesh(
      new BoxGeometry(0.35, 0.2, 0.25),
      new MeshBasicMaterial({ color: "green" })
    );
    mouth.position.x = 0.0;
    mouth.position.y = -0.15;
    mouth.position.z = 0.5;
    window.voxFaceMesh.add(mouth);

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

              faceMesh.geometry.boundingBox.getCenter(
                window.voxFaceMesh.position
              );
              window.voxFaceMesh.rotation.set(
                face.rotation?.angle?.pitch || 0.0,
                face.rotation?.angle?.yaw || 0.0,
                face.rotation?.angle?.roll || 0.0,
                "XYZ"
              );
              faceMesh.geometry.boundingBox.getSize(window.voxFaceMesh.scale);
              window.voxFaceMesh.scale.y *= 1.25;
              window.voxFaceMesh.scale.x = window.voxFaceMesh.scale.y;
              window.voxFaceMesh.scale.z = window.voxFaceMesh.scale.y;

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

                const imageData = window.segmentationContext.getImageData(
                  0,
                  0,
                  window.segmentationCanvas.width,
                  window.segmentationCanvas.height
                );

                let skinRT = 0,
                  skinGT = 0,
                  skinBT = 0;

                let browLeftRT = 0,
                  browLeftGT = 0,
                  browLeftBT = 0,
                  browLeftX =
                    face.annotations.leftEyebrowUpper[3][0] - face.box[0],
                  browLeftY =
                    face.annotations.leftEyebrowUpper[3][1] - face.box[1];
                let browRightRT = 0,
                  browRightGT = 0,
                  browRightBT = 0,
                  browRightX =
                    face.annotations.rightEyebrowUpper[3][0] - face.box[0],
                  browRightY =
                    face.annotations.rightEyebrowUpper[3][1] - face.box[1];

                let eyeLeftRT = 0,
                  eyeLeftGT = 0,
                  eyeLeftBT = 0,
                  eyeLeftX = face.annotations.leftEyeIris[0][0] - face.box[0],
                  eyeLeftY = face.annotations.leftEyeIris[0][1] - face.box[1];
                let eyeRightRT = 0,
                  eyeRightGT = 0,
                  eyeRightBT = 0,
                  eyeRightX = face.annotations.rightEyeIris[0][0] - face.box[0],
                  eyeRightY = face.annotations.rightEyeIris[0][1] - face.box[1];

                let mouthRT = 0,
                  mouthGT = 0,
                  mouthBT = 0,
                  mouthX = face.annotations.noseTip[0][0] - face.box[0],
                  mouthY = face.annotations.noseTip[0][1] - face.box[1] + 50;

                for (let i = 0; i < imageData.data.length; i += 4) {
                  const x = Math.floor((i / 4) % face.box[2]);
                  const y = Math.floor(i / 4 / face.box[2]);

                  const red = imageData.data[i];
                  const green = imageData.data[i + 1];
                  const blue = imageData.data[i + 2];
                  const alpha = imageData.data[i + 3];

                  const delta = 128;
                  const Y = 0.299 * red + 0.587 * green + 0.114 * blue;
                  const Cr = (red - Y) * 0.713 + delta;
                  const Cb = (blue - Y) * 0.564 + delta;

                  // SKIN
                  const isSkin =
                    Y >= 0.0 &&
                    Y <= 235.0 &&
                    Cr >= 133.0 &&
                    Cr <= 173.0 &&
                    Cb >= 77.0 &&
                    Cb <= 127.0;
                  if (isSkin) {
                    skinRT += red;
                    skinGT += green;
                    skinBT += blue;

                    imageData.data[i] = 255;
                    imageData.data[i + 1] = 0;
                    imageData.data[i + 2] = 0;
                  }

                  // BROW LEFT
                  if (
                    x > browLeftX - 40 &&
                    x < browLeftX + 40 &&
                    y > browLeftY - 15 &&
                    y < browLeftY + 15 &&
                    !isSkin
                  ) {
                    browLeftRT += red;
                    browLeftGT += green;
                    browLeftBT += blue;

                    imageData.data[i] = 165;
                    imageData.data[i + 1] = 42;
                    imageData.data[i + 2] = 42;
                  }

                  // BROW RIGHT
                  if (
                    x > browRightX - 40 &&
                    x < browRightX + 40 &&
                    y > browRightY - 15 &&
                    y < browRightY + 15 &&
                    !isSkin
                  ) {
                    browRightRT += red;
                    browRightGT += green;
                    browRightBT += blue;

                    imageData.data[i] = 165;
                    imageData.data[i + 1] = 42;
                    imageData.data[i + 2] = 42;
                  }

                  // EYE LEFT
                  if (
                    x > eyeLeftX - 30 &&
                    x < eyeLeftX + 30 &&
                    y > eyeLeftY - 30 &&
                    y < eyeLeftY + 30 &&
                    !isSkin
                  ) {
                    eyeLeftRT += red;
                    eyeLeftGT += green;
                    eyeLeftBT += blue;

                    imageData.data[i] = 0;
                    imageData.data[i + 1] = 0;
                    imageData.data[i + 2] = 255;
                  }

                  // EYE RIGHT
                  if (
                    x > eyeRightX - 30 &&
                    x < eyeRightX + 30 &&
                    y > eyeRightY - 30 &&
                    y < eyeRightY + 30 &&
                    !isSkin
                  ) {
                    eyeRightRT += red;
                    eyeRightGT += green;
                    eyeRightBT += blue;

                    imageData.data[i] = 0;
                    imageData.data[i + 1] = 0;
                    imageData.data[i + 2] = 255;
                  }

                  // MOUTH
                  if (
                    x > mouthX - 60 &&
                    x < mouthX + 60 &&
                    y > mouthY - 40 &&
                    y < mouthY + 40 &&
                    !isSkin
                  ) {
                    mouthRT += red;
                    mouthGT += green;
                    mouthBT += blue;

                    imageData.data[i] = 0;
                    imageData.data[i + 1] = 255;
                    imageData.data[i + 2] = 0;
                  }
                }

                skinRT /= imageData.data.length / 4;
                skinGT /= imageData.data.length / 4;
                skinBT /= imageData.data.length / 4;

                browLeftRT /= imageData.data.length / 4;
                browLeftGT /= imageData.data.length / 4;
                browLeftBT /= imageData.data.length / 4;

                browRightRT /= imageData.data.length / 4;
                browRightGT /= imageData.data.length / 4;
                browRightBT /= imageData.data.length / 4;

                eyeLeftRT /= imageData.data.length / 4;
                eyeLeftGT /= imageData.data.length / 4;
                eyeLeftBT /= imageData.data.length / 4;

                eyeRightRT /= imageData.data.length / 4;
                eyeRightGT /= imageData.data.length / 4;
                eyeRightBT /= imageData.data.length / 4;

                mouthRT /= imageData.data.length / 4;
                mouthGT /= imageData.data.length / 4;
                mouthBT /= imageData.data.length / 4;

                window.voxFaceMesh.material.color.set(
                  "rgb(" +
                    Math.round(skinRT) +
                    ", " +
                    Math.round(skinGT) +
                    ", " +
                    Math.round(skinBT) +
                    ")"
                );

                browLeft.material.color.set(
                  "rgb(" +
                    Math.round(browLeftRT) +
                    ", " +
                    Math.round(browLeftGT) +
                    ", " +
                    Math.round(browLeftBT) +
                    ")"
                );
                browRight.material.color.set(
                  "rgb(" +
                    Math.round(browRightRT) +
                    ", " +
                    Math.round(browRightGT) +
                    ", " +
                    Math.round(browRightBT) +
                    ")"
                );

                eyeLeft.material.color.set(
                  "rgb(" +
                    Math.round(eyeLeftRT) +
                    ", " +
                    Math.round(eyeLeftGT) +
                    ", " +
                    Math.round(eyeLeftBT) +
                    ")"
                );
                eyeRight.material.color.set(
                  "rgb(" +
                    Math.round(eyeRightRT) +
                    ", " +
                    Math.round(eyeRightGT) +
                    ", " +
                    Math.round(eyeRightBT) +
                    ")"
                );

                mouth.material.color.set(
                  "rgb(" +
                    Math.round(mouthRT) +
                    ", " +
                    Math.round(mouthGT) +
                    ", " +
                    Math.round(mouthBT) +
                    ")"
                );

                window.segmentationContext.putImageData(imageData, 0, 0);
              }

              if (this.debugMode) {
                window.human.draw.options.drawBoxes =
                  window.debugOptions.drawBoxes;
                window.human.draw.options.drawPoints =
                  window.debugOptions.drawPoints;
                window.human.draw.options.drawPolygons =
                  window.debugOptions.drawPolygons;
                window.human.draw.options.drawGaze =
                  window.debugOptions.drawGaze;

                window.segmentationCanvas.style.display = window.debugOptions
                  .drawSegmentation
                  ? "block"
                  : "none";

                window.humanCanvas.width = input.videoWidth;
                window.humanCanvas.height = input.videoHeight;
                human.draw.face(window.humanCanvas, res.face);
              }

              rendered = true;
            }
          }

          window.voxFaceMesh.visible = rendered && this.showModel;

          window.threeRenderer.render(window.threeScene, window.threeCamera);
          requestAnimationFrame(() => render(input));
        };
        render(video);
      }
    })();
  },
};
</script>

<style>
html,
body,
#app,
main {
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
