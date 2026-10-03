# Spinifex Engine

An accessible, interactive multi-scale science learning platform prototype for Android phones and desktop browsers. The current beta is a static web app with an animated Three.js scene, scale navigator, alchemy-room combinations, a geology explainer, reading assistance, a knowledge check, and a configurable sales scenario.

Copyright © 2026 Ava Mae Elsbury. All rights reserved.

## Run locally

The app has no build step. From the repository root, run:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The 3D scene uses Three.js from jsDelivr, so that part requires an internet connection and WebGL. The learning and calculator sections are plain HTML and JavaScript.

## Notes

- The scale illustrations and quark/gluon-to-element pairings are educational metaphors, not continuous physical simulation or a claim that particle physics causes geological processes.
- The finance calculator uses editable scenario assumptions. It is not tax advice; check current ATO guidance and platform contracts before relying on estimates.
- No Android package or native Dell distribution integration is included in this browser beta.
