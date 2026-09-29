# Design Resources

A compact, categorized index of 101 design resources across 5 categories and 21 groups.

This repo contains a Vite website and a GitHub-friendly resource directory. Both are powered by the catalog in [`src/resources.ts`](src/resources.ts), so the site and README stay organized around the same source of truth.

Run `npm run generate:readme` after editing the catalog to refresh the GitHub resource directory.

## Development

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Interactive Components

Navigation, animated checkboxes, split panes, the expandable globe, preview border, SearchBar, and RadiantButton use the supplied Reaticx components. Pick resources and Share the stack use the supplied black/orange RadiantButton preset. The viewport stays fixed while the resource pane scrolls; the sidebar ArcList follows the active section and exposes every subcategory without a parent click. Haptics use browser vibration where supported. Selected resources become browser-style tabs in a compact stack drawer. See [source provenance and explicit browser adaptations](src/reaticx/README.md). Run `npm run check:components` to verify source hashes and `npm run test:e2e` with the local app on port 5174 to check interactions in Chrome.

Each resource has a right-side animated checkbox to add or remove it from your stack. Your selection and Twitter handle are saved as a local browser draft. Share the stack opens a modal with the Chrome-tab preview and Twitter handle; Share stack publishes it and copies a `?stack=<id>` link. Handles are self-reported, not verified identities. Shared stacks use `/api/stacks` and `/api/stacks?id=<id>`; mount a Railway volume and set `STACKS_FILE=/data/stacks.json` for persistence across deployments (local default: `.data/stacks.json`). Hover previews expand into an accessible in-site dialog; the real Apple Intelligence shader loads on demand.

The visitor dock sends a heartbeat to `/api/live-users` every 30 seconds, even while collapsed. Set server-only `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to enable it. An atomic Redis script expires presence after 90 seconds and counts each signed 24-hour browser cookie once per day; tabs share that cookie. The count approximates active browsers, not people. Country markers show cumulative visits, sized by count, with the top three countries labeled. No IPs are stored: only aggregate countries and temporary anonymous IDs. Vercel uses `x-vercel-ip-country`; on Railway or another host, set `VISITORS_COUNTRY_HEADER` only when a trusted proxy overwrites that header and cannot be bypassed. Without geolocation, browsers still count as online but receive no country marker. Without Redis, the dock shows unavailable. Use a unique `VISITORS_REDIS_PREFIX` for each site/environment. Cookie clearing, disabled cookies, and automated traffic can inflate counts; this is lightweight analytics, not an exact audience measurement. Country centroids come from the Google DSPL country dataset.

## Resource Directory

### UI Component Libraries

<details open>
<summary><strong>Component Libraries / Full Kits</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://ui.aceternity.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fui.aceternity.com?w=620" alt="Aceternity UI website preview" width="260"></a> | **[Aceternity UI](https://ui.aceternity.com)**<br><sub>ui.aceternity.com</sub> |
| <a href="https://shsfui.com/primitives/cards"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fshsfui.com%2Fprimitives%2Fcards?w=620" alt="SHSF UI Cards website preview" width="260"></a> | **[SHSF UI Cards](https://shsfui.com/primitives/cards)**<br><sub>shsfui.com</sub> |
| <a href="https://animate-ui.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fanimate-ui.com?w=620" alt="Animate UI website preview" width="260"></a> | **[Animate UI](https://animate-ui.com)**<br><sub>animate-ui.com</sub> |
| <a href="https://voxletui.vercel.app/components"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fvoxletui.vercel.app%2Fcomponents?w=620" alt="Voxlet UI website preview" width="260"></a> | **[Voxlet UI](https://voxletui.vercel.app/components)**<br><sub>voxletui.vercel.app</sub> |
| <a href="https://cult-ui.com/docs/components"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fcult-ui.com%2Fdocs%2Fcomponents?w=620" alt="Cult UI website preview" width="260"></a> | **[Cult UI](https://cult-ui.com/docs/components)**<br><sub>cult-ui.com</sub> |
| <a href="https://fancycomponents.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Ffancycomponents.dev?w=620" alt="Fancy Components website preview" width="260"></a> | **[Fancy Components](https://fancycomponents.dev)**<br><sub>fancycomponents.dev</sub> |
| <a href="https://heroui.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fheroui.com?w=620" alt="HeroUI website preview" width="260"></a> | **[HeroUI](https://heroui.com)**<br><sub>heroui.com</sub> |
| <a href="https://kibo-ui.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fkibo-ui.com?w=620" alt="Kibo UI website preview" width="260"></a> | **[Kibo UI](https://kibo-ui.com)**<br><sub>kibo-ui.com</sub> |
| <a href="https://lightswind.com/components"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Flightswind.com%2Fcomponents?w=620" alt="Lightswind UI website preview" width="260"></a> | **[Lightswind UI](https://lightswind.com/components)**<br><sub>lightswind.com</sub> |
| <a href="https://lunarui.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Flunarui.dev?w=620" alt="Lunar UI website preview" width="260"></a> | **[Lunar UI](https://lunarui.dev)**<br><sub>lunarui.dev</sub> |
| <a href="https://magicui.design/docs/components"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmagicui.design%2Fdocs%2Fcomponents?w=620" alt="Magic UI website preview" width="260"></a> | **[Magic UI](https://magicui.design/docs/components)**<br><sub>magicui.design</sub> |
| <a href="https://reactbits.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Freactbits.dev?w=620" alt="React Bits website preview" width="260"></a> | **[React Bits](https://reactbits.dev)**<br><sub>reactbits.dev</sub> |
| <a href="https://reverseui.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Freverseui.com?w=620" alt="Reverse UI website preview" width="260"></a> | **[Reverse UI](https://reverseui.com)**<br><sub>reverseui.com</sub> |
| <a href="https://skiper-ui.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fskiper-ui.com?w=620" alt="Skiper UI website preview" width="260"></a> | **[Skiper UI](https://skiper-ui.com)**<br><sub>skiper-ui.com</sub> |
| <a href="https://smoothui.dev/docs/components"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fsmoothui.dev%2Fdocs%2Fcomponents?w=620" alt="SmoothUI website preview" width="260"></a> | **[SmoothUI](https://smoothui.dev/docs/components)**<br><sub>smoothui.dev</sub> |
| <a href="https://www.boardui.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.boardui.com?w=620" alt="BoardUI website preview" width="260"></a> | **[BoardUI](https://www.boardui.com)**<br><sub>boardui.com</sub> |
| <a href="https://ruixen.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fruixen.com?w=620" alt="Ruixen website preview" width="260"></a> | **[Ruixen](https://ruixen.com)**<br><sub>ruixen.com</sub> |
| <a href="https://www.inspora.design"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.inspora.design?w=620" alt="Inspora website preview" width="260"></a> | **[Inspora](https://www.inspora.design)**<br><sub>inspora.design</sub> |
| <a href="https://www.beautifului.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.beautifului.dev?w=620" alt="Beautiful UI website preview" width="260"></a> | **[Beautiful UI](https://www.beautifului.dev)**<br><sub>beautifului.dev</sub> |
| <a href="https://beui.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fbeui.dev?w=620" alt="Beui website preview" width="260"></a> | **[Beui](https://beui.dev)**<br><sub>beui.dev</sub> |
| <a href="https://www.beautifului.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.beautifului.dev?w=620" alt="Beutiful UI website preview" width="260"></a> | **[Beutiful UI](https://www.beautifului.dev)**<br><sub>beautifului.dev</sub> |
| <a href="https://www.beautifului.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.beautifului.dev?w=620" alt="Beautiful website preview" width="260"></a> | **[Beautiful](https://www.beautifului.dev)**<br><sub>beautifului.dev</sub> |
| <a href="https://feralui.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fferalui.dev?w=620" alt="FeralUI website preview" width="260"></a> | **[FeralUI](https://feralui.dev)**<br><sub>feralui.dev</sub> |
| <a href="https://www.obsidianui.dev/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.obsidianui.dev%2F?w=620" alt="Obsidian UI website preview" width="260"></a> | **[Obsidian UI](https://www.obsidianui.dev/)**<br><sub>obsidianui.dev</sub><br><sub>Dark, polished React components</sub> |
| <a href="https://21st.dev/home"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2F21st.dev%2Fhome?w=620" alt="21st.dev website preview" width="260"></a> | **[21st.dev](https://21st.dev/home)**<br><sub>21st.dev</sub><br><sub>AI component marketplace</sub> |

</details>

<details open>
<summary><strong>Component Marketplaces &amp; Collections</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://github.com/jaywcjlove/awesome-swift-macos-apps"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgithub.com%2Fjaywcjlove%2Fawesome-swift-macos-apps?w=620" alt="Awesome Swift macOS Apps website preview" width="260"></a> | **[Awesome Swift macOS Apps](https://github.com/jaywcjlove/awesome-swift-macos-apps)**<br><sub>github.com</sub> |
| <a href="https://github.com/LikhithSP/MacOS-Web-Simulator"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgithub.com%2FLikhithSP%2FMacOS-Web-Simulator?w=620" alt="MacOS Web Simulator website preview" width="260"></a> | **[MacOS Web Simulator](https://github.com/LikhithSP/MacOS-Web-Simulator)**<br><sub>github.com</sub> |
| <a href="https://shoogle.dev/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fshoogle.dev%2F?w=620" alt="Shoogle website preview" width="260"></a> | **[Shoogle](https://shoogle.dev/)**<br><sub>shoogle.dev</sub> |

</details>

<details open>
<summary><strong>Cards, Blocks &amp; Layout Sections</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://ui.watermelon.sh/animated-components/category/cards"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fui.watermelon.sh%2Fanimated-components%2Fcategory%2Fcards?w=620" alt="Watermelon UI Cards website preview" width="260"></a> | **[Watermelon UI Cards](https://ui.watermelon.sh/animated-components/category/cards)**<br><sub>ui.watermelon.sh</sub> |
| <a href="https://blocks.mvp-subha.me/docs/skeletons"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fblocks.mvp-subha.me%2Fdocs%2Fskeletons?w=620" alt="mvpblocks website preview" width="260"></a> | **[mvpblocks](https://blocks.mvp-subha.me/docs/skeletons)**<br><sub>blocks.mvp-subha.me</sub> |
| <a href="https://ui-layouts.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fui-layouts.com?w=620" alt="ui-layouts website preview" width="260"></a> | **[ui-layouts](https://ui-layouts.com)**<br><sub>ui-layouts.com</sub> |

</details>

### Motion, Animation & Interaction

<details open>
<summary><strong>Animation Libraries</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://animmasterlib.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fanimmasterlib.dev?w=620" alt="Animmaster Lib website preview" width="260"></a> | **[Animmaster Lib](https://animmasterlib.dev)**<br><sub>animmasterlib.dev</sub> |
| <a href="https://auto-animate.formkit.com/#examples"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fauto-animate.formkit.com%2F%23examples?w=620" alt="AutoAnimate website preview" width="260"></a> | **[AutoAnimate](https://auto-animate.formkit.com/#examples)**<br><sub>auto-animate.formkit.com</sub> |
| <a href="https://github.com/kitze/react-genie"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgithub.com%2Fkitze%2Freact-genie?w=620" alt="React Genie website preview" width="260"></a> | **[React Genie](https://github.com/kitze/react-genie)**<br><sub>github.com</sub> |
| <a href="https://makeitanimated.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmakeitanimated.dev?w=620" alt="Make It Animated website preview" width="260"></a> | **[Make It Animated](https://makeitanimated.dev)**<br><sub>makeitanimated.dev</sub> |
| <a href="https://motion.so"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmotion.so?w=620" alt="Motion website preview" width="260"></a> | **[Motion](https://motion.so)**<br><sub>motion.so</sub> |
| <a href="https://useanimations.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fuseanimations.com?w=620" alt="UseAnimations website preview" width="260"></a> | **[UseAnimations](https://useanimations.com)**<br><sub>useanimations.com</sub> |

</details>

<details open>
<summary><strong>Micro-interactions</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://freefrontend.com/css-hover-effects"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Ffreefrontend.com%2Fcss-hover-effects?w=620" alt="110+ CSS Hover Effects website preview" width="260"></a> | **[110+ CSS Hover Effects](https://freefrontend.com/css-hover-effects)**<br><sub>freefrontend.com</sub> |
| <a href="https://codepen.io"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fcodepen.io?w=620" alt="CodePen UI / Motion Demos website preview" width="260"></a> | **[CodePen UI / Motion Demos](https://codepen.io)**<br><sub>codepen.io</sub> |
| <a href="https://theme-toggle.rdsx.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Ftheme-toggle.rdsx.dev?w=620" alt="Theme Toggle View Transition API website preview" width="260"></a> | **[Theme Toggle View Transition API](https://theme-toggle.rdsx.dev)**<br><sub>theme-toggle.rdsx.dev</sub> |
| <a href="https://amicro.vercel.app/Anime"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Famicro.vercel.app%2FAnime?w=620" alt="Amicro website preview" width="260"></a> | **[Amicro](https://amicro.vercel.app/Anime)**<br><sub>amicro.vercel.app</sub> |

</details>

<details open>
<summary><strong>Cursor &amp; Pointer Effects</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://cursify.vercel.app/components/trail-cursor"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fcursify.vercel.app%2Fcomponents%2Ftrail-cursor?w=620" alt="Trail Cursor Effect — Cursify website preview" width="260"></a> | **[Trail Cursor Effect — Cursify](https://cursify.vercel.app/components/trail-cursor)**<br><sub>cursify.vercel.app</sub> |

</details>

<details open>
<summary><strong>Rive / Lottie-style Motion Assets</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://rive.app/marketplace"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Frive.app%2Fmarketplace?w=620" alt="Rive Marketplace website preview" width="260"></a> | **[Rive Marketplace](https://rive.app/marketplace)**<br><sub>rive.app</sub> |

</details>

### Visual Effects, Shaders & Backgrounds

<details open>
<summary><strong>Shaders &amp; WebGL / Three.js</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://gradii.fun"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgradii.fun?w=620" alt="Gradii website preview" width="260"></a> | **[Gradii](https://gradii.fun)**<br><sub>gradii.fun</sub> |
| <a href="https://shaders.paper.design/grain-gradient"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fshaders.paper.design%2Fgrain-gradient?w=620" alt="Grain Gradient — Paper website preview" width="260"></a> | **[Grain Gradient — Paper](https://shaders.paper.design/grain-gradient)**<br><sub>shaders.paper.design</sub> |
| <a href="https://shadergradient.co"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fshadergradient.co?w=620" alt="Shader Gradient website preview" width="260"></a> | **[Shader Gradient](https://shadergradient.co)**<br><sub>shadergradient.co</sub> |
| <a href="https://shaders.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fshaders.com?w=620" alt="Shaders website preview" width="260"></a> | **[Shaders](https://shaders.com)**<br><sub>shaders.com</sub> |
| <a href="https://countertype.com/tools/three-text/demo"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fcountertype.com%2Ftools%2Fthree-text%2Fdemo?w=620" alt="Three Text Demo website preview" width="260"></a> | **[Three Text Demo](https://countertype.com/tools/three-text/demo)**<br><sub>countertype.com</sub> |
| <a href="https://jeantimex.github.io/webgpu-water"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fjeantimex.github.io%2Fwebgpu-water?w=620" alt="WebGPU Water website preview" width="260"></a> | **[WebGPU Water](https://jeantimex.github.io/webgpu-water)**<br><sub>jeantimex.github.io</sub> |
| <a href="https://wiggle.three.tools"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwiggle.three.tools?w=620" alt="Wiggle Bones for Three.js website preview" width="260"></a> | **[Wiggle Bones for Three.js](https://wiggle.three.tools)**<br><sub>wiggle.three.tools</sub> |

</details>

<details open>
<summary><strong>Gradients, Glass &amp; Texture</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://github.com/dashersw/liquid-glass-js"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgithub.com%2Fdashersw%2Fliquid-glass-js?w=620" alt="Liquid Glass JS website preview" width="260"></a> | **[Liquid Glass JS](https://github.com/dashersw/liquid-glass-js)**<br><sub>github.com</sub> |
| <a href="https://photogradient.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fphotogradient.com?w=620" alt="Photo Gradient website preview" width="260"></a> | **[Photo Gradient](https://photogradient.com)**<br><sub>photogradient.com</sub> |
| <a href="https://snipzy.dev/snippets/liquid-glass-card.html"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fsnipzy.dev%2Fsnippets%2Fliquid-glass-card.html?w=620" alt="Liquid Glass Card — Snipzy website preview" width="260"></a> | **[Liquid Glass Card — Snipzy](https://snipzy.dev/snippets/liquid-glass-card.html)**<br><sub>snipzy.dev</sub> |
| <a href="https://specy.app/blog/posts/liquid-glass-in-the-web"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fspecy.app%2Fblog%2Fposts%2Fliquid-glass-in-the-web?w=620" alt="Liquid Glass in the Browser website preview" width="260"></a> | **[Liquid Glass in the Browser](https://specy.app/blog/posts/liquid-glass-in-the-web)**<br><sub>specy.app</sub> |
| <a href="https://gradientool.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgradientool.com?w=620" alt="Gradientool website preview" width="260"></a> | **[Gradientool](https://gradientool.com)**<br><sub>gradientool.com</sub><br><sub>Gradient generator and color tooling</sub> |
| <a href="https://patterncraft.fun"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fpatterncraft.fun?w=620" alt="Pattern Craft website preview" width="260"></a> | **[Pattern Craft](https://patterncraft.fun)**<br><sub>patterncraft.fun</sub> |
| <a href="https://light-stroke-rail.vercel.app/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Flight-stroke-rail.vercel.app%2F?w=620" alt="Light Rails website preview" width="260"></a> | **[Light Rails](https://light-stroke-rail.vercel.app/)**<br><sub>light-stroke-rail.vercel.app</sub> |
| <a href="https://oklch.fyi/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Foklch.fyi%2F?w=620" alt="OKLCH.fyi website preview" width="260"></a> | **[OKLCH.fyi](https://oklch.fyi/)**<br><sub>oklch.fyi</sub> |
| <a href="https://gooey.jakubantalik.com/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgooey.jakubantalik.com%2F?w=620" alt="Liquid Gooey website preview" width="260"></a> | **[Liquid Gooey](https://gooey.jakubantalik.com/)**<br><sub>gooey.jakubantalik.com</sub> |
| <a href="https://pryzm.design/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fpryzm.design%2F?w=620" alt="Pryzm website preview" width="260"></a> | **[Pryzm](https://pryzm.design/)**<br><sub>pryzm.design</sub> |

</details>

<details open>
<summary><strong>Animated Backgrounds</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://shadcn.io/background?page=3"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fshadcn.io%2Fbackground%3Fpage%3D3?w=620" alt="Animated React Backgrounds — shadcn.io website preview" width="260"></a> | **[Animated React Backgrounds — shadcn.io](https://shadcn.io/background?page=3)**<br><sub>shadcn.io</sub> |
| <a href="https://github.com/rauschermate/react-weather-effects"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgithub.com%2Frauschermate%2Freact-weather-effects?w=620" alt="React Weather Effects website preview" width="260"></a> | **[React Weather Effects](https://github.com/rauschermate/react-weather-effects)**<br><sub>github.com</sub> |

</details>

<details open>
<summary><strong>Canvas / HTML Rendering Experiments</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://html-in-canvas.vercel.app/examples/basic-ui"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fhtml-in-canvas.vercel.app%2Fexamples%2Fbasic-ui?w=620" alt="HTML in Canvas Demo website preview" width="260"></a> | **[HTML in Canvas Demo](https://html-in-canvas.vercel.app/examples/basic-ui)**<br><sub>html-in-canvas.vercel.app</sub> |

</details>

### Assets, Icons, Type & Brand Resources

<details open>
<summary><strong>Icons</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://nucleoapp.com/core-icons"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fnucleoapp.com%2Fcore-icons?w=620" alt="Core Icons website preview" width="260"></a> | **[Core Icons](https://nucleoapp.com/core-icons)**<br><sub>nucleoapp.com</sub> |
| <a href="https://notionicons.so"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fnotionicons.so?w=620" alt="Notion Icons website preview" width="260"></a> | **[Notion Icons](https://notionicons.so)**<br><sub>notionicons.so</sub> |
| <a href="https://lucide-animated.com/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Flucide-animated.com%2F?w=620" alt="Lucide Animated website preview" width="260"></a> | **[Lucide Animated](https://lucide-animated.com/)**<br><sub>lucide-animated.com</sub> |
| <a href="https://animateicons.in/icons/lucide"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fanimateicons.in%2Ficons%2Flucide?w=620" alt="AnimateIcons website preview" width="260"></a> | **[AnimateIcons](https://animateicons.in/icons/lucide)**<br><sub>animateicons.in</sub> |
| <a href="https://heroicons-animated.com/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fheroicons-animated.com%2F?w=620" alt="Heroicons Animated website preview" width="260"></a> | **[Heroicons Animated](https://heroicons-animated.com/)**<br><sub>heroicons-animated.com</sub> |
| <a href="https://github.com/useAnimations/react-useanimations"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgithub.com%2FuseAnimations%2Freact-useanimations?w=620" alt="React UseAnimations website preview" width="260"></a> | **[React UseAnimations](https://github.com/useAnimations/react-useanimations)**<br><sub>github.com</sub> |
| <a href="https://github.com/respeak-io/lucide-motion-vue"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fgithub.com%2Frespeak-io%2Flucide-motion-vue?w=620" alt="Lucide Motion Vue website preview" width="260"></a> | **[Lucide Motion Vue](https://github.com/respeak-io/lucide-motion-vue)**<br><sub>github.com</sub> |
| <a href="https://icon-sets.iconify.design/line-md"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Ficon-sets.iconify.design%2Fline-md?w=620" alt="Line MD website preview" width="260"></a> | **[Line MD](https://icon-sets.iconify.design/line-md)**<br><sub>icon-sets.iconify.design</sub> |
| <a href="https://movingicons.dev/icons"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmovingicons.dev%2Ficons?w=620" alt="Moving Icons website preview" width="260"></a> | **[Moving Icons](https://movingicons.dev/icons)**<br><sub>movingicons.dev</sub> |
| <a href="https://itshover.com/icons"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fitshover.com%2Ficons?w=620" alt="It's Hover website preview" width="260"></a> | **[It's Hover](https://itshover.com/icons)**<br><sub>itshover.com</sub> |
| <a href="https://morphicons.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmorphicons.com?w=620" alt="Morphicons website preview" width="260"></a> | **[Morphicons](https://morphicons.com)**<br><sub>morphicons.com</sub> |

</details>

<details open>
<summary><strong>Fonts &amp; Typefaces</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://fontshare.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Ffontshare.com?w=620" alt="Fontshare website preview" width="260"></a> | **[Fontshare](https://fontshare.com)**<br><sub>fontshare.com</sub> |
| <a href="https://hottype.co"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fhottype.co?w=620" alt="Hot Type website preview" width="260"></a> | **[Hot Type](https://hottype.co)**<br><sub>hottype.co</sub> |
| <a href="https://vartype.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fvartype.com?w=620" alt="Variable Type website preview" width="260"></a> | **[Variable Type](https://vartype.com)**<br><sub>vartype.com</sub> |
| <a href="https://uncut.wtf"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Funcut.wtf?w=620" alt="UNCUT.wtf website preview" width="260"></a> | **[UNCUT.wtf](https://uncut.wtf)**<br><sub>uncut.wtf</sub> |

</details>

<details open>
<summary><strong>SVG &amp; Vector Tools</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://svg.designcode.io"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fsvg.designcode.io?w=620" alt="SVG Pattern Builder website preview" width="260"></a> | **[SVG Pattern Builder](https://svg.designcode.io)**<br><sub>svg.designcode.io</sub> |
| <a href="https://svg-shaders.vercel.app"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fsvg-shaders.vercel.app?w=620" alt="SVG Shaders website preview" width="260"></a> | **[SVG Shaders](https://svg-shaders.vercel.app)**<br><sub>svg-shaders.vercel.app</sub> |

</details>

### Design Inspiration & References

<details open>
<summary><strong>Curated Design Galleries</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://tympanus.net/codrops/hub/all"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Ftympanus.net%2Fcodrops%2Fhub%2Fall?w=620" alt="Codrops Creative Hub website preview" width="260"></a> | **[Codrops Creative Hub](https://tympanus.net/codrops/hub/all)**<br><sub>tympanus.net</sub> |
| <a href="https://curations.supply"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fcurations.supply?w=620" alt="Curations Supply website preview" width="260"></a> | **[Curations Supply](https://curations.supply)**<br><sub>curations.supply</sub> |
| <a href="https://pixelwrld.co"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fpixelwrld.co?w=620" alt="Roman Tesliuk website preview" width="260"></a> | **[Roman Tesliuk](https://pixelwrld.co)**<br><sub>pixelwrld.co</sub> |
| <a href="https://curated.design"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fcurated.design?w=620" alt="Curated Design Articles website preview" width="260"></a> | **[Curated Design Articles](https://curated.design)**<br><sub>curated.design</sub> |
| <a href="https://brandfetch.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fbrandfetch.com?w=620" alt="Logos website preview" width="260"></a> | **[Logos](https://brandfetch.com)**<br><sub>brandfetch.com</sub> |
| <a href="https://movin.design/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmovin.design%2F?w=620" alt="Movin.design website preview" width="260"></a> | **[Movin.design](https://movin.design/)**<br><sub>movin.design</sub> |
| <a href="https://www.designminis.com/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.designminis.com%2F?w=620" alt="Design Minis website preview" width="260"></a> | **[Design Minis](https://www.designminis.com/)**<br><sub>designminis.com</sub> |

</details>

<details open>
<summary><strong>AI Design / Generation Tools</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://brik.space/Home"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fbrik.space%2FHome?w=620" alt="Brik AI / Brik Space website preview" width="260"></a> | **[Brik AI / Brik Space](https://brik.space/Home)**<br><sub>brik.space</sub> |
| <a href="https://www.playgrnd.tools"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.playgrnd.tools?w=620" alt="Playgrnd Tools website preview" width="260"></a> | **[Playgrnd Tools](https://www.playgrnd.tools)**<br><sub>playgrnd.tools</sub><br><sub>AI playground for creative tools</sub> |
| <a href="https://app.quiver.ai/discover"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fapp.quiver.ai%2Fdiscover?w=620" alt="Quiver Discover website preview" width="260"></a> | **[Quiver Discover](https://app.quiver.ai/discover)**<br><sub>app.quiver.ai</sub><br><sub>AI discovery and inspiration feed</sub> |
| <a href="https://app.revyl.ai/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fapp.revyl.ai%2F?w=620" alt="Revyl website preview" width="260"></a> | **[Revyl](https://app.revyl.ai/)**<br><sub>app.revyl.ai</sub><br><sub>AI creative review and iteration tool</sub> |
| <a href="https://swishy.ai"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fswishy.ai?w=620" alt="Swishy website preview" width="260"></a> | **[Swishy](https://swishy.ai)**<br><sub>swishy.ai</sub> |

</details>

<details open>
<summary><strong>Design-to-Code / Tool Builders</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://morflax.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmorflax.com?w=620" alt="Morflax website preview" width="260"></a> | **[Morflax](https://morflax.com)**<br><sub>morflax.com</sub> |
| <a href="https://unicorn.studio/dashboard"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Funicorn.studio%2Fdashboard?w=620" alt="Unicorn Studio website preview" width="260"></a> | **[Unicorn Studio](https://unicorn.studio/dashboard)**<br><sub>unicorn.studio</sub> |
| <a href="https://unocss.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Funocss.dev?w=620" alt="UnoCSS website preview" width="260"></a> | **[UnoCSS](https://unocss.dev)**<br><sub>unocss.dev</sub> |

</details>

<details open>
<summary><strong>Product Mockups &amp; Launch Visuals</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://www.ultramock.io/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.ultramock.io%2F?w=620" alt="Ultramock website preview" width="260"></a> | **[Ultramock](https://www.ultramock.io/)**<br><sub>ultramock.io</sub><br><sub>Premium product visuals and 3D mockups</sub> |
| <a href="https://www.raylight.app/signup?ref=QZQ4k3x5L9OxuX6W"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwww.raylight.app%2Fsignup%3Fref%3DQZQ4k3x5L9OxuX6W?w=620" alt="Raylight website preview" width="260"></a> | **[Raylight](https://www.raylight.app/signup?ref=QZQ4k3x5L9OxuX6W)**<br><sub>raylight.app</sub><br><sub>Product videos and motion visuals</sub> |

</details>

<details open>
<summary><strong>Maps / Spatial UI Tools</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://mapcn.dev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmapcn.dev?w=620" alt="mapcn website preview" width="260"></a> | **[mapcn](https://mapcn.dev)**<br><sub>mapcn.dev</sub> |

</details>

<details open>
<summary><strong>Product Analytics &amp; Feedback</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://posthog.com"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fposthog.com?w=620" alt="PostHog website preview" width="260"></a> | **[PostHog](https://posthog.com)**<br><sub>posthog.com</sub><br><sub>Open-source product analytics platform</sub> |

</details>

<details open>
<summary><strong>Design Creators &amp; Research</strong></summary>

| Preview | Resource |
| --- | --- |
| <a href="https://x.com/pendev"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fx.com%2Fpendev?w=620" alt="PenDev website preview" width="260"></a> | **[PenDev](https://x.com/pendev)**<br><sub>x.com</sub><br><sub>Design and product inspiration feed</sub> |
| <a href="https://appllama.io/"><img src="https://s.wordpress.com/mshots/v1/https%3A%2F%2Fappllama.io%2F?w=620" alt="Appllama website preview" width="260"></a> | **[Appllama](https://appllama.io/)**<br><sub>appllama.io</sub><br><sub>Mobile app screen and flow research</sub> |

</details>

---

_Generated from `src/resources.ts`._
