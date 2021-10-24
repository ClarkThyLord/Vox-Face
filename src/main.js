import {
    createApp
} from 'vue';
import App from './App.vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import * as Boostrap from 'bootstrap';
window.Bootstrap = Boostrap;

import Cookies from 'js-cookie';
window.Cookies = Cookies;

createApp(App).mount('#app');