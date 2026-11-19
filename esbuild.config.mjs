import esbuild from "esbuild";

const production = process.argv.includes("production");
const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  target: "es2021",
  outfile: "main.js",
  sourcemap: production ? false : "inline",
  minify: false,
  banner: { js: "/* Generated from src/main.ts. See the repository for source and license. */" },
  logLevel: "info",
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
