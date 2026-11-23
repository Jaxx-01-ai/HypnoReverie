# Hypno Reverie

A customizable hypnosis spiral overlay for Bondage Club by Jaxx-01-ai.

## Install with a bookmark

Create a bookmark named **Hypno Reverie**. Paste this entire line into its URL field:

```javascript
javascript:(function(){if(document.getElementById('player-spiral-addon')||document.getElementById('player-spiral-loader'))return;let s=document.createElement('script');s.id='player-spiral-loader';s.crossOrigin='anonymous';s.src='https://Jaxx-01-ai.github.io/HypnoReverie/hypnoreverie.js?_='+Date.now();s.onload=()=>s.remove();s.onerror=()=>{s.remove();alert('Hypno Reverie could not load. Check that GitHub Pages is published.');};document.head.appendChild(s);})();
```

Open the game, enter a room, and click the bookmark. Open **Hypno Reverie** in the upper left and enable **Show overlay**. Click the bookmark again after reloading the game.

## Controls

- Colors and presets: Violet, Monochrome, Ocean.
- Adjustable opacity, rotation speed/direction, arm count, curve, scale and width.
- **Escape** disables the overlay. **Alt+Shift+S** toggles it. Speed zero pauses rotation.
- The effect allows clicks through to the game and stays clear of the chat.
- Appearance saves locally per game server. The effect always starts off after loading.

## FUSAM

Catalog inclusion has not been requested. This release is for testing first. FUSAM compatibility will be verified before requesting inclusion.

FUSAM's developer instructions: https://gitlab.com/Sidiousious/bc-addon-loader/-/blob/main/README.md

## Development status

Version 0.1.0, initial prototype. JavaScript syntax and isolated layout checks passed. Element identifiers were checked against the game's public source. Live Firefox gameplay testing and coexistence with other addons still need verification.

The overlay uses MainCanvas and TextAreaChatLog and clips to the left half or chat boundary, whichever comes first. It hides when chat is absent or hidden. Custom game layouts may need adjustments.

No account credentials, chat messages or game-state changes are involved. Settings stay in browser local storage. An original visual effect inspired by https://hypnospiral.vercel.app/, without copying its code or assets.

