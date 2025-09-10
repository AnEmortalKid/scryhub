import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

export default [{
  input: "src/background.ts",
  // MV3 service worker must be a classic script (not ESM), so use iife
  output: { file: "build/background.js", format: "iife", sourcemap: false },
  plugins: [
    resolve({ extensions: [".ts", ".js"] }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" })
  ]
}];