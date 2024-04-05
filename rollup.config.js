import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import pluginJson from '@rollup/plugin-json'
import pluginNodeResolve from '@rollup/plugin-node-resolve'
import rollupPluginTypescript2 from 'rollup-plugin-typescript2'


const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// 根据环境变量中的target属性 获取对应模块的package.json
const packagesDir = path.resolve(__dirname, 'packages')

// 打包的基准目录
const packageDir = path.resolve(packagesDir, process.env.TARGET)

// 只针对某个模块
const resolve = p => path.resolve(packageDir, p)
const pkg = require(resolve(`package.json`))

// 定义文件名
const name = path.basename(packageDir)

// 对打包类型做一个映射表，根据提供的formats来格式化需要打包的内容
const outputConfig = {
    'esm-bundler': {
        file: resolve(`dist/${name}.esm-bundler.js`),
        format: 'es'
    },
    'cjs': {
        file: resolve(`dist/${name}.cjs.js`),
        format: 'cjs'
    },
    'global': {
        file: resolve(`dist/${name}.global.js`),
        format: 'iife'
    }
}

const options = pkg.buildOptions

function createConfig(format, output) {
    return {
        input: resolve('src/index.ts'),
        output: {
            name: options.name,
            sourcemap: true,
            ...output
        },
        plugins: [
            pluginJson(),
            rollupPluginTypescript2({
                tsconfig: path.resolve(__dirname, 'tsconfig.json')
            }),
            pluginNodeResolve() // 解析第三方模块
        ]
    }
}

const option = options.formats.map(format => createConfig(format, outputConfig[format]))

export default option