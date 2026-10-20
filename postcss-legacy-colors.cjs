/**
 * Rewrites Tailwind's modern colour syntax into the legacy form, for old smart-TV browsers (Chrome < 65) that
 * drop `rgb(207 230 214 / x)` and `#0000` entirely and show no colour. Modern browsers render both forms the same.
 *   rgb(207 230 214 / var(--tw-bg-opacity, 1))  ->  rgba(207, 230, 214, var(--tw-bg-opacity, 1))
 *   rgb(60 69 137 / 0)                           ->  rgba(60, 69, 137, 0)
 *   #0000                                        ->  rgba(0, 0, 0, 0)
 */
const SPACE_RGB = /rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*(var\([^()]*\)|[\d.]+%?)\s*)?\)/g;
const HEX4 = /#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])(?![0-9a-fA-F])/g;

module.exports = () => ({
  postcssPlugin: "legacy-colors",
  Declaration(decl) {
    let v = decl.value;
    if (v.includes("rgb(")) v = v.replace(SPACE_RGB, (_, r, g, b, a) => (a ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`));
    if (v.includes("#")) v = v.replace(HEX4, (_, r, g, b, a) => `rgba(${parseInt(r + r, 16)}, ${parseInt(g + g, 16)}, ${parseInt(b + b, 16)}, ${+(parseInt(a + a, 16) / 255).toFixed(3)})`);
    decl.value = v;
  },
});
module.exports.postcss = true;
