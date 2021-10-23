import {
    createApp
} from 'vue';
import App from './App.vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import * as boostrap from 'bootstrap';
window.bootstrap = boostrap;

import * as THREE from "three/build/three.module.js";
window.THREE = THREE;

createApp(App).mount('#app');