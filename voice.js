/* ========================================
   Voice Manager
======================================== */

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

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn(
        "Speech Recognition is not supported."
      );
      return;
    }

    this.recognition =
      new SpeechRecognition();

    this.recognition.lang = "ja-JP";

    this.recognition.continuous = false;

    this.recognition.interimResults = false;


    /* ---------- 認識開始 ---------- */

    this.recognition.onstart = () => {

      this.listening = true;

      if (this.onStart) {
        this.onStart();
      }

    };


    /* ---------- 認識結果 ---------- */

    this.recognition.onresult = event => {

      const result =
        event.results[
          event.results.length - 1
        ];

      const text =
        result[0].transcript.trim();

      if (text && this.onResult) {
        this.onResult(text);
      }

    };


    /* ---------- 認識終了 ---------- */

    this.recognition.onend = () => {

      this.listening = false;

      if (this.onEnd) {
        this.onEnd();
      }

    };


    /* ---------- エラー ---------- */

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


  /* ========================================
     マイク開始
  ======================================== */

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


  /* ========================================
     マイク停止
  ======================================== */

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


  /* ========================================
     読み上げ
  ======================================== */

  speak(text) {

    return new Promise(resolve => {

      if (!("speechSynthesis" in window)) {

        resolve();

        return;
      }


      this.speaking = true;

      this.stop();

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


  /* ========================================
     読み上げ停止
  ======================================== */

  stopSpeaking() {

    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    this.speaking = false;

  }

}
