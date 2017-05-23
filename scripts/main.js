const MIN_TEMPO = 10
const MAX_TEMPO = 180
const DEFAULT_TEMPO = 60

const context = new AudioContext()

const kick = new Sample(context, './media/encrypted/kick.m4a')
const hihat = new Sample(context, './media/encrypted/hihat.m4a')
const snare = new Sample(context, './media/encrypted/snare.m4a')

const sequence = [
  [ hihat, kick ],
  [ hihat],
  [ hihat, snare ],
  [ hihat],
]

const $toggle = document.querySelector('#toggle')
const $tempo = document.querySelector('#tempo')
$tempo.value = DEFAULT_TEMPO
$tempo.min = MIN_TEMPO
$tempo.max = MAX_TEMPO

const clock = new Worker('./scripts/clock.js')
const scheduleAheadTime = 0.1
const lookahead = 25.0

let isPlaying = false
let tempo = DEFAULT_TEMPO // 'beats', or quater notes per minute
let currentNote = 0
let nextNoteTime = 0
let notesPerBeat

const metronomeGain = context.createGain()
metronomeGain.connect(context.destination)
metronomeGain.gain.value = 0.3

function playTone(frequency, time) {
  const oscillator = context.createOscillator()
  oscillator.connect(metronomeGain)
  oscillator.frequency.value = frequency
  oscillator.start(time)
  oscillator.stop(time + 0.05)
}

function schedule() {
  const timeStep = 60 / tempo / 4 // quater notes
  while (nextNoteTime < context.currentTime + scheduleAheadTime) {
    // Schedule a beep as a metronome
    playTone(currentNote % 4 === 0 ? 440 : 220, nextNoteTime)
    // Schedule each sample for this note
    sequence[currentNote].forEach((sample) => sample.play(nextNoteTime))
    // Move time and current note forwards
    nextNoteTime += timeStep
    currentNote = (currentNote + 1) % sequence.length
  }
}

function start() {
  isPlaying = true
  nextNoteTime = context.currentTime
  currentNote = 0
  $toggle.innerText = 'Stop'
  clock.postMessage('start')
}

function stop() {
  isPlaying = false
  $toggle.innerText = 'Start'
  clock.postMessage('stop')
}

function init() {
  $toggle.addEventListener('click', () => {
    isPlaying ? stop() : start()
  })
  $tempo.addEventListener('input', () => {
    tempo = Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, parseInt($tempo.value, 10)))
  })
  clock.addEventListener('message', (event) => {
    if (event.data === 'tick') schedule()
  })
  clock.postMessage({ interval: lookahead })
  // Wait for some samples to load before enabling playback.
  const samples = [kick, hihat, snare]
  const checkReadyInterval = setInterval(() => {
    let ready = true
    samples.forEach((sample) => {
      if (!sample.ready.length) {
        ready = false
      }
    })
    if (ready) {
      clearInterval(checkReadyInterval)
      $toggle.removeAttribute('disabled')
    }
  }, 100)
}

init()
