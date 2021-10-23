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
    <label class="btn btn-outline-primary" for="btncheck2">Debug</label>
  </div>

  <canvas id="jeeFaceFilterCanvas"></canvas>
  <canvas :class="{ 'd-none': !showModel }" id="threeCanvas"></canvas>

  <canvas :class="{ 'd-none': !showDebug }" id="debugCanvas"></canvas>

  <a href="https://github.com/ClarkThyLord/Vox-Face">
    <img src="../public/vox-face.svg" alt="Vox-Face" class="vf-icon" />
  </a>
</template>

<script>
import "../public/libs/js/jeelizFaceFilter";
import JeelizThreeHelper from "./helpers/JeelizThreeHelper";
import JeelizResizer from "./helpers/JeelizResizer";

import * as THREE from "three/build/three.module.js";
window.THREE = THREE;

import * as faceapi from "face-api.js";
window.faceapi = faceapi;
faceapi.loadTinyFaceDetectorModel("/neural_nets");
faceapi.loadFaceLandmarkTinyModel("/neural_nets");

export default {
  name: "App",
  data: () => {
    return {
      showModel: true,
      showDebug: true,
    };
  },
  mounted: () => {
    let THREECAMERA = null;

    JeelizResizer.size_canvas({
      canvasId: "jeeFaceFilterCanvas",
      callback: (isError, bestVideoSettings) => {
        JEELIZFACEFILTER.init({
          antialias: false,
          canvasId: "jeeFaceFilterCanvas",
          NNCPath: "neural_nets/",
          maxFacesDetected: 1,
          videoSettings: bestVideoSettings,
          callbackReady: (errCode, spec) => {
            if (errCode) {
              console.log("AN ERROR HAPPENS. ERR =", errCode);
              return;
            }

            console.log("INFO: JEELIZFACEFILTER IS READY");

            window.gl = spec.GL;
            window.texture = spec.videoTexture;

            window.debugCanvas = document.getElementById("debugCanvas");
            window.debugContext = debugCanvas.getContext("2d");
            window.debugContext.canvas.width = window.innerWidth;
            window.debugContext.canvas.height = window.innerHeight;

            spec.threeCanvasId = "threeCanvas";
            const threeStuffs = JeelizThreeHelper.init(
              spec,
              function (faceIndex, isDetected) {
                if (isDetected) {
                  console.log("INFO in detect_callback(): DETECTED");

                  let framebuffer = window.gl.createFramebuffer();
                  window.gl.bindFramebuffer(window.gl.FRAMEBUFFER, framebuffer);
                  window.gl.framebufferTexture2D(
                    window.gl.FRAMEBUFFER,
                    window.gl.COLOR_ATTACHMENT0,
                    window.gl.TEXTURE_2D,
                    texture,
                    0
                  );

                  let data = new Uint8Array(
                    window.gl.drawingBufferWidth *
                      window.gl.drawingBufferHeight *
                      4
                  );
                  window.gl.readPixels(
                    0,
                    0,
                    window.gl.drawingBufferWidth,
                    window.gl.drawingBufferHeight,
                    window.gl.RGBA,
                    window.gl.UNSIGNED_BYTE,
                    data
                  );

                  window.gl.deleteFramebuffer(framebuffer);

                  let imageData = window.debugContext.createImageData(
                    window.gl.drawingBufferWidth,
                    window.gl.drawingBufferHeight
                  );
                  imageData.data.set(data);
                  // window.debugContext.putImageData(imageData, 0, 0);

                  // faceapi
                  //   .detectSingleFace(
                  //     window.debugCanvas,
                  //     new faceapi.TinyFaceDetectorOptions()
                  //   )
                  //   .withFaceLandmarks(true)
                  //   .then(
                  //     (result) => {
                  //       console.log("FACE-API SUCCESS", result);

                  //       faceapi.draw.drawDetections(debugCanvas, result, {
                  //         withScore: true,
                  //       });
                  //       faceapi.draw.drawFaceLandmarks(debugCanvas, result);
                  //     },
                  //     (error) => {
                  //       console.log("FACE-API FAILED", error);
                  //     }
                  //   );

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

                  window.debugContext.putImageData(imageData, 0, 0);
                } else {
                  console.log("INFO in detect_callback(): LOST");
                }
              }
            );

            // CREATE A CUBE:
            const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
            const cubeMaterial = new THREE.MeshNormalMaterial();
            const threeCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            threeCube.frustumCulled = false;
            threeStuffs.faceObject.add(threeCube);

            // CREATE THE CAMERA:
            THREECAMERA = JeelizThreeHelper.create_camera();

            window.addEventListener("resize", () => {
              window.gl.canvas.width = window.innerWidth;
              window.gl.canvas.height = window.innerHeight;

              THREECAMERA.aspect = window.innerWidth / window.innerHeight;
              THREECAMERA.updateProjectionMatrix();

              threeStuffs.renderer.setSize(
                window.innerWidth,
                window.innerHeight
              );
              JEELIZFACEFILTER.resize();

              window.debugContext.canvas.width = window.innerWidth;
              window.debugContext.canvas.height = window.innerHeight;
            });
          },
          callbackTrack: (detectState) => {
            JeelizThreeHelper.render(detectState, THREECAMERA);
          },
        });
      },
    });
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

#jeeFaceFilterCanvas {
  z-index: 0;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  transform: rotateY(180deg);
}

#threeCanvas {
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
  position: absolute;
  right: 0px;
  top: 0px;
  max-height: 25%;
  transform: rotateY(180deg);
}
</style>
