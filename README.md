EME Playback Test
===

A simple application that measures the latency between when `audio.play()` is called on an `Audio` instance with an encrypted source, and when callbacks for the `playing` event and the promise returned from `play()` are actually called.

To run the example, simply point a local web server at this directory then click start.

Sources are encrypted with clearkey using the [Bento4 SDK](https://www.bento4.com/downloads/).

If you want to encrypt your own audio, download the SDK and ensure `TOOLS_DIR` in [encrypt.js](media/encrypt.js#L12) correctly points to the `bin` directory and that you have listed your [sources](media/encrypt.js#L62-L66), then run `node encrypt` from the [media](media/) directory. 