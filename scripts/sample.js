
const PRELOAD_BUFFER_SIZE = 16

/**
 * Although we're not inserting any other nodes in the WAA graph between a
 * source and the AudioContext's destination in this example, in order to make
 * it more indicative of a real use case we are still connecting it to the 
 * graph. However, `createMediaElementSource` with EME currently throws in 
 * Firefox so we need to catch it and bypass the audio graph for now.
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1331763
 */
let canCreateMediaElementSource = true
let testCreateMediaElementSource = true

class Sample {
  constructor(context, src) {
    this.context = context
    this.src = src
    this.onCanPlayThrough = this.onCanPlayThrough.bind(this)
    this.onPlaying = this.onPlaying.bind(this)
    this.onEnded = this.onEnded.bind(this)
    this.loading = []
    this.ready = []
    this.preload()
  }
  /**
   * Ensure we always have a stack of loaded samples that `canplaythrough`.
   * This should mitigate any latency caused by buffering.
   */
  preload() {
    let total = this.loading.length + this.ready.length
    for (total; total < PRELOAD_BUFFER_SIZE; total++) {
      const audio = EME.load(this.src)
      audio.addEventListener('canplaythrough', this.onCanPlayThrough)
      this.loading.push(audio)
    }
  }
  play(targetTime) {
    if (this.ready.length) {
      const delay = (targetTime - this.context.currentTime) * 1000
      if (delay < 0) return
      const audio = this.ready.pop()
      let sourceNode
      // Test `createMediaElementSource` support first time around
      if (testCreateMediaElementSource) {
        try { sourceNode = this.context.createMediaElementSource(audio) }
        catch (error) { canCreateMediaElementSource = false }
        testCreateMediaElementSource = false
      }
      if (canCreateMediaElementSource) {
        sourceNode = sourceNode || this.context.createMediaElementSource(audio)
        sourceNode.connect(this.context.destination)
        audio.sourceNode = sourceNode
      }
      audio.targetTime = targetTime
      audio.addEventListener('playing', this.onPlaying)
      audio.addEventListener('ended', this.onEnded)
      /**
       * Since we can't use `createBufferSource` with EME, we have to revert to
       * using `setTimeout` to schedule playback. Not only is the precision of
       * the delay restricted to 1ms, but there is (unpredictable) latency
       * between calling `play` and receiving the callback from either the 
       * returned Promise or the `playing` event.
       */
      setTimeout(() => {
        audio.play().then(() => {
          const latency = Math.abs(this.context.currentTime - targetTime) * 1000
          Results.add('Promise', latency)
        })
      }, delay)
      this.preload()
    }
  }
  onPlaying(event) {
    const audio = event.currentTarget
    const latency = Math.abs(this.context.currentTime - audio.targetTime) * 1000
    Results.add('Event', latency)
    audio.removeEventListener('playing', this.onPlaying)
  }
  onEnded(event) {
    const audio = event.currentTarget
    audio.removeEventListener('ended', this.onEnded)
    audio.sourceNode && audio.sourceNode.disconnect()
  }
  onCanPlayThrough(event) {
    const audio = event.currentTarget
    audio.removeEventListener('canplaythrough', this.onCanPlayThrough)
    const index = this.loading.indexOf(audio)
    if (index !== -1) this.loading.splice(index, 1)
    this.ready.push(audio)
  }
}
