export type Resource = {
  name: string
  url: string
  note?: string
}

export type Category = {
  title: string
  groups: { title: string; items: Resource[] }[]
}

const r = (name: string, url: string, note?: string): Resource => ({ name, url, note })

export const categories: Category[] = [
  {
    title: "UI Component Libraries",
    groups: [
      {
        title: "Component Libraries / Full Kits",
        items: [
          r("Aceternity UI", "https://ui.aceternity.com"),
          r("SHSF UI Cards", "https://shsfui.com/primitives/cards"),
          r("Animate UI", "https://animate-ui.com"),
          r("Voxlet UI", "https://voxletui.vercel.app/components"),
          r("Cult UI", "https://cult-ui.com/docs/components"),
          r("Fancy Components", "https://fancycomponents.dev"),
          r("HeroUI", "https://heroui.com"),
          r("Kibo UI", "https://kibo-ui.com"),
          r("Lightswind UI", "https://lightswind.com/components"),
          r("Lunar UI", "https://lunarui.dev"),
          r("Magic UI", "https://magicui.design/docs/components"),
          r("React Bits", "https://reactbits.dev"),
          r("Reverse UI", "https://reverseui.com"),
          r("Skiper UI", "https://skiper-ui.com"),
          r("SmoothUI", "https://smoothui.dev/docs/components"),
          r("BoardUI", "https://www.boardui.com"),
          r("Ruixen", "https://ruixen.com"),
          r("Inspora", "https://www.inspora.design"),
          r("Beautiful UI", "https://www.beautifului.dev"),
          r("Beui", "https://beui.dev"),
          r("Beutiful UI", "https://www.beautifului.dev"),
          r("Beautiful", "https://www.beautifului.dev"),
          r("FeralUI", "https://feralui.dev"),
          r("Obsidian UI", "https://www.obsidianui.dev/", "Dark, polished React components"),
          r("21st.dev", "https://21st.dev/home", "AI component marketplace"),
        ],
      },
      {
        title: "Component Marketplaces & Collections",
        items: [
          r("Awesome Swift macOS Apps", "https://github.com/jaywcjlove/awesome-swift-macos-apps"),
          r("MacOS Web Simulator", "https://github.com/LikhithSP/MacOS-Web-Simulator"),
          r("Shoogle", "https://shoogle.dev/"),
        ],
      },
      {
        title: "Cards, Blocks & Layout Sections",
        items: [
          r("Watermelon UI Cards", "https://ui.watermelon.sh/animated-components/category/cards"),
          r("mvpblocks", "https://blocks.mvp-subha.me/docs/skeletons"),
          r("ui-layouts", "https://ui-layouts.com"),
        ],
      },
    ],
  },
  {
    title: "Motion, Animation & Interaction",
    groups: [
      {
        title: "Animation Libraries",
        items: [
          r("Animmaster Lib", "https://animmasterlib.dev"),
          r("AutoAnimate", "https://auto-animate.formkit.com/#examples"),
          r("React Genie", "https://github.com/kitze/react-genie"),
          r("Make It Animated", "https://makeitanimated.dev"),
          r("Motion", "https://motion.so"),
          r("UseAnimations", "https://useanimations.com"),
        ],
      },
      {
        title: "Micro-interactions",
        items: [
          r("110+ CSS Hover Effects", "https://freefrontend.com/css-hover-effects"),
          r("CodePen UI / Motion Demos", "https://codepen.io"),
          r("Theme Toggle View Transition API", "https://theme-toggle.rdsx.dev"),
          r("Amicro", "https://amicro.vercel.app/Anime"),
        ],
      },
      {
        title: "Cursor & Pointer Effects",
        items: [r("Trail Cursor Effect — Cursify", "https://cursify.vercel.app/components/trail-cursor")],
      },
      {
        title: "Rive / Lottie-style Motion Assets",
        items: [r("Rive Marketplace", "https://rive.app/marketplace")],
      },
    ],
  },
  {
    title: "Visual Effects, Shaders & Backgrounds",
    groups: [
      {
        title: "Shaders & WebGL / Three.js",
        items: [
          r("Gradii", "https://gradii.fun"),
          r("Grain Gradient — Paper", "https://shaders.paper.design/grain-gradient"),
          r("Shader Gradient", "https://shadergradient.co"),
          r("Shaders", "https://shaders.com"),
          r("Three Text Demo", "https://countertype.com/tools/three-text/demo"),
          r("WebGPU Water", "https://jeantimex.github.io/webgpu-water"),
          r("Wiggle Bones for Three.js", "https://wiggle.three.tools"),
        ],
      },
      {
        title: "Gradients, Glass & Texture",
        items: [
          r("Liquid Glass JS", "https://github.com/dashersw/liquid-glass-js"),
          r("Photo Gradient", "https://photogradient.com"),
          r("Liquid Glass Card — Snipzy", "https://snipzy.dev/snippets/liquid-glass-card.html"),
          r("Liquid Glass in the Browser", "https://specy.app/blog/posts/liquid-glass-in-the-web"),
          r("Gradientool", "https://gradientool.com", "Gradient generator and color tooling"),
          r("Pattern Craft", "https://patterncraft.fun"),
          r("Light Rails", "https://light-stroke-rail.vercel.app/"),
          r("OKLCH.fyi", "https://oklch.fyi/"),
          r("Liquid Gooey", "https://gooey.jakubantalik.com/"),
          r("Pryzm", "https://pryzm.design/"),
        ],
      },
      {
        title: "Animated Backgrounds",
        items: [
          r("Animated React Backgrounds — shadcn.io", "https://shadcn.io/background?page=3"),
          r("React Weather Effects", "https://github.com/rauschermate/react-weather-effects"),
        ],
      },
      {
        title: "Canvas / HTML Rendering Experiments",
        items: [r("HTML in Canvas Demo", "https://html-in-canvas.vercel.app/examples/basic-ui")],
      },
    ],
  },
  {
    title: "Assets, Icons, Type & Brand Resources",
    groups: [
      {
        title: "Icons",
        items: [
          r("Core Icons", "https://nucleoapp.com/core-icons"),
          r("Notion Icons", "https://notionicons.so"),
          r("Lucide Animated", "https://lucide-animated.com/"),
          r("AnimateIcons", "https://animateicons.in/icons/lucide"),
          r("Heroicons Animated", "https://heroicons-animated.com/"),
          r("React UseAnimations", "https://github.com/useAnimations/react-useanimations"),
          r("Lucide Motion Vue", "https://github.com/respeak-io/lucide-motion-vue"),
          r("Line MD", "https://icon-sets.iconify.design/line-md"),
          r("Moving Icons", "https://movingicons.dev/icons"),
          r("It's Hover", "https://itshover.com/icons"),
          r("Morphicons", "https://morphicons.com"),
        ],
      },
      {
        title: "Fonts & Typefaces",
        items: [
          r("Fontshare", "https://fontshare.com"),
          r("Hot Type", "https://hottype.co"),
          r("Variable Type", "https://vartype.com"),
          r("UNCUT.wtf", "https://uncut.wtf"),
        ],
      },
      {
        title: "SVG & Vector Tools",
        items: [
          r("SVG Pattern Builder", "https://svg.designcode.io"),
          r("SVG Shaders", "https://svg-shaders.vercel.app"),
        ],
      },
    ],
  },
  {
    title: "Design Inspiration & References",
    groups: [
      {
        title: "Curated Design Galleries",
        items: [
          r("Codrops Creative Hub", "https://tympanus.net/codrops/hub/all"),
          r("Curations Supply", "https://curations.supply"),
          r("Roman Tesliuk", "https://pixelwrld.co"),
          r("Curated Design Articles", "https://curated.design"),
          r("Logos", "https://brandfetch.com"),
          r("Movin.design", "https://movin.design/"),
          r("Design Minis", "https://www.designminis.com/"),
        ],
      },
      {
        title: "AI Design / Generation Tools",
        items: [
          r("Brik AI / Brik Space", "https://brik.space/Home"),
          r("Playgrnd Tools", "https://www.playgrnd.tools", "AI playground for creative tools"),
          r("Quiver Discover", "https://app.quiver.ai/discover", "AI discovery and inspiration feed"),
          r("Revyl", "https://app.revyl.ai/", "AI creative review and iteration tool"),
          r("Swishy", "https://swishy.ai"),
        ],
      },
      {
        title: "Design-to-Code / Tool Builders",
        items: [
          r("Morflax", "https://morflax.com"),
          r("Unicorn Studio", "https://unicorn.studio/dashboard"),
          r("UnoCSS", "https://unocss.dev"),
        ],
      },
      {
        title: "Product Mockups & Launch Visuals",
        items: [
          r("Ultramock", "https://www.ultramock.io/", "Premium product visuals and 3D mockups"),
          r("Raylight", "https://www.raylight.app/signup?ref=QZQ4k3x5L9OxuX6W", "Product videos and motion visuals"),
        ],
      },
      {
        title: "Maps / Spatial UI Tools",
        items: [r("mapcn", "https://mapcn.dev")],
      },
      {
        title: "Product Analytics & Feedback",
        items: [r("PostHog", "https://posthog.com", "Open-source product analytics platform")],
      },
      {
        title: "Design Creators & Research",
        items: [
          r("PenDev", "https://x.com/pendev", "Design and product inspiration feed"),
          r("Appllama", "https://appllama.io/", "Mobile app screen and flow research"),
        ],
      },
    ],
  },
]
