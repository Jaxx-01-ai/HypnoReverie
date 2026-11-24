# Hypno Reverie

Version **0.8.0**, by Jaxx-01-ai. Customizable visual and audio layers for Bondage Club. The visual overlay remains clipped to the left player area and allows game clicks through. This is a wearable test release. The existing FUSAM submission remains for v0.6.0.

## Wearables (0.8)

Five crafted variants appear in the normal game item/clothing pickers. They are not buttons in the Hypno Reverie menu.

| Picker | Item | Native base to own |
| --- | --- | --- |
| Blindfold / eyes (ItemHead) | Hypno Reverie Headset | Interactive VR Headset |
| Hood (ItemHood) | Hypno Reverie Latex Hood | Latex Hood |
| Arm restraints (ItemArms) | Hypno Reverie Latex Bolero | Bolero Straitjacket |
| Upper suit (Suit) | Hypno Reverie Latex Top | Catsuit purchase / Seamless Catsuit variant |
| Lower suit (SuitLower) | Hypno Reverie Latex Bottom | Catsuit purchase / Seamless Catsuit variant |

Open the appropriate slot and select the named crafted variant. Buy its base item in the game shop if it is absent. These entries use normal game inventory, permissions, prerequisites, locks, removal rules, and extended options. They consume no crafting slots. The addon never automatically equips or removes a wearable.

### Artwork and fitting

The visor, hood, and bolero use original generated artwork embedded in hypnoreverie.js. The hood has a softened nose and transparent mouth opening. The bolero uses the native arm restraint's behavior and BackElbowTouch pose, with the new wraparound sleeve artwork drawn in front. It is fitted to the standard torso; unusual body styles and layered outfit combinations need live testing.

The catsuit uses a procedural glossy black material over the native Seamless Catsuit silhouettes, with curved chest seams positioned for Small, Normal, Large, and XLarge. This is an adaptation to game artwork, not the high-resolution concept image stretched over the avatar. The lower part follows its own native body-size variants. No waistband or horizontal waist seam is added; the two pieces share the same material treatment across their join. Garment outlines, transparency, layering, masks, opacity, and drawing transforms remain controlled by the game.

Upper-pose references checked: default, BackBoxTie, BackCuffs, BackElbowTouch, Hogtied, OverTheHead, TapedHands, Yoked, and AllFours, across all four breast sizes. Lower references checked: default, Hogtied, Kneel, KneelingSpread, LegsClosed, and Spread, across all four lower sizes. Native standing offsets, inversion, and composite poses remain engine-driven. In AllFours, the top uses the game's dedicated LatexCatsuit silhouette; the separate lower suit follows the game's normal hidden-lower-body behavior. The addon changes the pose mapping only for this crafted top, not other catsuits.

The material uses fixed black and silver-gray colors. The native color picker changes the fallback appearance, not the custom material. Existing gloves/options still use their native behavior. Only the four breast-bearing standard body sizes are covered by this test matrix; alternate body styles such as EchoV2 and flat-body assets have not been visually verified.

### Modes and compatibility

The headset and hood start cosmetic/non-blinding. The headset's native Function option chooses Passthrough or Off. The hood's native Vision option enables blocking; its base blocking option also applies light hearing reduction and wardrobe blocking. Locked items obey native settings restrictions. The bolero is a restraint and retains its native restrictions.

Other users running Hypno Reverie 0.8 see the custom appearance. Players without it see the native base items. Equipped items save through the game as native crafted variants. Your existing v0.7 named headset retains its skin.

### Validation and installation

The isolated browser fixture checks 60 size/pose material combinations, exact silhouette-alpha preservation, native draw options, local pose-map isolation, ordinary-item isolation, bolero drawing, and cleanup. Additional checks cover native picker injection, ownership and craft permissions, deduplication, default settings, thumbnails for the head wearables, and existing overlay/session/audio behavior. The included fitting screenshots are test renders, not live game screenshots. Live Firefox, multiplayer rendering, every composite pose, and alternate body styles still need in-game testing.

Upload hypnoreverie.js, README.md, and bookmarklet.txt to the existing repository root. The images are embedded; no PNG uploads are needed. MOD-SDK-LICENSE.txt is included for reference; the same MIT notice is embedded in the script. Keep the existing bookmark, reload the game after deployment, then load the addon again.

The official BC Mod SDK 1.2.0 provides the hooks. Game silhouette and reference artwork is from BondageProjects/Bondage-College and retains its upstream authorship and licensing. Native artwork is loaded from the game, not bundled in the addon. Generated concepts and fitting previews are separate from the deployable script. The existing FUSAM submission is unchanged.


## Update

Upload **hypnoreverie.js**, **bookmarklet.txt** and **README.md** to the root of Jaxx-01-ai/HypnoReverie, replacing those files. Keep GitHub Pages on main/root. Wait for deployment, reload the game, and click your existing bookmark. Both players should use v0.8 to see the new wearable appearances. Older session keys are not migrated into permanent grants; grant access again after updating.

The bookmark is unchanged. Its complete URL is in bookmarklet.txt. After a reload, the bookmark must still be clicked unless an addon loader is already configured. Persistence does not install an automatic loader.

Open the addon from the headset icon in your own or another player's profile, your bookmark, or Alt+Shift+H. Drag the title bar to move the menu; use ↔ for compact mode or drag its lower-right corner to resize. The preview window has its own draggable title bar.

## Spirals and patterns

Both independent layers support **Spiral**, **Expanding rings**, **Heart tunnel**, **Flower tunnel**, **Polygon tunnel**, and **Star tunnel**. The **Thin towards center** control tapers strands/strokes for depth. Each layer has its own colour/background, opacity, arms/density, speed/direction, throb, zoom, thickness, blur and curve. Some spiral-specific controls, such as curve, do not affect the other geometric styles. The one-arm closing-line fix remains included.

Ranges include arms 1–32, spin 0–12, throb speed 0–5, strength 0–0.6, zoom 0.25–6, thickness 0.01–0.99, blur 0–50 and curve 0–12. Settings persist locally; existing presets are normalized with new features initially off.

## Focus

**Focus** provides a glowing center spiral or slowly rotating collar ring, periphery darkness and blur, and an optional tunnel that tightens over 5–300 seconds to a chosen final opening. Words render over the fixation point. The opening is a screen-relative radius, not a physically calibrated 30-degree visual cone; physical angle depends on monitor size and viewing distance. A radius around 0.3 is the starting setting.

Gentle colours interpolate between purple and pink by default. Choose heartbeat, isochronic rate, or the difference between left/right tone frequencies as the rhythm source, and choose beats per colour cycle. A colour cycle is limited to two seconds or slower. When local audio is running, the visual rhythm uses its clock; otherwise it uses the visual clock. A draft preview has an independent clock.

Blur applies to the game behind the overlay as well as the rendered visual layers outside the opening. These optional focus effects stay out of the chat area. Browser support for backdrop-filter is required to blur the underlying game.

## Audio

In **Audio**, enable the audio layer, turn Effects on, and click **Start audio on this device**. Audio starts quiet and requires a local browser gesture after each load. A controller cannot provide that browser gesture remotely. **Mute audio** is always a local device control. Sound pauses while the tab is hidden; a browser may require Start audio again after suspending its audio context.

Available simultaneous layers:

- Left/right sine tones: independently adjustable 40–1000 Hz frequencies, shared tone level and a master level. Use stereo headphones to keep each tone in its intended ear.
- Isochronic pulse track: carrier frequency, 0.1–30 pulses per second, on-time fraction, and level.
- Three original, synthesized ambient music loops: **Velvet chords**, **Slow drifting bells**, and **Rain & warm pads**. These are procedural loops, not commercial recordings or downloaded music.
- Heartbeat: 30–180 BPM with its own level.
- Breathing: inhale, exhale, pause durations and its own level.

**Listen to selected draft locally** lets a controller hear the draft on their device without sending its settings. Start audio is still required. The visual preview remains separate. Changes to audio settings rebuild the sound mix with a short fade; no audio files, microphone input or speech are transmitted. Frequencies are configurable sound effects, without a claim of psychological or medical effectiveness.

Audio playback readiness and draft-listening choice are never persisted. Permanent access can preserve the audio settings, but autoplay restrictions still require a local click after reload.

## Words and pulse

Enter up to 40 messages, one per line, 160 characters each. Layouts: center, wall, lines, typewriter, random positions, or center + periphery. Duration supports 0.001–30 seconds; gap supports 0–30 seconds, both in 0.001-second steps. Actual visible timing is limited by browser rendering and screen refresh rate, so a 1 ms setting cannot guarantee a visible 1 ms flash.

Pulse/flash supports fixed, random, or word-synchronized timing; duration 0.05–10 seconds; interval/random bounds 2–300 seconds; start delay 0–60 seconds; delay after a word 0–5 seconds; and every Nth message (1–20). Timing uses 0.001-second increments. Pulses remain at least two seconds apart and cannot overlap. Delayed triggers can be skipped while a previous trigger is pending.

## Profile requests and permissions

Open another player's profile and click the Hypno Reverie headset icon. The menu shows whether their addon is detected in the current room; discovery can take up to 15 seconds. Choose requested access, duration, and optional permissions, then **Request keys**. The receiver sees the complete terms and chooses **Yes** or **No**. Requests expire after two minutes and are rate-limited. They never grant access automatically.

Access levels:

| Level | Control |
| --- | --- |
| Visuals only | Spirals, patterns, focus and head appearance |
| Visuals + words | Also word/message settings |
| Full session + control lock | Also effects on/off and locking normal receiver controls |

**Pulse/flash**, **audio**, and **facial expressions** each require their separate checkbox at grant time. Colour-rhythm settings are covered by pulse permission. The wearer-view permission for head effects can be changed by a granted controller. Player-area width and local playback/view preferences are not remote controls.

A grant shares the current settings/message list with its controller. Controllers edit a draft and click **Send changes**; the acknowledgement confirms application. **Preview draft** does not transmit edits. Face changes use their separate Apply expression button. The controller role is self-declared and does not derive from game reputation.

Timed grants last 1–30 minutes and clear when the room session ends. **Permanent access** remembers that controller's member number, permissions, effects-on state and lock state for this account/browser. It survives room changes, disconnects and reloads; it does not rely on Keep effects on being checked. Commands still require both characters to be in the same room. After reconnecting, the addon issues fresh session tokens; tokens are not stored in local storage. Reloading the controller also triggers fresh keys when both addons discover each other.

**Return keys** ends permanent access as well as timed access. Explicit revocation also clears the stored permanent grant. Normal Stop/revoke buttons are disabled while another player holds keys. Escape stops/revokes only while unlocked; it does nothing during a lock. Alt+Shift+S toggles effects only while unlocked. These are client-side game controls; they do not prevent closing or reloading the browser. Only one controller holds your keys at a time.

## Facial expressions

The **Face** tab reads the character's supported game choices for mouth, eyes, eyebrows, blush and tongue where those groups are available. Select a group and expression, then **Apply expression**. A controller needs the expression permission. Unsupported options and game-disallowed expressions are rejected on the receiver, including restrictions from equipped items. Default resets the chosen group; expression changes are not continuously forced and are not restored from presets. No items are equipped or removed.

The implementation uses the game's CharacterSetFacialExpression and CharacterIsExpressionDisallowed APIs, checked against the [public game source](https://gitgud.io/BondageProjects/Bondage-College/-/blob/master/BondageClub/Scripts/Character.js). Actual available choices depend on the character and current game version.

## Head effects

Tiny words, forehead spirals, spiral eyes, and a halo are independently configurable. They require Effects on and follow the standard character view's positions. Map/custom views omit head effects; unusual poses may need alignment sliders.

A controller's enabled head effects are automatically shared during the grant. Manual sharing remains available for local sessions. Sharing sends appearance and the currently displayed word, roughly once per second, not the complete message list. Very brief messages may not appear in perfect sync. Other viewers can hide shared head effects locally; people without the addon do not see them.

**Show my head effects** starts off. During a grant it is disabled unless the controller checks **Allow wearer to view head effects** and sends that change. Permission does not turn it on automatically; the wearer chooses to enable it. Revoking permission hides it again. Its on/off state is not persisted across sessions. Outside a controlled session the wearer can choose it locally. Draft previews always display a sample character's head cosmetics.

## Presets and local persistence

Up to 24 named presets save visual, word, pulse, focus, audio and head settings. They never save keys, locks, expression actions, device-audio readiness or wearer-view preferences. Loading a preset does not turn effects on, and cannot bypass granted permissions.

For sessions without permanent access, **Overview → Keep effects on across room changes and relog** remembers activation when the addon loads again. With it off, room transitions stop the local overlay. An explicit Stop or effects-off action is remembered. Permanent access separately preserves the state requested by its controller. Local data is browser/game-origin specific and is not synced between devices.

## Photosensitivity

Flashes and moving patterns may trigger seizures in people with photosensitive epilepsy. Avoid effects that are a trigger for you and stop if you feel unwell. The pulse limit does not guarantee safety. The in-menu notice links to the [Epilepsy Foundation](https://www.epilepsy.com/what-is-epilepsy/seizure-triggers/photosensitivity).

## Verification and limitations

Isolated Chromium two-player tests cover normalization, token/sender checks, replay rejection, separate permissions, profile requests, permanent room/reload/controller-reconnect behavior, head visibility, expressions with game restrictions, presets, text/pulse timing, preview, layout and cleanup. Tests check stereo tone routing using OfflineAudioContext, generated-signal bounds, pattern rendering and the single-arm spiral geometry.

Live Firefox testing with a partner is still required, particularly audio balance, expression availability and head alignment. The visual preview uses a sample figure and its own clock, not a capture of the receiver's screen. No external audio backend or analytics. Network control uses targeted Hidden game messages; discovery and enabled head cosmetics are room broadcasts.
