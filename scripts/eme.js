EME = (() => {
  
  const AUDIO_CONTENT_TYPE = 'audio/mp4; codecs="mp4a.40.2"'
  const KEY_SYSTEM = 'org.w3.clearkey'

  const decoder = new TextDecoder('utf-8')
  const encoder = new TextEncoder('utf-8')
  
  function base64ToHex(b64) {
    const clean = b64.replace(/-/g, '+').replace(/_/g, '/')
    const chars = atob(clean).split('')
    const toHex = char => ('0' + char.charCodeAt(0).toString(16)).substr(-2)
    return chars.map(toHex).join('')
  }

  function hexToBase64(hex) {
    const chunks = hex.match(/\w{2}/g)
    const toB64 = char => String.fromCharCode(parseInt(char, 16))
    return chunks && btoa(chunks.map(toB64).join(''))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  }

  function bufferToStr(buffer) {
    return decoder.decode(buffer)
  }
  
  function strToBuffer(string) {
    return encoder.encode(string)
  }

  function loadTrack(url, element) {
    const mediaSource = new MediaSource()
    element.src = URL.createObjectURL(mediaSource)
    mediaSource.addEventListener('sourceopen', () => {
      const sourceBuffer = mediaSource.addSourceBuffer(AUDIO_CONTENT_TYPE)
      sourceBuffer.addEventListener('updateend', () => mediaSource.endOfStream())
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((result) => sourceBuffer.appendBuffer(new Uint8Array(result)))
        .catch((error) => console.error('error:', error))
    })
  }

  function setupEME(element) {
    element.sessions = []
    element.addEventListener('encrypted', (event) => {
      const { initDataType, initData } = event
      const options = [{
        initDataTypes: ['cenc'],
        audioCapabilities: [{ contentType: AUDIO_CONTENT_TYPE }],
      }]
      navigator.requestMediaKeySystemAccess(KEY_SYSTEM, options)
        .then((keySystemAccess) => keySystemAccess.createMediaKeys())
        .then((mediaKeys) => element.setMediaKeys(mediaKeys))
        .then(() => {
          const session = element.mediaKeys.createSession()
          session.addEventListener('message', (event) => {
            const message = JSON.parse(bufferToStr(event.message))
            const response = JSON.stringify({
              type: message.type,
              keys: message.kids.map((kid) => {
                const hex = base64ToHex(kid)
                const key = keys[hex]
                return {
                  kty: 'oct',
                  alg: 'A128KW',
                  kid: kid,
                  k: hexToBase64(key),
                }
              })
            })
            event.target.update(strToBuffer(response))
              .catch((error) => console.error('Key update failed:', error))
          })
          session.generateRequest(initDataType, initData)
          element.sessions.push(session)
        })
        .catch((error) => console.error(error))
    })
  }

  return {
    load(url) {
      // @see https://bugs.chromium.org/p/chromium/issues/detail?id=723737
      // const audio = new Audio()
      const audio = document.createElement('audio')
      setupEME(audio)
      loadTrack(url, audio)
      return audio
    }
  }
})()
