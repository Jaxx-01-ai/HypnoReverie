# Hypno Reverie

Version **0.3.0** — a customizable hypnosis-themed visual overlay for Bondage Club, by **Jaxx-01-ai**. Effects stay within the left player area and allow game clicks through.

## Install / update

Upload **hypnoreverie.js**, **bookmarklet.txt**, and this **README.md** to the root of Jaxx-01-ai/HypnoReverie, replacing the previous versions. Keep GitHub Pages set to main / root. Wait for deployment, then reload your game and click the bookmark. Reloading unloads the previous version. The bookmark URL is unchanged. The headset logo is embedded in the JavaScript; no separate image upload is needed.

Create a Firefox bookmark named Hypno Reverie and paste this entire line into its URL field:

```javascript
javascript:(()=>{if(window.HypnoReverie){window.HypnoReverie.open();return;}if(document.getElementById('player-spiral-addon')){alert('Reload the game, then click Hypno Reverie again to load the update.');return;}if(document.getElementById('hypnoreverie-loader'))return;const s=document.createElement('script');s.id='hypnoreverie-loader';s.crossOrigin='anonymous';s.src='https://Jaxx-01-ai.github.io/HypnoReverie/hypnoreverie.js?_='+Date.now();s.onload=()=>s.remove();s.onerror=()=>{s.remove();alert('Hypno Reverie could not load. Check the published script URL.');};document.head.appendChild(s);})();
```

Open your own player profile and click the **headset/spiral icon**, or press **Alt+Shift+H**, then check **Effects on**. The menu has fixed tabs across the top and a scrolling settings area. There is no launcher on the main player screen. Clicking the bookmark again also opens the menu. Appearance settings save locally per game server. Effects always start off after a reload. Previous v0.1 appearance settings are migrated on first use.

## Visual controls

Primary and secondary spirals each have independent enable, colour, background colour/opacity, spiral opacity, arms, spin speed/direction, throb speed/strength, zoom, thickness, blur and curve. The primary tab also contains the width adjustment, limited to the left player area. The secondary spiral starts disabled.

## Text

Enable text in the Words tab. Enter one word or sentence per line in **Edit messages**. Up to 40 messages, 160 characters each. Click outside the editor to apply it. Choose centered messages, a repeating wall, repeated lines, Write/typewriter, random positions, or alternating center + periphery. Random positions are chosen once per message and remain within the player area. Colour, opacity, duration in seconds, inter-message gap, font size and line count are adjustable. Optional random order is available. The term subliminal describes the brief display mode; no claim of psychological effectiveness is made.

## Pulse / flash

Choose a soft pulse or a flash that fades out, with fixed intervals, random intervals, or synchronization to text messages. Colour, opacity and duration are adjustable. Pulses are limited to one every two seconds or slower; very fast text will not trigger a flash for every message. Pulse duration cannot overlap a new pulse. Start low; stop if the effect is uncomfortable. Pulse starts disabled.

## Giving someone the keys

Both players must load v0.3 in the same room.

1. The controller opens **Keys** and checks **Available as a dominant/controller**. This role is self-declared; it does not use the game's dominance reputation.
2. The receiver opens **Keys**, selects that player by name and member number, chooses permission and duration, and clicks **Give keys**. **Find players** refreshes discovery.
3. The controller selects the receiver under **Edit**, adjusts their draft, and clicks **Send changes**. An acknowledgement confirms it was applied.

### Permission levels

| Level | Allowed |
| --- | --- |
| Visuals only | Edit both spirals and head spiral appearance |
| Visuals + text | Edit spirals, text/messages and head effects |
| Full session + control lock | Edit spirals, words and head effects; switch effects on/off; lock receiver controls |

Pulse/flash changes require the receiver's separate **Also allow pulse/flash changes** checkbox at grant time. Remote users cannot move the overlay into chat or change its width.

Granting access shares the current effect settings and message list with the selected controller. One player can hold keys to your overlay at a time. Grants last 1–30 minutes or **No time limit**, are not saved, and are cleared when the room changes, either player leaves, the receiver disconnects, or the other addon stops announcing itself (up to 45 seconds). No time limit lasts for the current room session; it does not survive reloads or disconnects. Opening your player profile preserves the grant. **Return keys** ends a controller's session.

**Stop / revoke** is inside the Overview tab. Stop/revoke and re-grant controls are disabled while someone holds your keys. **Escape stops and revokes only while unlocked; Escape is inactive during a control lock.** A controller can unlock or return keys. Room exit, disconnect, expiry, and reloading clear access. Alt+Shift+S toggles effects only while unlocked. This is a voluntary client-side game feature, not a restriction on closing or reloading the browser.

## Presets

Use **Presets** to name and save up to 24 appearances, load one, replace one by saving with the same name, or delete it. Presets include both spirals, words, pulse and head effects. They never save grants, locks, effects-on state, or sharing/privacy switches. Loading a preset does not start effects and is disabled for a locked receiver. Controllers can load presets into a remote draft; the receiver's granted permissions still limit what applies. Presets are saved only in this browser's local storage for the current game origin.

## Head effects and room sharing

The **Head** tab has independent tiny words, forehead spiral, spiral eyes, and spiral halo switches, with colour, opacity, size and alignment controls. Words can orbit or appear at changing positions. Head effects require Effects on. They use the configured message list and timing, even when full-screen words are disabled.

Enable **Share my head effects with the room** to let other v0.3 users see them. Sharing starts disabled. This sends head appearance and the currently displayed message through the game server, approximately once per second; very brief words may not appear in sync for other users. It does not broadcast your full message list. Granting control separately shares the list with that controller. Controllers cannot turn room sharing on for you.

Viewers can turn off **Show other players' shared head effects**. An unlocked Escape also hides shared head effects locally until that viewer re-enables the option. This switch remains a local preference even while other controls are locked. Users without Hypno Reverie do not see these effects.

Head positioning currently supports the standard character view, including room zoom and rows. Map/custom views omit head effects. Alignment sliders can compensate for unusual poses; live-game positioning needs testing. No equipped items or character appearance are changed.

## Photosensitivity

Flashes and moving patterns may trigger seizures in people with photosensitive epilepsy. Avoid these effects if they are a trigger for you; stop if you feel unwell. The pulse rate limit is not a guarantee of safety. The menu includes a short notice linking to the [Epilepsy Foundation](https://www.epilepsy.com/what-is-epilepsy/seizure-triggers/photosensitivity).

## Testing status

Automated core and isolated two-player Chromium tests cover settings limits, chat clipping, text modes, rendering, permission levels, targeted control, acknowledgements, token/sender checks, replay rejection, expiry, indefinite grants, locked/unlocked Escape, presets, profile launcher, shared head visibility, room change, disconnect, duplicate loading and cleanup. Live Firefox and real server two-player testing are still required.

Test locally first, then test with one trusted partner using visuals-only access before trying a full session. Verify that Escape does nothing while locked, returning keys stops the session, and leaving the room or disconnecting clears access. Test profile alignment and sharing with a partner. This build has not been submitted to FUSAM.

## Implementation / privacy

No game function replacements, character-state changes or public chat commands. Control uses targeted Hidden ChatRoomChat messages under the HypnoReverie channel; these pass through the game server. Brief addon discovery announcements and explicitly enabled cosmetic head state are sent in the current room. Settings and messages are stored in local browser storage. No analytics or third-party backend.

Original code inspired by the controls at https://hypnospiral.vercel.app/; no code or assets copied from that site. Game transport and DOM identifiers were checked against the public Bondage Club source.
