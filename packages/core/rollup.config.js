import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

/** Shared plugin set */
const plugins = [
  resolve({ extensions: [".ts", ".js"] }),
  commonjs(),
  typescript({ tsconfig: "./tsconfig.json" })
];

export default [
  // Background (MV3 service worker)
  {
    input: "src/background.ts",
    output: { file: "build/bg.js", format: "iife", sourcemap: false },
    plugins
  },
  // Content script
  {
    input: "src/content.ts",
    output: { file: "build/content.js", format: "iife", sourcemap: false },
    plugins
  }
];
