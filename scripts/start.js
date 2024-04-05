import fs from 'node:fs'
import { execa } from 'execa'

const targets = fs.readdirSync('packages')
  .filter(f => 
    fs.statSync(`packages/${f}`).isDirectory()
  );

// 独立包的打包构建
async function build(target) {
  await execa(
    'rollup',
    ['-cw', '--environment', `TARGET:${target}`],
    { stdio: 'inherit' }
  );
}