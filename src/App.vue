<template>
  <!-- CANVAS BEHIND: VIDEO FACEFILTER ONLY -->
  <canvas width="600" height="600" id="jeeFaceFilterCanvas"></canvas>

  <!-- CANVAS ABOVE: AR WITH THREE.JS -->
  <canvas width="600" height="600" id="threeCanvas"></canvas>

  <a href="https://github.com/ClarkThyLord/Vox-Face">
    <img src="../public/vox-face.svg" alt="" class="vf-icon" />
  </a>
</template>

<script>
import "../public/libs/js/jeelizFaceFilter";
import * as THREE from "three/build/three.module.js";

import JeelizThreeHelper from "./helpers/JeelizThreeHelper";
import JeelizResizer from "./helpers/JeelizResizer";

export default {
  name: "App",
  mounted: () => {
    let THREECAMERA = null;

    // callback: launched if a face is detected or lost
    function detect_callback(faceIndex, isDetected) {
      if (isDetected) {
        console.log("INFO in detect_callback(): DETECTED");
      } else {
        console.log("INFO in detect_callback(): LOST");
      }
    }

    // build the 3D. called once when Jeeliz Face Filter is OK:
    var init_threeScene = (spec) => {
      spec.threeCanvasId = "threeCanvas"; // enable 2 canvas mode
      const threeStuffs = JeelizThreeHelper.init(spec, detect_callback);

      // CREATE A CUBE:
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshNormalMaterial();
      const threeCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      threeCube.frustumCulled = false;
      threeStuffs.faceObject.add(threeCube);

      // CREATE THE CAMERA:
      THREECAMERA = JeelizThreeHelper.create_camera();
    }; // end init_threeScene()

    // entry point:
    var main = () => {
      JeelizResizer.size_canvas({
        canvasId: "jeeFaceFilterCanvas",
        callback: function (isError, bestVideoSettings) {
          init_faceFilter(bestVideoSettings);
        },
      });
    };

    var init_faceFilter = (videoSettings) => {
      JEELIZFACEFILTER.init({
        antialias: false,
        canvasId: "jeeFaceFilterCanvas",
        NNCPath: "neural_nets/", // root of NN_DEFAULT.json file
        maxFacesDetected: 1,
        callbackReady: function (errCode, spec) {
          if (errCode) {
            console.log("AN ERROR HAPPENS. ERR =", errCode);
            return;
          }

          console.log("INFO: JEELIZFACEFILTER IS READY");
          init_threeScene(spec);
        },

        // called at each render iteration (drawing loop):
        callbackTrack: function (detectState) {
          JeelizThreeHelper.render(detectState, THREECAMERA);
        },
      }); //end JEELIZFACEFILTER.init call
    };

    main();
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.vf-icon {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 64px;
  height: 64px;
  z-index: 10000;
}

a {
  color: #eee;
  text-decoration: none;
}
a:hover {
  color: blue;
}
body {
  overflow: auto;
  overflow-y: auto;
  background-color: white;
  background-attachment: fixed;
  background-position: center;
  background-size: contain;
  margin: 0px;
}

#jeeFaceFilterCanvas {
  z-index: 10;
  position: absolute;
  max-height: 100%;
  max-width: 100%;
  left: 50%;
  top: 50%;
  width: 100vmin;
  transform: translate(-50%, -50%) rotateY(180deg);
}

#threeCanvas {
  z-index: 11;
  position: absolute;
  max-height: 100%;
  max-width: 100%;
  left: 50%;
  top: 50%;
  width: 100vmin;
  transform: translate(-50%, -50%) rotateY(180deg);
}

@media (max-width: 787px) {
  #jeeFaceFilterCanvas {
    right: 0px;
    top: 60px;
    transform: rotateY(180deg);
  }
}
</style>
