

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CEH0wgIj.js","_app/immutable/chunks/BqA1demz.js","_app/immutable/chunks/_Pf3XIno.js","_app/immutable/chunks/CSqDCzy6.js","_app/immutable/chunks/kTt5IZRj.js"];
export const stylesheets = ["_app/immutable/assets/0.SserhdM3.css"];
export const fonts = [];
