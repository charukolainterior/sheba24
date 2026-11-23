/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "e1131512af049787a635bb32a4a4dc3f"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6abc2d93abe73f6921cd0716e03d4a55"
  }, {
    "url": "pwa-192x192.png",
    "revision": "75517cbfe649ff2b5407ebd712093d00"
  }, {
    "url": "index.html",
    "revision": "eb91b886ef09dd215a7fa281bfd8c746"
  }, {
    "url": "favicon.ico",
    "revision": "e5c1bcbf4d8d2865b99cb3d2bb35e9db"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "4ae83416d85bcf7b645011f27beda3a2"
  }, {
    "url": "src/assets/images/service_security_bouncer_1795442540540.jpg",
    "revision": "f6f194d9fb30a7754d3bbda57546386a"
  }, {
    "url": "src/assets/images/service_school_escort_1795442537460.jpg",
    "revision": "ed041fa113add3249406d2805c771a2e"
  }, {
    "url": "src/assets/images/service_mistri_technician_1795442538395.jpg",
    "revision": "e99a995e6583f38948f6de1b1d3c9321"
  }, {
    "url": "src/assets/images/service_hospital_guide_1795442538260.jpg",
    "revision": "2af7eec5d75e2b7b385c3435373cafce"
  }, {
    "url": "src/assets/images/hero_dhaka_service_1795442538569.jpg",
    "revision": "ad674a2ab55f65e2c3398cfa7f157d23"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-CjyWDgXr.js",
    "revision": null
  }, {
    "url": "assets/index-CJnweUUL.css",
    "revision": null
  }, {
    "url": "assets/aistudio/file_000000003f9081fa9b7c37f33a542d62_2dac09c1.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "4ae83416d85bcf7b645011f27beda3a2"
  }, {
    "url": "favicon.ico",
    "revision": "e5c1bcbf4d8d2865b99cb3d2bb35e9db"
  }, {
    "url": "pwa-192x192.png",
    "revision": "75517cbfe649ff2b5407ebd712093d00"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6abc2d93abe73f6921cd0716e03d4a55"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "e1131512af049787a635bb32a4a4dc3f"
  }, {
    "url": "manifest.webmanifest",
    "revision": "d906714937718da8a9c3fe6d36100035"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
