# Hypno Reverie

Version **0.9.2**, by Jaxx-01-ai. Customizable visual and audio layers for Bondage Club. The visual overlay remains clipped to the left player area and allows game clicks through. This is a wearable and privacy test release. The existing FUSAM submission remains for v0.6.0.

## Compatibility fixes retained from 0.8.1

The addon registers with BC Mod SDK as **Hypno Reverie**, including its version and repository. This makes its metadata available to SDK-aware addon lists; the particular LSCG/BCX list UIs have not been tested live.

Incoming addon packets now use **ChatRoomRegisterMessageHandler** at priority -50, after the game's ghost-list filter (-200) and before native hidden-message processing (-1). There is no direct ChatRoomMessage socket listener. Unrelated messages pass through unchanged. If the message-handler API is unavailable, remote messaging stays disabled instead of falling back to a raw socket listener.

Ghosted players (and, from 0.8.4, blacklisted players) cannot send accepted addon requests, control updates, expressions, or shared head effects. Ghosting an active controller revokes their keys, including permanent access, and stops their remote session on the next one-second network tick. The addon also prevents direct outgoing messages to ghosted players and drops their cached peer state. Unghosting does not restore revoked keys. Unloading removes only this addon's handler and SDK registration.

There is no jQuery dependency. The small local DOM helper was renamed from dollar-sign notation to **byId** to make that clear.

## New moan clips (0.9.2)

- **Seven new vocal clips** (adult): slow, voiced moans made for trance: melting, humming, purring, rhythmic trance, aching, deep and throaty, and sleepy and drifting. Pick one under *Vocal sounds (adult)*, or choose the new **Mix: slow and hypnotic** to shuffle them. They are also part of *Mix: all* and *Mix: ungagged*. Upload the new files in assets/vocals/ (melting, hum, purr, trance, ache, deep, drift).
- The preset list now shows a built-in preset ready to load instead of a greyed-out *No presets saved yet*.

## Authority, keys, audio, imagery, presets, simpler menu and smaller download (0.9.0 and 0.9.1)

- **Authority tab** (standing, role-based access like BCX): for each part of your overlay (See settings; Spirals, focus and head effects; Words; Pulse and flash; Audio; Imagery and pacer; Facial expressions; Turn effects on and off; Change these permissions) you choose the **lowest role with access**: Owner, Lovers and above, Whitelist and above, Friends and above, Anyone, or Nobody. Roles come from your game lists. People with access need no keys and no requests: your overlay appears for them under **Edit** (marked "authority"), or they open your profile, change what they hold, and press Send changes. Defaults: Nobody for everything. Ghosted and blacklisted players never have access.
- **Self** (per part): whether you can use that part yourself. Untick it to lock yourself out: with *See settings* off your own settings are hidden; with *Turn effects on and off* off you cannot switch effects off, and Escape and Alt+Shift+S stop working; with *Change these permissions* off you cannot edit the Authority table or who can request keys; with *Imagery and pacer* off you cannot add or remove your links. Someone with *Change these permissions* can edit the table from their side (including your Self switches), but only parts they hold themselves, and never in a way that removes their own access. You cannot switch off your own Self for *Change these permissions* while nobody else has it.
- **Keys** stay a quick, temporary way to hand control to anyone, with no formal relationship. You choose who may send key requests (by role). Several people can hold keys at once; each can only change what their own keys allow, the latest change wins, and your controls stay locked while anyone with full-session keys has them locked. Full-session keys also cover imagery. Permanent keys are saved for each holder (older saved permanent access is migrated automatically). A controller can hold keys to several players at once and switch between them with **Edit**.
- **Imagery** (adults only, JOI-style): add links to your own images or videos (jpg, png, gif, webp, mp4, webm; https only, up to 60) and tag each with a category (mouth, chest, rear, feet, body, other). The links stay in your browser and only you see them; controllers can switch imagery on, pick a category and change how it looks (timing: cycle on a timer, flash with each word, or stay on screen; order; duration, gap, fade; opacity, size, position; blend mode; under or over the spiral), but never see or add links. Videos play muted and looped. Some sites block showing their files elsewhere; use direct links from a host that allows it.
- **Built-in video pack** (adults only, suggestive, not explicit; on by default once imagery is switched on, untick *Use the built-in video pack* to use only your own links): short silent seamless loops in assets/imagery, sorted into the same categories: mouth (lip bite, drooling ball gag), chest (latex corset, lace with heart lock, and six oiled bouncing-chest clips: bikini, latex bra, oil pour and a pink latex jiggle, three of them widescreen), rear (latex leggings, lace and garters), feet (locked heels, stocking soles), body (latex catsuit, rope-bound wrists, hypnotic spiral eyes). Made with Higgsfield. The figures are cut out from their backgrounds (transparent WebM), so they sit cleanly over the spiral; Safari, which cannot show WebM transparency, gets the MP4 version on black (use the Screen blend there). *Position* now defaults to **Fit the whole area**, which suits the Full screen spiral option.
- **Words**: choose a font (clean, rounded, classic serif, elegant italic, small capitals, script, handwriting, heavy bold, condensed, thin, typewriter, monospace, gothic; built from fonts already on your computer, nothing is downloaded) and a colour mode: one colour, switch colour with each word, fade between two or three colours, or rainbow, with a speed setting.
- **Flashes**: new effects (instant on/off flash, fade in then cut, double flash, heartbeat) and styles (whole area, edges only, glow from the centre, expanding ring). The safety limits stay: at most one flash every two seconds (double and heartbeat stay within that spacing) and opacity no higher than 45%.
- **Beat pacer**: a pulsing ring or a bouncing bar that sets a pace on screen, at its own tempo or following the wet rhythm (including its building mode). Pair it with your words and clicker trigger words for instructions.
- **Audio**:
  - **Sound starts by itself** when the audio layer and effects are on, including when a controller turns them on: no Allow sound click needed (browsers allow it once you have clicked in the game, e.g. to log in; otherwise it starts on your next click or key press). Mute still silences it on this device until you press Allow sound, and you can untick automatic start. With Self off for Audio (Authority tab) you cannot mute or turn automatic start off.
  - **Breathing** is rebuilt to sound like air through the mouth or nose, with four slightly different breaths per loop; *Breathing style*: through the mouth, through the nose, or sighing (soft voice). It still follows your inhale/exhale/pause timings.
  - **Binaural beats**: choose a beat (2 and 3 Hz delta; 4, 5, 6 and 7 Hz theta; 7.83 Hz; 8, 9, 10, 11 and 12 Hz alpha; 15 Hz beta; 40 Hz gamma) on a 200 Hz carrier. 6 Hz theta is the recommended trance beat.
  - **Move sounds slowly between ears**: breathing, background, vocals and other sounds swing gently left and right (headphones); the binaural tones stay put so the beat is not disturbed.
  - **Background sound** adds pink noise, brown noise, ocean waves, a warm drone and singing bowls (all seamless loops).
  - **Clicker / bell**: training clicker, double click, wood tick, small bell, three-note chime, tingsha cymbals, deep bell, gong. Ring every few seconds, on every word flash, or only on certain words (your trigger list; whole words or phrases, any case, punctuation ignored).
  - **Vocal sounds (adult)**: recorded clips in assets/vocals/, trimmed and levelled automatically, with single clips or shuffled mixes (all, ungagged, gagged, slow and hypnotic) and a pause between clips. New in 0.9.2: seven slow, voiced moan clips made for trance (melting, humming, purring, rhythmic trance, aching, deep and throaty, sleepy and drifting), also in the *Mix: slow and hypnotic* set. Menu entries whose clips are not in assets/vocals/ yet are skipped.
  - **Wet rhythm (adult)**: a synthesized rhythmic layer with tempo, wetness and level; *Building* speeds up over a minute, then starts again.
- **Clothing removed**: the latex hood, latex catsuit (top and bottom) and straitjacket restyle are gone; the **Hypno Reverie Headset** is the only wearable. Items already worn simply show the game's normal artwork. Older notes about the hood, catsuit and straitjacket below are kept for history.
- **Easier menu**: a **Reset tab** button on the top bar resets the tab you have open (Primary, Secondary, Words, Pulse, Audio, Focus, Imagery). Removed to keep things simple: player-area width, spiral arms (always 1), separate left/right binaural frequencies, tunnel tightening duration, beat-synced focus colours and fixation glow. Options that do not apply are hidden (for example the trigger-word box only appears when the bell/clicker rings on certain words, and is now titled *Trigger bell/clicker on these words*). Typing in the menu no longer jumps to the chat box.
- **Simpler controls**: spirals keep their Thickness, Thin towards center, Blur, Throb speed and Throb strength sliders, with **Line style** and **Throb** quick picks above them that set those sliders in one go. Isochronic pulses are a single switch (a half-second 180 Hz tone every 2 seconds). The heartbeat offers 50, 55, 60, 65, 70 and 75 bpm (and a racing 110). Every number shows its unit (%, s, px, Hz, bpm, ×) and moves in 0.01 steps. Settings that belong to a feature that is off, or a mode that is not chosen, stay hidden. Head alignment sliders sit under *Advanced*; Preview draft appears only when you edit someone else's overlay. Older saved settings keep their exact look.
- **Spirals drawn like real hypnotic spirals**: one centre, reaching past every edge (no repeating tiles or seams), with a *Spiral type*: **Classic** (even bands, like a hypno disc) or **Endless tunnel** (logarithmic, bands widen outward so turning reads as an infinite zoom). *Turns from centre to edge* replaces *Spiral curve*; spin is shown in rpm. New default: 5 turns at about 9.5 rpm. Research on the spiral after-effect (the drawing-in sensation and the warped vision afterwards) finds it strongest at a fairly slow inward drift of the bands and weaker when spirals spin fast, so more turns at a slower spin beats few turns at speed. Large high-contrast stripes are a known photosensitivity trigger, so spirals stay partly see-through by default.
- **Smoother**: sounds are generated in a background worker and kept for reuse, so loading a preset or changing an audio setting no longer freezes the game (it used to stall for up to about 3 seconds); spiral blur is baked in once instead of blurring the screen every frame; the focus-tunnel blur works at quarter resolution; text layouts that draw many copies skip shadows; the overlay is capped at about 2.4 megapixels on very large or high-DPI screens.
- **Text wrapping** breaks between words (a word is split only if it cannot fit on a line by itself); the typewriter layout lays out the whole sentence first so words do not jump between lines; the Lines layout shrinks long sentences evenly instead of squashing them; blocks taller than the area shrink to fit.
- **Candle** stands up from the bottom edge, its flame flickering just above the centre.
- **Binaural beats inside the music**: with a tonal background (velvet chords, drifting bells, rain and pads, warm drone, singing bowls) the beat is carried by the music itself - the right ear hears the music pitched up by the beat - instead of separate tones. With noise backgrounds or none, the plain 200 Hz tones are used.
- **More word layouts**: grow from small, slow fade in and out, breathing (gently swells), slowly turning, tunnel (echoes sinking inward), large echo behind, stacked column, and centre with four corners. Random positions now slide long words and lines inward instead of cutting them off.
- **Imagery from your computer**: besides links, *Or add from this computer* stores images and videos inside this browser (up to 80 MB each); only you see them, and they stay until you remove them.
- **Focus**: new fixations: a **swinging pendant**, a **candle flame**, and a **breathing guide** that grows and shrinks with the breathing timing (and stays in step with the breathing sound).
- **Built-in presets** for everyone (Presets tab, load-only): **Dronification, Bimbofication, Dollification, Obedience, Submission**. Each follows a classic induction structure: eye fixation on a moving object and true statements that build agreement; breathing paced at about six breaths a minute with a longer exhale; a ten-to-one countdown; fractionation (surface slightly, then drop twice as deep); core suggestions ending in first-person mantras; and a reward phrase (for example *Good girl*, *Good drone*, *Good doll*) always paired with the same bell, for conditioning. They add a theta beat carried by the background music, a slow heartbeat or isochronic metronome, sounds moving between the ears, word-synced soft pulses and a focus tunnel that tightens over four minutes. Load one, then switch Effects on.
- **Simpler menu layout**: 7 tabs instead of 13. **Overview** opens with a three-step *Quick start* and one **Intensity** slider that turns spirals, flashes, words and sound up or down together (20% to 150%). **Presets** sit in a row at the top (pick, Load, Save as..., Delete). **Spirals** holds both spirals, with the second spiral and Focus (tunnel and fixation) as folding sections; **Words** includes Pulse and flash as a folding section; **Body** combines head effects and facial expressions; **Audio** is grouped into folding sections (Beats and tones, Background, Body sounds, Adult sounds, Bell and clicker). The menu starts in a basic view with the main settings only; tick **All settings** on the top bar to see every slider. Reset tab resets everything on the tab you have open.
- **Preferences > Extensions** shows the **Authority** settings right on that page (Keys > Authority settings opens them in a small window too). The window can switch between your overlay and players whose authority table you may edit.
- **Fix: permanent keys and "Keep effects on" survive a reload when the addon loads before login** (as FUSAM does).
- **Smaller download**: the script is now about 175 KB instead of 3 MB. The headset artwork lives in **assets/** (lossless WebP, content-hashed name); vocal clips in **assets/vocals/**, videos in **assets/imagery/**.

## Menu and spiral placement (0.8.9)

- **Show spiral on** (Primary tab): Player area (the default, left of the chat, with the width slider), Chat area, Whole game screen, or Full screen. It's a personal setting saved in this browser: presets and controllers with keys never change it. Clicks always pass through to the game. The chat-covering modes can make chat text harder to read, so lower the opacity if needed.
- The tab strip wraps onto two rows instead of scrolling sideways, so every tab is visible.
- A green dot marks each tab whose part is switched on (primary, secondary, words, pulse, audio, focus). The Overview explains how Effects on relates to each tab's own switch.
- The footer no longer says "Room changed. Remote keys cleared." when the addon first starts.
- Friendlier labels: Spin speed and Throb speed no longer show radians/cycles units.
- Audio: the start button is now "Allow sound in this browser", with a note explaining it, the audio-layer switch and Mute.
- The Words box shows example lines, the Presets list says "No presets saved yet" when empty, and the Keys tab note reads "Both players need Hypno Reverie 0.6 or newer."

## Catsuit artwork (0.8.8)

The Hypno Reverie Latex Top and Bottom now use one Higgsfield render per game layer: every Top pose (standing, arms over the head, elbow touch, back cuffs, box tie, yoked, all fours, hogtied) and every Bottom pose (standing, legs closed, spread, kneeling, kneeling spread), each at all four breast sizes. Each render was made from the game's own layer and is drawn at that layer's position, clipped to the game's outline. Nothing is moved, stretched or warped. Where a render falls slightly short of the outline, that edge shows as plain deep black latex.

Notes: all 56 layers have their own render. The sleeve cuffs use the standing Top render of the same size. The lower body in hogtied and all fours, and EchoV2 where its outline differs, keep or fall back to the earlier glossy restyle. The native Shine layer is replaced by the renders' own highlights.

## Straitjacket fit (0.8.6)

The Hypno Reverie Latex Bolero now uses pre-fitted artwork for each breast size: a cleaned latex outline plus its own strap set (collar O-ring, buckle, centre strap, under-bust O-ring and strap, arm buckle, tail). The native metal layer is replaced. The crossed arms keep the same sideways position at every size and sit just under that size's breasts. The chest opening follows a smooth neckline above the breasts, with the arms and under-bust piece wrapping the bottom and sides. On XLarge, small points can show at the outer top corners of the opening.

## Hood artwork (0.8.6)

The hood's surface was re-rendered with Higgsfield and fitted to the same Custom Latex Hood outline on both Original and EchoV2. The mouth opening is 25×18 game pixels, about 2 pixels inside the Big Lips Gag's lips on every side, so the latex slightly overlaps the gag's lips. It is centred where the 0.8.5 opening was. The hood's code and settings are unchanged from 0.8.5.

## Hood update (0.8.5)

The Hypno Reverie Latex Hood is now a skin-tight hood that follows the head. It is built on the native **Custom Latex Hood**, which supplies its position, settings and effects. The artwork is all new.

- **Shape:** a smooth egg-shaped outline traced from a straight-on reference photo of a tight latex hood and scaled to the game head. It is widest around the temples and stays full past the cheeks, then tapers to a narrow rounded chin about 8 px below the game chin, so the chin sits a little further under the mouth. It covers the whole head and ears, with 1–2 px of latex thickness. Original and EchoV2 each have their own outline. It no longer uses the native hood outline.
- **Face and surface:** the artwork comes from the author's own edited EchoV2 hood, recovered at full sprite resolution and fitted onto the Original head with a smooth warp. It is cleaned up with light edge-preserving denoising and sharpened (fine and mid-scale), with slightly deeper blacks. The sprite matches the game's own character resolution, which is the most detail the game can draw.
- **Mouth edge:** the latex meets the lips directly, with no rolled rim. The opening is trimmed about half a pixel wider than the measured lips.
- **Mouth opening:** lip-shaped, about 29 × 22 game pixels, just below the nose, at the lips' measured position. The reference's nose and face line is moved over it. It was measured from an in-game screenshot of the Big Lips Gag, so a lips item or the character's own mouth shows through it. The Big Lips Gag is not a base-game item, so its exact art was not available. Its size and position come from that screenshot.
- **Buy the native base:** you need the **Custom Latex Hood** (ItemHood), not the Latex Hood. The picker entry appears only if you own it.
- **Re-equip it.** A hood already worn from the old Latex Hood base is not migrated.
- **Default settings:** mouth Shaped, eyes Round, opaque head, **hair hidden** (front and back), no zipper. It does not block vision by default. The artwork always shows covered eyes. To block vision, pick an eyes option such as "No Eyes" in the item's native settings. The native hair setting can show the hair again, but loose hair drawn over a tight hood will look odd.
- **Ears:** the hood encloses the ears and the native item blocks the ears slot. The old local ear masks are gone.
- **Colours:** the material uses fixed black tones. Native colour controls do not affect it.
- The included hood-fit.png is an isolated rendering check, **not a live game screenshot**. Lip alignment with real mouth items, eye types, hair accessories, other head attributes and every pose still need in-game testing.

## Privacy fix (0.8.4)

Blocked players are now handled the same way as ghosted ones, and more strictly. The addon checks the game's **GhostList** and **BlackList**, plus the game's own ghost-list and blacklist methods where they exist. If a permission check throws an error, the player is treated as blocked.

- Incoming addon messages from blocked players are dropped, and outgoing targeted messages to them are not sent.
- Cached peer state, head effects, key requests, received grants and selection or profile views for a blocked player are cleared on the next one-second network tick.
- If a blocked player holds your keys, whether timed or permanent, access is revoked and the saved permanent grant is deleted.
- A saved permanent grant from a blocked player is discarded at startup instead of being restored.
- Unblocking someone does not restore revoked access. Grant it again.
- Cleanup is skipped while no player is logged in (for example mid-relog), so a transient state cannot erase saved permanent access.
- Room broadcasts (discovery and enabled head effects) cannot exclude individual recipients, so a blocked player in the same room can still receive those broadcasts. They cannot control you.

Validated with isolated tests of the blocked-member check and cleanup logic (blocklists, native methods, a throwing check, no-player handling, and cache and grant cleanup). **Live game testing has not been done.** Please test: blocking a controller mid-session, blocking a permanent controller and then relogging, and unblocking afterwards.

## Wearable fixes (0.8.3)

The clothing picker previously displayed the custom name but dropped its crafting data when equipping it. The addon now preserves that data through the native wardrobe path. Ordinary and custom clothing also have separate previews. Native ownership, permission and lock checks remain in use.

| Picker | Item | Native base to own |
| --- | --- | --- |
| Blindfold / eyes (ItemHead) | Hypno Reverie Headset | Interactive VR Headset |
| Hood (ItemHood) | Hypno Reverie Latex Hood | Custom Latex Hood |
| Arm restraints (ItemArms) | Hypno Reverie Latex Bolero | Bolero Straitjacket |
| Upper suit (Suit) | Hypno Reverie Latex Top | Latex Catsuit |
| Lower suit (SuitLower) | Hypno Reverie Latex Bottom | Latex Catsuit |

These items appear in the normal native pickers, not in the addon menu. They consume no crafting slots. Buy the native base if an entry is absent. The addon does not automatically equip, remove or migrate items.

**After updating, re-equip the named Hypno Reverie top and bottom.** They now use LatexCatsuit instead of SeamlessCatsuit. An old equipped SeamlessCatsuit is not silently changed. Re-selecting an already-worn custom item opens its native settings.

### Artwork and fitting

The headset is unchanged. The hood is described in **Hood update (0.8.5)** above.

The bolero uses the native collar, shoulders and size-specific breast cutouts. The surface art is clipped to those silhouettes. Its upper shoulder texture is now fitted column by column to the native shoulder edge, correcting the lower inner outline caused by the taller concept-art collar. A three-pixel extension at the upper shoulder edge closes the measured collar-to-shoulder gaps, especially on EchoV2; the chest openings remain unchanged. The collar uses a shallow rounded upper edge with its lower edge anchored to the shoulders; the previous pointed jaw-shaped extension was removed. Native belts and hardware render in their own layers. The bolero retains its normal BackElbowTouch pose, locks and restraint behavior.

The catsuit now uses the native Latex Catsuit artwork with a glossy black material treatment. It is **not an exact reproduction of the earlier high-resolution concept art**. Native chest contours, four breast sizes, lower sizes, masks and pose layers provide the fit. No new horizontal waistband is drawn. Separate garments and native shading can still make their boundary visible in some combinations.

Original AllFours uses its dedicated native upper artwork. EchoV2 follows the game's Hogtied upper mapping because a dedicated EchoV2 AllFours Latex Catsuit file is unavailable. The lower Hogtied pose uses the available native Seamless Catsuit silhouette as a fallback. These mappings affect only the named custom clothing and leave the source assets unchanged.

The material uses fixed black and silver-gray tones. Native color controls affect fallback and separately rendered hardware layers, not the custom material itself. Other players need this version of the addon to see the same custom render; without it they see the native base item.

### Validation and limitations

- 112 native garment layers checked across Original and EchoV2, all four sizes and the downloaded upper/lower pose variants. Native alpha is preserved except for the fitted collar and explicitly tested shoulder extension; draw options are preserved.
- Shoulder diagnostics include the posed BodyUpper, ArmsLeft and ArmsRight layers without a catsuit hiding gaps, with their outlines drawn over the jacket for direct comparison. The assembled clothing preview also applies the native bolero masks to the underlying suit. No exposed cyan pixels remain in the tested upper-shoulder region on either body across all four sizes.
- Hood previews verify placement on both body styles through the real draw hooks, with unrelated-item isolation and unload cleanup.
- A regression test first reproduces the craft-loss bug using the game's actual AppearanceClick and AppearancePreviewBuild functions, then verifies custom equip, separate previews, permissions, locks and cleanup.
- Existing overlay, audio, session, SDK, native message-bus and ghost-list regression checks passed in isolated Chromium fixtures.

Black strap and silver hardware colours in the assembled preview are approximations; the live game applies its native colour rendering. Included screenshots are isolated rendering checks, **not live game screenshots**. Live Firefox, multiplayer rendering, other outfit combinations and every composite pose still need in-game testing. The headset/hood start cosmetic; native settings can enable vision blocking. Native lock restrictions remain in force.

### Installation

Upload hypnoreverie.js, README.md, bookmarklet.txt, MOD-SDK-LICENSE.txt **and the whole assets folder (including assets/vocals)** to the existing repository root. From 0.9.0 the artwork and vocal clips are not embedded in the script. Keep the existing bookmark, reload the game after GitHub Pages deploys, and load the addon again. Verify version 0.9.2. Re-equip the hood from the Custom Latex Hood base. If you are updating from before 0.8.3, also re-equip the named top and bottom.

This package has not been published automatically. The FUSAM submission is unchanged. BC Mod SDK 1.2.0 supplies the hooks. Native reference artwork is loaded from the game, is not bundled in the deployed script, and retains its upstream authorship and licensing.

## Update

Upload **hypnoreverie.js**, **bookmarklet.txt**, **README.md** and the **assets** folder to the root of Jaxx-01-ai/HypnoReverie, replacing those files. Keep GitHub Pages on main/root. Wait for deployment, reload the game, and click your existing bookmark. Both players should use v0.8 to see the new wearable appearances. Older session keys are not migrated into permanent grants; grant access again after updating.

The bookmark is unchanged. Its complete URL is in bookmarklet.txt. After a reload, the bookmark must still be clicked unless an addon loader is already configured. Persistence does not install an automatic loader.

Open the addon from Preferences > Extensions, the headset icon in your own or another player's profile, your bookmark, or Alt+Shift+H. Drag the title bar to move the menu; use ↔ for compact mode or drag its lower-right corner to resize. The preview window has its own draggable title bar.

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
