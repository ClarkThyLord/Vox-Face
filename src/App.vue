<template>
  <canvas id="jeeFaceFilterCanvas"></canvas>

  <canvas id="threeCanvas"></canvas>

  <canvas id="faceCanvas"></canvas>
  <img alt="" id="faceImage" />

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
          callbackReady: (errCode, spec) => {
            if (errCode) {
              console.log("AN ERROR HAPPENS. ERR =", errCode);
              return;
            }

            console.log("INFO: JEELIZFACEFILTER IS READY");
            console.log(spec);
            window.gl = spec.GL;
            window.texture = spec.videoTexture;

            // Create a 2D canvas to store the result
            window.faceCanvas = document.getElementById("faceCanvas");
            window.faceContext = faceCanvas.getContext("2d");

            spec.threeCanvasId = "threeCanvas";
            const threeStuffs = JeelizThreeHelper.init(
              spec,
              function (faceIndex, isDetected) {
                if (isDetected) {
                  console.log("INFO in detect_callback(): DETECTED");
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
          },
          callbackTrack: (detectState) => {
            // var pixels = new Uint8Array(
            //   spec.GL.drawingBufferWidth * spec.GL.drawingBufferHeight * 4
            // );
            // spec.GL.readPixels(
            //   0,
            //   0,
            //   spec.GL.drawingBufferWidth,
            //   spec.GL.drawingBufferHeight,
            //   spec.GL.RGBA,
            //   spec.GL.UNSIGNED_BYTE,
            //   pixels
            // );

            // Create a framebuffer backed by the texture
            let framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(
              gl.FRAMEBUFFER,
              gl.COLOR_ATTACHMENT0,
              gl.TEXTURE_2D,
              texture,
              0
            );

            // Read the contents of the framebuffer
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

            // Copy the pixels to a 2D canvas
            var imageData = faceContext.createImageData(
              gl.drawingBufferWidth,
              gl.drawingBufferHeight
            );
            imageData.data.set(data);
            faceContext.putImageData(imageData, 0, 0);

            let img = document.getElementById("faceImage");
            img.src = faceCanvas.toDataURL();

            // console.log(detectState);

            JeelizThreeHelper.render(detectState, THREECAMERA);
          },
        });
      },
    });
  },
};
</script>

<style>
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
  z-index: 2;
  position: absolute;
  left: 0px;
  top: 0px;
  /* width: 100%;
  height: 100%; */
  transform: rotateY(180deg);
  background: greenyellow;
}

#faceImage {
  z-index: 2;
  position: absolute;
  right: 0px;
  top: 0px;
  transform: rotateY(180deg);
  background: greenyellow;
}
</style>
