# Player Spiral

Customizable, click-through spiral for the left player area of Bondage Club.

## Publish

1. Create a public repository named player-spiral under Jaxx-01-ai.
2. Upload spiral.js, bookmarklet.txt, and this README.md to the repository root. Include .nojekyll if visible.
3. In Settings > Pages, choose Deploy from a branch, main, /(root), then Save.
4. Wait for the Pages deployment to finish. Verify https://Jaxx-01-ai.github.io/player-spiral/spiral.js opens JavaScript rather than a 404 page.

## Bookmark

Copy the entire contents of bookmarklet.txt into a Firefox bookmark's URL field. Click it while in the game, open Spiral settings, and enable Show overlay. Run the bookmark again after reloading the game. Escape turns the overlay off.

The bookmark loads spiral.js from GitHub Pages on each fresh game page. Updating spiral.js updates future loads without changing the bookmark. The loader guards against repeated clicks and reports download failures.

## Status

Prototype. Syntax and isolated boundary checks passed; live Firefox game compatibility remains unverified. Uses MainCanvas and TextAreaChatLog DOM elements. No game credentials or game-state changes. Appearance settings stay in the game origin's local storage.
