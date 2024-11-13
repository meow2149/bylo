import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { defineConfig } from 'rollup'

const createRollupConfig = (packageName) =>
  defineConfig({
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: packageName
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript()
    ]
  })
export default createRollupConfig
