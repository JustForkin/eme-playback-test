const { join, parse } = require('path')
const { exec } = require('child_process')
require('../config')

const WHITE = '\x1b[37m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'

// https://www.bento4.com/downloads/
const TOOLS_DIR = join('../../../tools/bento4-sdk/bin')
const ORIGINAL_DIR = join('original')
const FRAGMENTED_DIR = join('fragmented')
const ENCRYPTED_DIR = join('encrypted')

const log = (message, color = WHITE) => {
  console.log(`${color}${message}`)
}

const execPromise = (command, output) => new Promise((resolve, reject) => {
  log('\nRunning command:\n')
  log(command, CYAN)
  log('')
  exec(command, (error, stdout, stderr) => {
    if (error) {
      log(error, RED)
      reject(error)
    } else {
      stdout && log(stdout, GREEN)
      stderr && log(stderr, YELLOW);
      resolve(output)
    }
  })
})

const fragment = (input) => {
  const { base } = parse(input)
  const tool = join(TOOLS_DIR, 'mp4fragment')
  const output = join(FRAGMENTED_DIR, base)
  const command = `${tool} --track audio ${input} ${output}`
  return execPromise(command, output)
}

const encrypt = (input) => {
  const { base } = parse(input)
  const tool = join(TOOLS_DIR, 'mp4encrypt')
  const iv = '0a8d9e58502141c3'
  const kid = Object.keys(keys)[0]
  const key = keys[kid]
  const output = join(ENCRYPTED_DIR, base)
  const channel = 1 // 2 if targeting audio track in video
  const command = [
    `${tool} --method MPEG-CENC`,
    `--key ${channel}:${key}:${iv}`,
    `--property ${channel}:KID:${kid}`,
    `--global-option mpeg-cenc.eme-pssh:true ${input} ${output}`
  ].join(' ')
  return execPromise(command, output)
}

const sources = [
  join(ORIGINAL_DIR, 'kick.m4a'),
  join(ORIGINAL_DIR, 'snare.m4a'),
  join(ORIGINAL_DIR, 'hihat.m4a'),
]

const queue = sources.map((source) => fragment(source).then(encrypt))

Promise.all(queue).then((results) => {
  log('Encrypted files:', GREEN)
  results.forEach((path, index) => log(`\t${index + 1}: ${path}`))
})
