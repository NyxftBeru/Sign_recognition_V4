// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (
  modules,
  entry,
  mainEntry,
  parcelRequireName,
  externals,
  distDir,
  publicUrl,
  devServer
) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var importMap = previousRequire.i || {};
  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        if (externals[name]) {
          return externals[name];
        }
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.require = nodeRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.distDir = distDir;
  newRequire.publicUrl = publicUrl;
  newRequire.devServer = devServer;
  newRequire.i = importMap;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  // Only insert newRequire.load when it is actually used.
  // The code in this file is linted against ES5, so dynamic import is not allowed.
  // INSERT_LOAD_HERE

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });
    }
  }
})({"knLRX":[function(require,module,exports,__globalThis) {
var global = arguments[3];
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SERVER_PORT = 1234;
var HMR_SECURE = false;
var HMR_ENV_HASH = "439701173a9199ea";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "7e7afaee5389bf5f";
"use strict";
/* global HMR_HOST, HMR_PORT, HMR_SERVER_PORT, HMR_ENV_HASH, HMR_SECURE, HMR_USE_SSE, chrome, browser, __parcel__import__, __parcel__importScripts__, ServiceWorkerGlobalScope */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: {|[string]: mixed|};
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
interface ExtensionContext {
  runtime: {|
    reload(): void,
    getURL(url: string): string;
    getManifest(): {manifest_version: number, ...};
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_SERVER_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
declare var HMR_USE_SSE: boolean;
declare var chrome: ExtensionContext;
declare var browser: ExtensionContext;
declare var __parcel__import__: (string) => Promise<void>;
declare var __parcel__importScripts__: (string) => Promise<void>;
declare var globalThis: typeof self;
declare var ServiceWorkerGlobalScope: Object;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData[moduleName],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(fn) {
            this._acceptCallbacks.push(fn || function() {});
        },
        dispose: function(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData[moduleName] = undefined;
}
module.bundle.Module = Module;
module.bundle.hotData = {};
var checkedAssets /*: {|[string]: boolean|} */ , disposedAssets /*: {|[string]: boolean|} */ , assetsToDispose /*: Array<[ParcelRequire, string]> */ , assetsToAccept /*: Array<[ParcelRequire, string]> */ , bundleNotFound = false;
function getHostname() {
    return HMR_HOST || (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || (typeof location !== 'undefined' ? location.port : HMR_SERVER_PORT);
}
// eslint-disable-next-line no-redeclare
let WebSocket = globalThis.WebSocket;
if (!WebSocket && typeof module.bundle.root === 'function') try {
    // eslint-disable-next-line no-global-assign
    WebSocket = module.bundle.root('ws');
} catch  {
// ignore.
}
var hostname = getHostname();
var port = getPort();
var protocol = HMR_SECURE || typeof location !== 'undefined' && location.protocol === 'https:' && ![
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
].includes(hostname) ? 'wss' : 'ws';
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if (!parent || !parent.isParcelRequire) {
    // Web extension context
    var extCtx = typeof browser === 'undefined' ? typeof chrome === 'undefined' ? null : chrome : browser;
    // Safari doesn't support sourceURL in error stacks.
    // eval may also be disabled via CSP, so do a quick check.
    var supportsSourceURL = false;
    try {
        (0, eval)('throw new Error("test"); //# sourceURL=test.js');
    } catch (err) {
        supportsSourceURL = err.stack.includes('test.js');
    }
    var ws;
    if (HMR_USE_SSE) ws = new EventSource('/__parcel_hmr');
    else try {
        // If we're running in the dev server's node runner, listen for messages on the parent port.
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) {
            parentPort.on('message', async (message)=>{
                try {
                    await handleMessage(message);
                    parentPort.postMessage('updated');
                } catch  {
                    parentPort.postMessage('restart');
                }
            });
            // After the bundle has finished running, notify the dev server that the HMR update is complete.
            queueMicrotask(()=>parentPort.postMessage('ready'));
        }
    } catch  {
        if (typeof WebSocket !== 'undefined') try {
            ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/');
        } catch (err) {
            // Ignore cloudflare workers error.
            if (err.message && !err.message.includes('Disallowed operation called within global scope')) console.error(err.message);
        }
    }
    if (ws) {
        // $FlowFixMe
        ws.onmessage = async function(event /*: {data: string, ...} */ ) {
            var data /*: HMRMessage */  = JSON.parse(event.data);
            await handleMessage(data);
        };
        if (ws instanceof WebSocket) {
            ws.onerror = function(e) {
                if (e.message) console.error(e.message);
            };
            ws.onclose = function() {
                console.warn("[parcel] \uD83D\uDEA8 Connection to the HMR server was lost");
            };
        }
    }
}
async function handleMessage(data /*: HMRMessage */ ) {
    checkedAssets = {} /*: {|[string]: boolean|} */ ;
    disposedAssets = {} /*: {|[string]: boolean|} */ ;
    assetsToAccept = [];
    assetsToDispose = [];
    bundleNotFound = false;
    if (data.type === 'reload') fullReload();
    else if (data.type === 'update') {
        // Remove error overlay if there is one
        if (typeof document !== 'undefined') removeErrorOverlay();
        let assets = data.assets;
        // Handle HMR Update
        let handled = assets.every((asset)=>{
            return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
        });
        // Dispatch a custom event in case a bundle was not found. This might mean
        // an asset on the server changed and we should reload the page. This event
        // gives the client an opportunity to refresh without losing state
        // (e.g. via React Server Components). If e.preventDefault() is not called,
        // we will trigger a full page reload.
        if (handled && bundleNotFound && assets.some((a)=>a.envHash !== HMR_ENV_HASH) && typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') handled = !window.dispatchEvent(new CustomEvent('parcelhmrreload', {
            cancelable: true
        }));
        if (handled) {
            console.clear();
            // Dispatch custom event so other runtimes (e.g React Refresh) are aware.
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('parcelhmraccept'));
            await hmrApplyUpdates(assets);
            hmrDisposeQueue();
            // Run accept callbacks. This will also re-execute other disposed assets in topological order.
            let processedAssets = {};
            for(let i = 0; i < assetsToAccept.length; i++){
                let id = assetsToAccept[i][1];
                if (!processedAssets[id]) {
                    hmrAccept(assetsToAccept[i][0], id);
                    processedAssets[id] = true;
                }
            }
        } else fullReload();
    }
    if (data.type === 'error') {
        // Log parcel errors to console
        for (let ansiDiagnostic of data.diagnostics.ansi){
            let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
            console.error("\uD83D\uDEA8 [parcel]: " + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
        }
        if (typeof document !== 'undefined') {
            // Render the fancy html overlay
            removeErrorOverlay();
            var overlay = createErrorOverlay(data.diagnostics.html);
            // $FlowFixMe
            document.body.appendChild(overlay);
        }
    }
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log("[parcel] \u2728 Error resolved");
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    for (let diagnostic of diagnostics){
        let stack = diagnostic.frames.length ? diagnostic.frames.reduce((p, frame)=>{
            return `${p}
<a href="${protocol === 'wss' ? 'https' : 'http'}://${hostname}:${port}/__parcel_launch_editor?file=${encodeURIComponent(frame.location)}" style="text-decoration: underline; color: #888" onclick="fetch(this.href); return false">${frame.location}</a>
${frame.code}`;
        }, '') : diagnostic.stack;
        errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          \u{1F6A8} ${diagnostic.message}
        </div>
        <pre>${stack}</pre>
        <div>
          ${diagnostic.hints.map((hint)=>"<div>\uD83D\uDCA1 " + hint + '</div>').join('')}
        </div>
        ${diagnostic.documentation ? `<div>\u{1F4DD} <a style="color: violet" href="${diagnostic.documentation}" target="_blank">Learn more</a></div>` : ''}
      </div>
    `;
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function fullReload() {
    if (typeof location !== 'undefined' && 'reload' in location) location.reload();
    else if (typeof extCtx !== 'undefined' && extCtx && extCtx.runtime && extCtx.runtime.reload) extCtx.runtime.reload();
    else try {
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) parentPort.postMessage('restart');
    } catch (err) {
        console.error("[parcel] \u26A0\uFE0F An HMR update was not accepted. Please restart the process.");
    }
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', // $FlowFixMe
    href.split('?')[0] + '?' + Date.now());
    // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout || typeof document === 'undefined') return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href /*: string */  = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrDownload(asset) {
    if (asset.type === 'js') {
        if (typeof document !== 'undefined') {
            let script = document.createElement('script');
            script.src = asset.url + '?t=' + Date.now();
            if (asset.outputFormat === 'esmodule') script.type = 'module';
            return new Promise((resolve, reject)=>{
                var _document$head;
                script.onload = ()=>resolve(script);
                script.onerror = reject;
                (_document$head = document.head) === null || _document$head === void 0 || _document$head.appendChild(script);
            });
        } else if (typeof importScripts === 'function') {
            // Worker scripts
            if (asset.outputFormat === 'esmodule') return import(asset.url + '?t=' + Date.now());
            else return new Promise((resolve, reject)=>{
                try {
                    importScripts(asset.url + '?t=' + Date.now());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }
}
async function hmrApplyUpdates(assets) {
    global.parcelHotUpdate = Object.create(null);
    let scriptsToRemove;
    try {
        // If sourceURL comments aren't supported in eval, we need to load
        // the update from the dev server over HTTP so that stack traces
        // are correct in errors/logs. This is much slower than eval, so
        // we only do it if needed (currently just Safari).
        // https://bugs.webkit.org/show_bug.cgi?id=137297
        // This path is also taken if a CSP disallows eval.
        if (!supportsSourceURL) {
            let promises = assets.map((asset)=>{
                var _hmrDownload;
                return (_hmrDownload = hmrDownload(asset)) === null || _hmrDownload === void 0 ? void 0 : _hmrDownload.catch((err)=>{
                    // Web extension fix
                    if (extCtx && extCtx.runtime && extCtx.runtime.getManifest().manifest_version == 3 && typeof ServiceWorkerGlobalScope != 'undefined' && global instanceof ServiceWorkerGlobalScope) {
                        extCtx.runtime.reload();
                        return;
                    }
                    throw err;
                });
            });
            scriptsToRemove = await Promise.all(promises);
        }
        assets.forEach(function(asset) {
            hmrApply(module.bundle.root, asset);
        });
    } finally{
        delete global.parcelHotUpdate;
        if (scriptsToRemove) scriptsToRemove.forEach((script)=>{
            if (script) {
                var _document$head2;
                (_document$head2 = document.head) === null || _document$head2 === void 0 || _document$head2.removeChild(script);
            }
        });
    }
}
function hmrApply(bundle /*: ParcelRequire */ , asset /*:  HMRAsset */ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                let oldDeps = modules[asset.id][1];
                for(let dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    let id = oldDeps[dep];
                    let parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            if (supportsSourceURL) // Global eval. We would use `new Function` here but browser
            // support for source maps is better with eval.
            (0, eval)(asset.output);
            // $FlowFixMe
            let fn = global.parcelHotUpdate[asset.id];
            modules[asset.id] = [
                fn,
                deps
            ];
        }
        // Always traverse to the parent bundle, even if we already replaced the asset in this bundle.
        // This is required in case modules are duplicated. We need to ensure all instances have the updated code.
        if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id) {
    let modules = bundle.modules;
    if (!modules) return;
    if (modules[id]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        let deps = modules[id][1];
        let orphans = [];
        for(let dep in deps){
            let parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        }
        // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id];
        delete bundle.cache[id];
        // Now delete the orphans.
        orphans.forEach((id)=>{
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id);
}
function hmrAcceptCheck(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    checkedAssets = {};
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
    // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    let parents = getParents(module.bundle.root, id);
    let accepted = false;
    while(parents.length > 0){
        let v = parents.shift();
        let a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else if (a !== null) {
            // Otherwise, queue the parents in the next level upward.
            let p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push(...p);
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) {
            bundleNotFound = true;
            return true;
        }
        return hmrAcceptCheckOne(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return null;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    if (!cached) return true;
    assetsToDispose.push([
        bundle,
        id
    ]);
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        assetsToAccept.push([
            bundle,
            id
        ]);
        return true;
    }
    return false;
}
function hmrDisposeQueue() {
    // Dispose all old assets.
    for(let i = 0; i < assetsToDispose.length; i++){
        let id = assetsToDispose[i][1];
        if (!disposedAssets[id]) {
            hmrDispose(assetsToDispose[i][0], id);
            disposedAssets[id] = true;
        }
    }
    assetsToDispose = [];
}
function hmrDispose(bundle /*: ParcelRequire */ , id /*: string */ ) {
    var cached = bundle.cache[id];
    bundle.hotData[id] = {};
    if (cached && cached.hot) cached.hot.data = bundle.hotData[id];
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData[id]);
    });
    delete bundle.cache[id];
}
function hmrAccept(bundle /*: ParcelRequire */ , id /*: string */ ) {
    // Execute the module.
    bundle(id);
    // Run the accept callbacks in the new version of the module.
    var cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        let assetsToAlsoAccept = [];
        cached.hot._acceptCallbacks.forEach(function(cb) {
            let additionalAssets = cb(function() {
                return getParents(module.bundle.root, id);
            });
            if (Array.isArray(additionalAssets) && additionalAssets.length) assetsToAlsoAccept.push(...additionalAssets);
        });
        if (assetsToAlsoAccept.length) {
            let handled = assetsToAlsoAccept.every(function(a) {
                return hmrAcceptCheck(a[0], a[1]);
            });
            if (!handled) return fullReload();
            hmrDisposeQueue();
        }
    }
}

},{}],"8jy0I":[function(require,module,exports,__globalThis) {
// video_detection.ts
// 1. Core MediaPipe Tasks Vision imports
// 2. MediaPipe Drawing Utilities imports
var _drawingUtils = require("@mediapipe/drawing_utils");
// UI elements from video_detection.html
const videoFileInput = document.getElementById("videoFileInput");
const uploadedVideoContainer = document.getElementById("uploadedVideoContainer");
const uploadedVideoElement = document.getElementById("uploadedVideo");
const uploadedVideoCanvasElement = document.getElementById("uploadedVideoCanvas");
const uploadedVideoCanvasCtx = uploadedVideoCanvasElement?.getContext("2d");
const videoPredictionResultElement = document.getElementById("videoPredictionResult");
// Ensure predictionResult for webcam section is also defined if it exists
// This might be redundant if this file is only for video upload.
// If it's used for both, ensure 'predictionResult' refers to the correct element.
const predictionResult = document.getElementById("predictionResult");
let handLandmarker = undefined;
let faceLandmarker = undefined;
let poseLandmarker = undefined;
// Declare DrawingUtils instance
let drawingUtils = undefined;
// MediaPipe connections from @mediapipe/tasks-vision (for drawing)
// These are not directly exported by DrawingUtils, but are constants from the main solutions.
// We need to define them or import them if the tasks-vision bundle doesn't make them available globally
// or if they are not exposed for direct import.
// For now, let's define them as they are standard.
// For Hands
const HAND_CONNECTIONS = [
    [
        0,
        1
    ],
    [
        1,
        2
    ],
    [
        2,
        3
    ],
    [
        3,
        4
    ],
    [
        0,
        5
    ],
    [
        5,
        6
    ],
    [
        6,
        7
    ],
    [
        7,
        8
    ],
    [
        5,
        9
    ],
    [
        9,
        10
    ],
    [
        10,
        11
    ],
    [
        11,
        12
    ],
    [
        9,
        13
    ],
    [
        13,
        14
    ],
    [
        14,
        15
    ],
    [
        15,
        16
    ],
    [
        13,
        17
    ],
    [
        17,
        18
    ],
    [
        18,
        19
    ],
    [
        19,
        20
    ],
    [
        0,
        17
    ] // Palm base connection
];
// For Pose (simplified for general drawing, full list is very long)
// We'll use a subset or rely on the DrawingUtils to have the correct ones if we use its drawConnectors
// Let's assume the pose connections are needed for drawing specific keypoints for chest etc.
// For a complete list, you would usually import from @mediapipe/pose.
// Since we only care about shoulders for features, we just need to ensure drawing utilities work.
// Let's adapt from predict_live.py's usage:
// mp_pose.PoseLandmark.LEFT_SHOULDER and RIGHT_SHOULDER are indices.
const POSE_CONNECTIONS = [
    [
        11,
        12
    ] // Left shoulder to Right shoulder (for drawing a line between them if desired)
];
// --- Model Loading ---
// This function initializes all MediaPipe models (Hand, Face, Pose Landmarkers).
const createDetectors = async ()=>{
    try {
        // Resolve the Wasm files for MediaPipe Tasks Vision API.
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
        // Initialize DrawingUtils with the canvas context
        drawingUtils = new (0, _drawingUtils.DrawingUtils)(uploadedVideoCanvasCtx);
        // Initialize HandLandmarker with a single hand.
        const handOptions = {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        };
        handLandmarker = await HandLandmarker.createFromOptions(vision, handOptions);
        console.log("HandLandmarker model loaded successfully!");
        // Initialize FaceLandmarker for single face detection.
        const faceOptions = {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            outputFaceBlendshapes: false,
            numFaces: 1
        };
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, faceOptions);
        console.log("FaceLandmarker model loaded successfully!");
        // Initialize PoseLandmarker for single pose detection.
        const poseOptions = {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1
        };
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, poseOptions);
        console.log("PoseLandmarker model loaded successfully!");
        // Update the prediction result display to indicate readiness.
        if (videoPredictionResultElement) videoPredictionResultElement.innerText = "Prediction: Models loaded, waiting for video upload...";
        // If there's a separate predictionResult for webcam, update it too
        if (predictionResult) predictionResult.innerText = "Prediction: Models loaded, enable webcam for live predictions.";
    } catch (error) {
        console.error("Failed to load MediaPipe models:", error);
        if (videoPredictionResultElement) videoPredictionResultElement.innerText = "Prediction: Failed to load ML models. Check console for details.";
        if (predictionResult) predictionResult.innerText = "Prediction: Failed to load ML models. Check console for details.";
    }
};
createDetectors(); // Call the function to create all detectors immediately on page load
// --- NEW: Handle Video File Upload ---
let lastUploadedVideoTime = -1;
let uploadedVideoRunning = false;
if (videoFileInput) videoFileInput.addEventListener('change', (event)=>{
    const files = event.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        const videoURL = URL.createObjectURL(file);
        // Set video source and make container visible
        uploadedVideoElement.src = videoURL;
        uploadedVideoContainer.style.display = 'block';
        // Reset prediction display
        if (videoPredictionResultElement) videoPredictionResultElement.innerText = "Prediction: Loading video...";
        // Ensure canvas matches video size when video metadata is loaded
        uploadedVideoElement.onloadedmetadata = ()=>{
            if (uploadedVideoCanvasElement && uploadedVideoElement) {
                uploadedVideoCanvasElement.width = uploadedVideoElement.videoWidth;
                uploadedVideoCanvasElement.height = uploadedVideoElement.videoHeight;
                // Adjust style for display aspect ratio if needed (optional)
                uploadedVideoCanvasElement.style.width = uploadedVideoElement.offsetWidth + "px";
                uploadedVideoCanvasElement.style.height = uploadedVideoElement.offsetHeight + "px";
            }
        };
        // Start prediction when video starts playing
        uploadedVideoElement.addEventListener('play', ()=>{
            uploadedVideoRunning = true;
            predictUploadedVideo();
        });
        uploadedVideoElement.addEventListener('pause', ()=>uploadedVideoRunning = false);
        uploadedVideoElement.addEventListener('ended', ()=>{
            uploadedVideoRunning = false;
            if (videoPredictionResultElement) videoPredictionResultElement.innerText = "Prediction: Video processing complete.";
        });
        uploadedVideoElement.load(); // Ensure video loads metadata if not already
    }
});
// NEW FUNCTION: Predict for Uploaded Video
async function predictUploadedVideo() {
    if (!uploadedVideoElement || !uploadedVideoCanvasElement || !uploadedVideoCanvasCtx || !handLandmarker || !faceLandmarker || !poseLandmarker || !drawingUtils) {
        console.warn("Required elements or MediaPipe detectors not ready for uploaded video prediction.");
        if (uploadedVideoRunning) window.requestAnimationFrame(predictUploadedVideo); // Continue trying if still supposed to be running
        return;
    }
    if (uploadedVideoElement.paused || uploadedVideoElement.ended) {
        uploadedVideoRunning = false;
        if (videoPredictionResultElement) videoPredictionResultElement.innerText = "Prediction: Video ended or paused.";
        return;
    }
    let startTimeMs = performance.now();
    // Only detect if the video frame has changed
    if (lastUploadedVideoTime !== uploadedVideoElement.currentTime) {
        lastUploadedVideoTime = uploadedVideoElement.currentTime;
        handResults = handLandmarker.detectForVideo(uploadedVideoElement, startTimeMs);
        faceResults = faceLandmarker.detectForVideo(uploadedVideoElement, startTimeMs);
        poseResults = poseLandmarker.detectForVideo(uploadedVideoElement, startTimeMs);
    }
    uploadedVideoCanvasCtx.save();
    uploadedVideoCanvasCtx.clearRect(0, 0, uploadedVideoCanvasElement.width, uploadedVideoCanvasElement.height);
    // Draw the video frame onto the canvas
    uploadedVideoCanvasCtx.drawImage(uploadedVideoElement, 0, 0, uploadedVideoCanvasElement.width, uploadedVideoCanvasElement.height);
    const features = [];
    // 1. Extract Hand Landmarks (21 landmarks * 2 coordinates = 42 features)
    if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
        const landmarks = handResults.landmarks[0];
        for (const landmark of landmarks)features.push(landmark.x, landmark.y);
        const debugHandLandmarks = landmarks.map((lm)=>({
                ...lm,
                visibility: 1
            }));
        drawingUtils.drawConnectors(debugHandLandmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
        });
        drawingUtils.drawLandmarks(debugHandLandmarks, {
            color: "#FF0000",
            lineWidth: 2
        });
    } else for(let i = 0; i < 42; i++)features.push(0);
    // 2. Extract Face Center (Bounding Box Center) (2 features)
    if (faceResults && faceResults.faceRects && faceResults.faceRects.length > 0) {
        const faceRect = faceResults.faceRects[0].boundingBox;
        const face_x = faceRect.x + faceRect.width / 2;
        const face_y = faceRect.y + faceRect.height / 2;
        features.push(face_x, face_y);
        uploadedVideoCanvasCtx.strokeStyle = '#00BFFF';
        uploadedVideoCanvasCtx.lineWidth = 2;
        uploadedVideoCanvasCtx.strokeRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
    } else features.push(0, 0);
    // 3. Extract Chest Position (average of shoulder landmarks) (2 features)
    if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
        const poseLandmarks = poseResults.landmarks[0];
        const LEFT_SHOULDER_IDX = 11;
        const RIGHT_SHOULDER_IDX = 12;
        const leftShoulder = poseLandmarks[LEFT_SHOULDER_IDX];
        const rightShoulder = poseLandmarks[RIGHT_SHOULDER_IDX];
        if (leftShoulder && rightShoulder && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
            const chest_x = (leftShoulder.x + rightShoulder.x) / 2;
            const chest_y = (leftShoulder.y + rightShoulder.y) / 2;
            features.push(chest_x, chest_y);
            const debugPoseLandmarks = poseLandmarks.map((lm)=>({
                    ...lm,
                    visibility: 1
                }));
            // Use PoseLandmarker.POSE_CONNECTIONS for drawing if available, otherwise define a subset
            drawingUtils.drawConnectors(debugPoseLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
                color: '#FFFF00',
                lineWidth: 2
            });
            drawingUtils.drawLandmarks([
                leftShoulder,
                rightShoulder
            ], {
                color: '#00FFFF',
                lineWidth: 5
            });
        } else features.push(0, 0);
    } else features.push(0, 0);
    // Ensure features array has exactly 46 elements
    if (features.length !== 46) {
        console.warn(`Feature array length mismatch: Expected 46, got ${features.length}. Padding/truncating.`);
        while(features.length < 46)features.push(0);
        if (features.length > 46) features.splice(46);
    }
    // Send features to Flask server for prediction
    try {
        const response = await fetch('https://sign-recognition-v4.onrender.com/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                features: features
            })
        });
        if (response.ok) {
            const data = await response.json();
            const prediction = data.predicted_gloss; // Changed from data.prediction to data.predicted_gloss
            if (videoPredictionResultElement) videoPredictionResultElement.innerText = `Prediction: ${prediction}`;
        } else {
            console.error('Server error:', response.status, response.statusText);
            if (videoPredictionResultElement) videoPredictionResultElement.innerText = `Prediction: Server Error (${response.status})`;
        }
    } catch (error) {
        console.error('Network error during prediction:', error);
        if (videoPredictionResultElement) videoPredictionResultElement.innerText = 'Prediction: Network Error (Is server running?)';
    }
    uploadedVideoCanvasCtx.restore();
    // Call this function again to keep predicting when the browser is ready.
    if (uploadedVideoRunning) window.requestAnimationFrame(predictUploadedVideo);
}
// --- Existing Webcam Continuous Detection ---
const demosSection = document.getElementById("demos");
const video = document.getElementById("webcam"); // Assuming this is for webcam
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement?.getContext("2d");
let enableWebcamButton = null;
let webcamRunning = false;
// Check if webcam access is supported.
const hasGetUserMedia = ()=>!!navigator.mediaDevices?.getUserMedia;
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    if (enableWebcamButton) {
        enableWebcamButton.addEventListener("click", enableCam);
        // Remove "invisible" class for demosSection if it's supposed to be initially hidden
        if (demosSection) demosSection.classList.remove("invisible");
    } else console.warn("Webcam enable button not found.");
} else console.warn("getUserMedia() is not supported by your browser");
// Enable the live webcam view and start detection.
function enableCam(event) {
    if (!handLandmarker || !faceLandmarker || !poseLandmarker || !drawingUtils) {
        console.log("Wait! MediaPipe detectors not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        if (enableWebcamButton) enableWebcamButton.innerText = "ENABLE PREDICTIONS";
        // Stop the video stream when disabling webcam
        if (video.srcObject) {
            video.srcObject.getTracks().forEach((track)=>track.stop());
            video.srcObject = null;
        }
        // Clear canvas and prediction result
        if (canvasCtx && canvasElement) canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        if (predictionResult) predictionResult.innerText = "Prediction: Disabled";
    } else {
        webcamRunning = true;
        if (enableWebcamButton) enableWebcamButton.innerText = "DISABLE PREDICTIONS";
        // getUsermedia parameters.
        const constraints = {
            video: true
        };
        // Activate the webcam stream.
        navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        }).catch((err)=>{
            console.error("Error accessing webcam:", err);
            webcamRunning = false;
            if (enableWebcamButton) enableWebcamButton.innerText = "ENABLE PREDICTIONS";
            if (predictionResult) predictionResult.innerText = "Prediction: Webcam access denied or error";
        });
    }
}
let lastVideoTime = -1;
let handResults = undefined; // Using these for both webcam and uploaded video now
let faceResults = undefined;
let poseResults = undefined;
async function predictWebcam() {
    if (!video || !canvasElement || !canvasCtx || !handLandmarker || !faceLandmarker || !poseLandmarker || !drawingUtils) {
        console.warn("Required elements or MediaPipe detectors not ready for webcam prediction.");
        if (webcamRunning) window.requestAnimationFrame(predictWebcam);
        return;
    }
    // Adjust canvas dimensions to match video feed
    canvasElement.style.width = video.offsetWidth + "px";
    canvasElement.style.height = video.offsetHeight + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    let startTimeMs = performance.now();
    // Only detect for video if the video frame has changed
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        // Perform detections
        handResults = handLandmarker.detectForVideo(video, startTimeMs);
        faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
        poseResults = poseLandmarker.detectForVideo(video, startTimeMs);
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // Apply a horizontal flip transformation to the canvas context for non-mirrored webcam display
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);
    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    const features = [];
    // 1. Extract Hand Landmarks (21 landmarks * 2 coordinates = 42 features)
    if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
        const landmarks = handResults.landmarks[0];
        for (const landmark of landmarks)features.push(landmark.x, landmark.y);
        const debugHandLandmarks = landmarks.map((lm)=>({
                ...lm,
                visibility: 1
            }));
        drawingUtils.drawConnectors(debugHandLandmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
        });
        drawingUtils.drawLandmarks(debugHandLandmarks, {
            color: "#FF0000",
            lineWidth: 2
        });
    } else // If no hand detected, pad with zeros for hand features (21 * 2 = 42 zeros)
    for(let i = 0; i < 42; i++)features.push(0);
    // 2. Extract Face Center (Bounding Box Center) (2 features)
    if (faceResults && faceResults.faceRects && faceResults.faceRects.length > 0) {
        const faceRect = faceResults.faceRects[0].boundingBox;
        const face_x = faceRect.x + faceRect.width / 2;
        const face_y = faceRect.y + faceRect.height / 2;
        features.push(face_x, face_y);
        // Optionally, draw the face bounding box for visualization
        canvasCtx.strokeStyle = '#00BFFF';
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeRect(faceRect.x, faceRect.y, faceRect.width, faceRect.height);
    } else features.push(0, 0);
    // 3. Extract Chest Position (average of shoulder landmarks) (2 features)
    if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
        const poseLandmarks = poseResults.landmarks[0];
        const LEFT_SHOULDER_IDX = 11;
        const RIGHT_SHOULDER_IDX = 12;
        const leftShoulder = poseLandmarks[LEFT_SHOULDER_IDX];
        const rightShoulder = poseLandmarks[RIGHT_SHOULDER_IDX];
        if (leftShoulder && rightShoulder && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
            const chest_x = (leftShoulder.x + rightShoulder.x) / 2;
            const chest_y = (leftShoulder.y + rightShoulder.y) / 2;
            features.push(chest_x, chest_y);
            const debugPoseLandmarks = poseLandmarks.map((lm)=>({
                    ...lm,
                    visibility: 1
                }));
            // Use PoseLandmarker.POSE_CONNECTIONS for drawing if available, otherwise define a subset
            drawingUtils.drawConnectors(debugPoseLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
                color: '#FFFF00',
                lineWidth: 2
            });
            drawingUtils.drawLandmarks([
                leftShoulder,
                rightShoulder
            ], {
                color: '#00FFFF',
                lineWidth: 5
            });
        } else features.push(0, 0);
    } else features.push(0, 0);
    // Ensure features array has exactly 46 elements
    if (features.length !== 46) {
        console.warn(`Feature array length mismatch: Expected 46, got ${features.length}. Padding/truncating.`);
        while(features.length < 46)features.push(0);
        if (features.length > 46) features.splice(46);
    }
    // Send features to Flask server for prediction
    try {
        const response = await fetch('https://sign-recognition-v4.onrender.com/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                features: features
            })
        });
        if (response.ok) {
            const data = await response.json();
            const prediction = data.predicted_gloss; // Changed from data.prediction to data.predicted_gloss
            if (predictionResult) predictionResult.innerText = `Prediction: ${prediction}`;
        } else {
            console.error('Server error:', response.status, response.statusText);
            if (predictionResult) predictionResult.innerText = `Prediction: Server Error (${response.status})`;
        }
    } catch (error) {
        console.error('Network error during prediction:', error);
        if (predictionResult) predictionResult.innerText = 'Prediction: Network Error (Is server running?)';
    }
    canvasCtx.restore();
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) window.requestAnimationFrame(predictWebcam);
}

},{"@mediapipe/drawing_utils":"8LUPI"}],"8LUPI":[function(require,module,exports,__globalThis) {
var global = arguments[3];
(function() {
    'use strict';
    function h(a) {
        var c = 0;
        return function() {
            return c < a.length ? {
                done: !1,
                value: a[c++]
            } : {
                done: !0
            };
        };
    }
    var l = "function" == typeof Object.defineProperties ? Object.defineProperty : function(a, c, b) {
        if (a == Array.prototype || a == Object.prototype) return a;
        a[c] = b.value;
        return a;
    };
    function m(a) {
        a = [
            "object" == typeof globalThis && globalThis,
            a,
            "object" == typeof window && window,
            "object" == typeof self && self,
            "object" == typeof global && global
        ];
        for(var c = 0; c < a.length; ++c){
            var b = a[c];
            if (b && b.Math == Math) return b;
        }
        throw Error("Cannot find global object");
    }
    var n = m(this);
    function p(a, c) {
        if (c) a: {
            var b = n;
            a = a.split(".");
            for(var d = 0; d < a.length - 1; d++){
                var e = a[d];
                if (!(e in b)) break a;
                b = b[e];
            }
            a = a[a.length - 1];
            d = b[a];
            c = c(d);
            c != d && null != c && l(b, a, {
                configurable: !0,
                writable: !0,
                value: c
            });
        }
    }
    function q(a) {
        var c = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
        return c ? c.call(a) : {
            next: h(a)
        };
    }
    var r = "function" == typeof Object.assign ? Object.assign : function(a, c) {
        for(var b = 1; b < arguments.length; b++){
            var d = arguments[b];
            if (d) for(var e in d)Object.prototype.hasOwnProperty.call(d, e) && (a[e] = d[e]);
        }
        return a;
    };
    p("Object.assign", function(a) {
        return a || r;
    });
    p("Array.prototype.fill", function(a) {
        return a ? a : function(c, b, d) {
            var e = this.length || 0;
            0 > b && (b = Math.max(0, e + b));
            if (null == d || d > e) d = e;
            d = Number(d);
            0 > d && (d = Math.max(0, e + d));
            for(b = Number(b || 0); b < d; b++)this[b] = c;
            return this;
        };
    });
    function t(a) {
        return a ? a : Array.prototype.fill;
    }
    p("Int8Array.prototype.fill", t);
    p("Uint8Array.prototype.fill", t);
    p("Uint8ClampedArray.prototype.fill", t);
    p("Int16Array.prototype.fill", t);
    p("Uint16Array.prototype.fill", t);
    p("Int32Array.prototype.fill", t);
    p("Uint32Array.prototype.fill", t);
    p("Float32Array.prototype.fill", t);
    p("Float64Array.prototype.fill", t);
    var u = this || self;
    function v(a, c) {
        a = a.split(".");
        var b = u;
        a[0] in b || "undefined" == typeof b.execScript || b.execScript("var " + a[0]);
        for(var d; a.length && (d = a.shift());)a.length || void 0 === c ? b[d] && b[d] !== Object.prototype[d] ? b = b[d] : b = b[d] = {} : b[d] = c;
    }
    var w = {
        color: "white",
        lineWidth: 4,
        radius: 6,
        visibilityMin: .5
    };
    function x(a) {
        a = a || {};
        return Object.assign({}, w, {
            fillColor: a.color
        }, a);
    }
    function y(a, c) {
        return a instanceof Function ? a(c) : a;
    }
    function z(a, c, b) {
        return Math.max(Math.min(c, b), Math.min(Math.max(c, b), a));
    }
    v("clamp", z);
    v("drawLandmarks", function(a, c, b) {
        if (c) {
            b = x(b);
            a.save();
            var d = a.canvas, e = 0;
            c = q(c);
            for(var f = c.next(); !f.done; f = c.next())if (f = f.value, void 0 !== f && (void 0 === f.visibility || f.visibility > b.visibilityMin)) {
                a.fillStyle = y(b.fillColor, {
                    index: e,
                    from: f
                });
                a.strokeStyle = y(b.color, {
                    index: e,
                    from: f
                });
                a.lineWidth = y(b.lineWidth, {
                    index: e,
                    from: f
                });
                var g = new Path2D;
                g.arc(f.x * d.width, f.y * d.height, y(b.radius, {
                    index: e,
                    from: f
                }), 0, 2 * Math.PI);
                a.fill(g);
                a.stroke(g);
                ++e;
            }
            a.restore();
        }
    });
    v("drawConnectors", function(a, c, b, d) {
        if (c && b) {
            d = x(d);
            a.save();
            var e = a.canvas, f = 0;
            b = q(b);
            for(var g = b.next(); !g.done; g = b.next()){
                var k = g.value;
                a.beginPath();
                g = c[k[0]];
                k = c[k[1]];
                g && k && (void 0 === g.visibility || g.visibility > d.visibilityMin) && (void 0 === k.visibility || k.visibility > d.visibilityMin) && (a.strokeStyle = y(d.color, {
                    index: f,
                    from: g,
                    to: k
                }), a.lineWidth = y(d.lineWidth, {
                    index: f,
                    from: g,
                    to: k
                }), a.moveTo(g.x * e.width, g.y * e.height), a.lineTo(k.x * e.width, k.y * e.height));
                ++f;
                a.stroke();
            }
            a.restore();
        }
    });
    v("drawRectangle", function(a, c, b) {
        b = x(b);
        a.save();
        var d = a.canvas;
        a.beginPath();
        a.lineWidth = y(b.lineWidth, {});
        a.strokeStyle = y(b.color, {});
        a.fillStyle = y(b.fillColor, {});
        a.translate(c.xCenter * d.width, c.yCenter * d.height);
        a.rotate(c.rotation * Math.PI / 180);
        a.rect(-c.width / 2 * d.width, -c.height / 2 * d.height, c.width * d.width, c.height * d.height);
        a.translate(-c.xCenter * d.width, -c.yCenter * d.height);
        a.stroke();
        a.fill();
        a.restore();
    });
    v("lerp", function(a, c, b, d, e) {
        return z(d * (1 - (a - c) / (b - c)) + e * (1 - (b - a) / (b - c)), d, e);
    });
}).call(this);

},{}]},["knLRX","8jy0I"], "8jy0I", "parcelRequirece56", {})

//# sourceMappingURL=video_detection.5389bf5f.js.map
