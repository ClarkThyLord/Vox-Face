import {
    createApp
} from 'vue';
import App from './App.vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import * as Boostrap from 'bootstrap';
window.Bootstrap = Boostrap;

import Cookies from 'js-cookie';
window.Cookies = Cookies;

window.saveDebugOptions = () => {
    Cookies.set("debugOptions", JSON.stringify(window.debugOptions));
}
window.resetDebugOptions = () => {
    window.debugOptions = {
        drawBoxes: true,
        drawPoints: false,
        drawPolygons: false,
        drawGaze: false,

        drawSegmentation: true,
    };
}
window.loadDebugOptions = () => {
    window.debugOptions = window.Cookies.get("debugOptions");
    if (window.debugOptions === undefined) {
        window.resetDebugOptions();
    } else {
        window.debugOptions = JSON.parse(window.debugOptions);
    };
}
loadDebugOptions();

createApp(App).mount('#app');