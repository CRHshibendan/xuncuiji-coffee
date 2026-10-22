# Three.js

Three.js 0.170.0, acquired from the official npm registry package:
https://registry.npmjs.org/three/-/three-0.170.0.tgz

`three.module.min.js` is the unmodified published browser module. `RoomEnvironment.js` is the published example environment with its import changed from the bare `three` specifier to `./three.module.min.js` for local, offline serving. The MIT license is preserved in `THREE-LICENSE.txt`.

Only the independent Chemex preview loads these modules. Existing site pages do not import them.
