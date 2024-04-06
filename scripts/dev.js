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

// 对整体项目进行构建打包
function runParallel(targets, iteratorFn) {
  let res = [];
  for (const target of targets) {
    res.push(iteratorFn(target))
  }
  return Promise.all(res)
}

runParallel(targets, build)