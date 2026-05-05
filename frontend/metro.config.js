// Custom Metro config: redirect zustand's ESM build (which uses `import.meta.env`)
// to its CommonJS entry, which works in Metro/Hermes/web without
// `<script type="module">`. Upstream issue: zustand v4/v5 ships
// `import.meta.env` in its ESM build and Metro forwards it verbatim
// when Package Exports are enabled in SDK 54.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const ZUSTAND = path.dirname(require.resolve('zustand/package.json'));

const redirects = {
  zustand: path.join(ZUSTAND, 'index.js'),
  'zustand/middleware': path.join(ZUSTAND, 'middleware.js'),
  'zustand/shallow': path.join(ZUSTAND, 'shallow.js'),
  'zustand/vanilla': path.join(ZUSTAND, 'vanilla.js'),
  'zustand/react': path.join(ZUSTAND, 'react.js'),
  'zustand/traditional': path.join(ZUSTAND, 'traditional.js'),
};

const prevResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (Object.prototype.hasOwnProperty.call(redirects, moduleName)) {
    return { type: 'sourceFile', filePath: redirects[moduleName] };
  }
  if (prevResolveRequest) {
    return prevResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
