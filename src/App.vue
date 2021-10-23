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

  <canvas :class="{ 'd-none': !showDebug }" id="faceCanvas"></canvas>
  <img :class="{ 'd-none': !showDebug }" alt="" id="faceImage" />

  <a href="https://github.com/ClarkThyLord/Vox-Face">
    <img src="../public/vox-face.svg" alt="Vox-Face" class="vf-icon" />
  </a>
</template>

<script>
import "../public/libs/js/jeelizFaceFilter";
import JeelizThreeHelper from "./helpers/JeelizThreeHelper";
import JeelizResizer from "./helpers/JeelizResizer";

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

            // Create a 2D canvas to store the result
            window.faceCanvas = document.getElementById("faceCanvas");
            window.faceContext = faceCanvas.getContext("2d");
            faceContext.canvas.width = window.innerWidth;
            faceContext.canvas.height = window.innerHeight;

            spec.threeCanvasId = "threeCanvas";
            const threeStuffs = JeelizThreeHelper.init(
              spec,
              function (faceIndex, isDetected) {
                if (isDetected) {
                  console.log("INFO in detect_callback(): DETECTED");

                  let framebuffer = gl.createFramebuffer();
                  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                  gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D,
                    texture,
                    0
                  );

                  var data = new Uint8Array(
                    gl.drawingBufferWidth * gl.drawingBufferHeight * 4
                  );
                  gl.readPixels(
                    0,
                    0,
                    gl.drawingBufferWidth,
                    gl.drawingBufferHeight,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    data
                  );

                  gl.deleteFramebuffer(framebuffer);

                  var imageData = faceContext.createImageData(
                    gl.drawingBufferWidth,
                    gl.drawingBufferHeight
                  );
                  imageData.data.set(data);
                  faceContext.putImageData(imageData, 0, 0);

                  let img = document.getElementById("faceImage");
                  img.src = faceCanvas.toDataURL();
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

              faceContext.canvas.width = window.innerWidth;
              faceContext.canvas.height = window.innerHeight;
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

#faceCanvas {
  z-index: -1;
  display: none;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  transform: rotateY(180deg);
}

#faceImage {
  z-index: 2;
  position: absolute;
  right: 0px;
  top: 0px;
  width: 25%;
  transform: rotateY(180deg);
}
</style>
