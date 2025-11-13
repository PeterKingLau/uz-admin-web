// uno.config.js
import {
  defineConfig,
  presetWind3,
  presetIcons,
  presetAttributify,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: { display: "inline-block", "vertical-align": "middle" },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  shortcuts: {
    "icon-btn": "inline-block mr-1 text-[15px] align-middle",
    "icon-circle": "inline-block text-[16px] align-middle translate-y-[1px]",
  },
  include: ["./index.html", "./src/**/*.{vue,js,jsx,tsx}"],
});
