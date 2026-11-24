# Hypno Reverie

Version **0.2.0** — a customizable hypnosis-themed visual overlay for Bondage Club, by **Jaxx-01-ai**. Effects stay within the left player area and allow game clicks through.

## Install / update

Upload **hypnoreverie.js**, **bookmarklet.txt**, and this **README.md** to the root of Jaxx-01-ai/HypnoReverie, replacing the previous versions. Keep GitHub Pages set to main / root. Wait for deployment, then reload your game and click the bookmark. Reloading is necessary to unload version 0.1.

Create a Firefox bookmark named Hypno Reverie and paste this entire line into its URL field:

```javascript
javascript:(()=>{if(window.HypnoReverie){window.HypnoReverie.open();return;}if(document.getElementById('player-spiral-addon')){alert('Reload the game, then click Hypno Reverie again to load the update.');return;}if(document.getElementById('hypnoreverie-loader'))return;const s=document.createElement('script');s.id='hypnoreverie-loader';s.crossOrigin='anonymous';s.src='https://Jaxx-01-ai.github.io/HypnoReverie/hypnoreverie.js?_='+Date.now();s.onload=()=>s.remove();s.onerror=()=>{s.remove();alert('Hypno Reverie could not load. Check the published script URL.');};document.head.appendChild(s);})();
```

Open **Hypno Reverie**, then check **Effects on**. Appearance settings save locally per game server. Effects always start off after a reload. Previous v0.1 appearance settings are migrated on first use.

## Visual controls

Primary and secondary spirals each have independent enable, colour, background colour/opacity, spiral opacity, arms, spin speed/direction, throb speed/strength, zoom, thickness, blur and curve. The primary tab also contains the width adjustment, limited to the left player area. The secondary spiral starts disabled.

## Text

Enable text in the Text tab. Enter one word or sentence per line in **Edit messages**. Up to 40 messages, 160 characters each. Click outside the editor to apply it. Choose centered messages, a repeating wall, repeated lines, or Write/typewriter. Colour, opacity, duration in seconds, inter-message gap, font size and line count are adjustable. Optional random order is available. The term subliminal describes the brief display mode; no claim of psychological effectiveness is made.

## Pulse / flash

Choose a soft pulse or a flash that fades out, with fixed intervals, random intervals, or synchronization to text messages. Colour, opacity and duration are adjustable. Pulses are limited to one every two seconds or slower; very fast text will not trigger a flash for every message. Pulse duration cannot overlap a new pulse. Start low; stop if the effect is uncomfortable. Pulse starts disabled.

## Giving someone the keys

Both players must load v0.2 in the same room.

1. The controller opens **Sharing** and checks **Available as a dominant/controller**. This role is self-declared; it does not use the game's dominance reputation.
2. The receiver opens **Sharing**, selects that player by name and member number, chooses permission and duration, and clicks **Give keys**. **Find players with the mod** refreshes discovery.
3. The controller selects the receiver under **Edit overlay**, adjusts their draft, and clicks **Send changes**. An acknowledgement confirms it was applied.

### Permission levels

| Level | Allowed |
| --- | --- |
| Visuals only | Edit both spirals |
| Visuals + text | Edit spirals and text/messages |
| Full session + control lock | Edit spirals and text, switch effects on/off, lock normal receiver controls |

Pulse/flash changes require the receiver's separate **Also allow pulse/flash changes** checkbox at grant time. Remote users cannot move the overlay into chat or change its width.

Granting access shares the current effect settings and message list with the selected controller. One player can hold keys to your overlay at a time. Grants last 1–30 minutes, are not saved, and are cleared when the room changes, either player leaves, the receiver disconnects, or the other addon stops announcing itself (up to 45 seconds). Replacement grants invalidate old keys. **Return keys** ends a controller's session.

**Escape** or **Stop / revoke** always switches off your effects and revokes keys to your overlay—even during a control lock. Ordinary controls can be locked; the emergency exit cannot. Alt+Shift+S toggles your effects when unlocked.

## Testing status

Automated core and isolated two-player Chromium tests cover settings limits, chat clipping, text modes, rendering, permission levels, targeted control, acknowledgements, token/sender checks, replay rejection, expiry, Escape, room change, disconnect, duplicate loading and cleanup. Live Firefox and real server two-player testing are still required.

Test locally first, then test with one trusted partner using visuals-only access before trying a full session. Verify Escape, leaving the room and disconnecting always end a locked session. This build has not been submitted to FUSAM.

## Implementation / privacy

No game function replacements, character-state changes or public chat commands. Control uses targeted Hidden ChatRoomChat messages under the HypnoReverie channel; these pass through the game server. Brief addon discovery announcements are sent in the current room. Settings and messages are stored in local browser storage. No analytics or third-party backend.

Original code inspired by the controls at https://hypnospiral.vercel.app/; no code or assets copied from that site. Game transport and DOM identifiers were checked against the public Bondage Club source.
