/**
 * Using @cwilso's approach:
 * @see https://github.com/cwilso/metronome
 * @see https://www.html5rocks.com/en/tutorials/audio/scheduling/
 */

let interval = 100
let timerId

function tick() {
  postMessage('tick')
}

self.onmessage = ({ data }) => {
  if (data === 'start') {
    timerId = setInterval(tick, interval)
  } else if (data === 'stop') {
    clearInterval(timerId)
    timerId = null
  } else if (data.interval) {
    interval = data.interval
    if (timerId) {
      clearInterval(timerId)
      timerId = setInterval(tick, interval)
    }
  }
}