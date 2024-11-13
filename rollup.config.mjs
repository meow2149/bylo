import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser  from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'

const createRollupConfig = (packageName) =>
  defineConfig({
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'umd',
        name: packageName
      },
      {
        file: 'dist/index.min.js',
        format: 'umd',
        name: packageName,
        plugins: [terser()]
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript()
    ]
  })
export default createRollupConfig
