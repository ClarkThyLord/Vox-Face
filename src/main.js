import {
    createApp
} from 'vue';
import App from './App.vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import * as boostrap from 'bootstrap';
window.bootstrap = boostrap;

createApp(App).mount('#app');