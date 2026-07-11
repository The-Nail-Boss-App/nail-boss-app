process.env.BABEL_ENV = process.env.BABEL_ENV || "test";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const componentPath = path.join(root, "client/src/nail-shop-public/NailShopPublicShell.jsx");
const stylesPath = path.join(root, "client/src/nail-shop-public/nailShopPublicStyles.js");
const componentSource = fs.readFileSync(componentPath, "utf8");
const stylesSource = fs.readFileSync(stylesPath, "utf8");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const Module = require("node:module");
const babel = require(path.join(root, "client/node_modules/@babel/core"));
const React = require(path.join(root, "client/node_modules/react"));
const { renderToStaticMarkup } = require(path.join(root, "client/node_modules/react-dom/server"));

const transformedStyles = babel.transformSync(stylesSource, {
  presets: [path.join(root, "client/node_modules/babel-preset-react-app")],
  filename: stylesPath,
}).code;
const stylesModule = new Module(stylesPath, module);
stylesModule.filename = stylesPath;
stylesModule.paths = Module._nodeModulePaths(path.dirname(stylesPath));
stylesModule._compile(transformedStyles, stylesPath);

const transformedComponent = babel.transformSync(componentSource, {
  presets: [path.join(root, "client/node_modules/babel-preset-react-app")],
  filename: componentPath,
}).code;
const componentModule = new Module(componentPath, module);
componentModule.filename = componentPath;
componentModule.paths = Module._nodeModulePaths(path.dirname(componentPath));
const originalRequire = componentModule.require.bind(componentModule);
componentModule.require = (request) => {
  if (request === "./nailShopPublicStyles") return stylesModule.exports;
  return originalRequire(request);
};
componentModule._compile(transformedComponent, componentPath);
const { NailShopPublicShell } = componentModule.exports;

const markup = renderToStaticMarkup(React.createElement(NailShopPublicShell));

assert(markup.includes("Nail Shop™"), "Nail Shop™ wording is present");
assert(markup.includes("Display Window™"), "Display Window™ wording is present");

["Overview", "Services", "Shop", "Gallery", "About"].forEach((tab) => {
  assert(markup.includes(`>${tab}<`), `${tab} public tab is present`);
});

["Book this Artist", "Shop Sets"].forEach((button) => {
  assert(markup.includes(`>${button}<`), `${button} placeholder button is present`);
});

assert((markup.match(/class="nsp-display-card"/g) || []).length === 4, "Four static placeholder display cards render");
assert(!componentSource.includes("useEffect"), "Component contains no useEffect");
assert(!componentSource.includes("localStorage"), "Component does not reference browser storage");
assert(!componentSource.includes("fetch("), "Component does not make network requests");

[
  "FullSetRenderer",
  "BlueprintGalleryRenderer",
  "../NailShop",
  "./NailShop",
  "../App",
  "./App",
  "localStorage",
].forEach((blockedImport) => {
  assert(!componentSource.includes(blockedImport), `Component does not import or reference ${blockedImport}`);
});

assert(stylesSource.includes("@media (max-width: 860px)"), "Tablet responsive styles exist");
assert(stylesSource.includes("@media (max-width: 560px)"), "Mobile responsive styles exist");

console.log("NailShopPublicShell isolated render and guardrail checks passed.");
