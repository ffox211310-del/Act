export class VoiceManager {

  constructor({
    onResult,
    onStart,
    onEnd,
    onError
  } = {}) {

    this.onResult = onResult;
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.onError = onError;

    this.recognition = null;
    this.speaking = false;
    this.listening = false;

    this.lastTranscript = "";
    this.lastTranscriptTime = 0;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    this.recognition =
      new SpeechRecognition();

    this.recognition.lang = "ja-JP";

    this.recognition.continuous = false;

    this.recognition.interimResults = false;


    this.recognition.onstart = () => {

      this.listening = true;

      if (this.onStart) {
        this.onStart();
      }

    };


    this.recognition.onresult = event => {

      const result =
        event.results[
          event.results.length - 1
        ];

      const text =
        result[0].transcript.trim();

      if (!text) {
        return;
      }


      /* 重複防止 */

      const now = Date.now();

      if (
        text === this.lastTranscript &&
        now - this.lastTranscriptTime < 2000
      ) {
        return;
      }

      this.lastTranscript = text;
      this.lastTranscriptTime = now;


      if (this.onResult) {
        this.onResult(text);
      }

    };


    this.recognition.onend = () => {

      this.listening = false;

      if (this.onEnd) {
        this.onEnd();
      }

    };


    this.recognition.onerror = event => {

      console.warn(
        "Speech recognition error:",
        event.error
      );

      this.listening = false;

      if (this.onError) {
        this.onError(event.error);
      }

    };

  }


  start() {

    if (!this.recognition) {
      return;
    }

    if (this.listening) {
      return;
    }

    if (this.speaking) {
      return;
    }

    try {

      this.recognition.start();

    } catch (error) {

      console.warn(
        "Recognition start failed:",
        error
      );

    }

  }


  stop() {

    if (!this.recognition) {
      return;
    }

    try {

      this.recognition.stop();

    } catch (error) {

      console.warn(
        "Recognition stop failed:",
        error
      );

    }

  }


  speak(text) {

    return new Promise(resolve => {

      if (
        !("speechSynthesis" in window)
      ) {

        resolve();

        return;
      }


      /* マイク停止 */

      this.stop();

      this.speaking = true;

      window.speechSynthesis.cancel();


      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.lang = "ja-JP";

      utterance.rate = 1.0;

      utterance.pitch = 1.0;


      utterance.onend = () => {

        this.speaking = false;

        resolve();

      };


      utterance.onerror = () => {

        this.speaking = false;

        resolve();

      };


      window.speechSynthesis.speak(
        utterance
      );

    });

  }


  stopSpeaking() {

    if (
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    this.speaking = false;

  }

}
