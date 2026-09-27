import * as webllm from "@mlc-ai/web-llm";

import {
  loadHistory,
  saveMessage,
  loadMemory,
  saveMemory,
  createMemory,
  clearHistory
} from "./memory.js";


/* ========================================
   WebLLM
======================================== */

const MODEL_ID =
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

let engine = null;
let busy = false;


/* ========================================
   DOM
======================================== */

const bot =
  document.getElementById("bot");

const bubble =
  document.getElementById("bubble");

const input =
  document.getElementById("input");


/* ========================================
   会話履歴
======================================== */

let history = loadHistory();


/* ========================================
   星空
======================================== */

(function createStars() {

  const box =
    document.getElementById("stars");

  for (let i = 0; i < 50; i++) {

    const star =
      document.createElement("div");

    star.className = "star";

    star.style.left =
      Math.random() * 100 + "%";

    star.style.top =
      Math.random() * 100 + "%";

    star.style.animationDelay =
      (Math.random() * 5).toFixed(2) + "s";

    star.style.opacity =
      (0.1 + Math.random() * 0.4)
        .toFixed(2);

    box.appendChild(star);
  }

})();


/* ========================================
   瞬き
======================================== */

const eyes =
  document.querySelectorAll(".eye");

function blink() {

  if (
    bot.classList.contains("speaking")
  ) {
    return;
  }

  eyes.forEach(e =>
    e.classList.add("blink")
  );

  setTimeout(() => {

    eyes.forEach(e =>
      e.classList.remove("blink")
    );

  }, 120);
}

(function blinkLoop() {

  setTimeout(() => {

    blink();

    if (Math.random() < 0.25) {
      setTimeout(blink, 240);
    }

    blinkLoop();

  }, 1800 + Math.random() * 3000);

})();


/* ========================================
   喋っている状態
======================================== */

let speakTimer = null;

function startSpeaking() {

  clearTimeout(speakTimer);

  bot.classList.add("speaking");
}

function stopSpeaking(delay = 100) {

  clearTimeout(speakTimer);

  speakTimer = setTimeout(() => {

    bot.classList.remove("speaking");

  }, delay);
}


/* ========================================
   テロップ
======================================== */

function showText(
  text,
  speed = 0.045
) {

  clearTimeout(speakTimer);

  bubble.classList.remove("fade-out");
  bubble.classList.remove("loading");

  bubble.innerHTML = "";

  startSpeaking();

  const chars = [...text];

  chars.forEach((ch, i) => {

    const span =
      document.createElement("span");

    span.textContent = ch;

    span.style.animationDelay =
      (i * speed).toFixed(2) + "s";

    bubble.appendChild(span);

  });

  const totalMs =
    chars.length * speed * 1000 + 700;

  speakTimer = setTimeout(() => {

    bot.classList.remove("speaking");

  }, totalMs);
}


/* ========================================
   フェードアウト
======================================== */

async function fadeOutText() {

  bubble.classList.add("fade-out");

  await new Promise(resolve =>
    setTimeout(resolve, 400)
  );

  bubble.innerHTML = "";

  bubble.classList.remove(
    "fade-out"
  );
}


/* ========================================
   ステータス
======================================== */

function showStatus(text) {

  clearTimeout(speakTimer);

  bot.classList.remove("speaking");

  bubble.innerHTML = "";

  bubble.classList.add("loading");

  bubble.textContent = text;
}


/* ========================================
   WebLLMロード
======================================== */

async function loadModel() {

  try {

    showStatus(
      "AIを起動しています…"
    );

    engine =
      await webllm.CreateMLCEngine(
        MODEL_ID,
        {
          initProgressCallback:
            progress => {

              const text =
                progress.text || "";

              console.log(
                "[WebLLM]",
                text
              );

              if (
                text.includes("Loading") ||
                text.includes("loading")
              ) {

                showStatus(
                  "AIを準備しています…"
                );

              } else if (
                text.includes("Fetching") ||
                text.includes("fetch")
              ) {

                showStatus(
                  "AIを迎えにいっています…"
                );

              } else {

                showStatus(
                  "もうすぐ話せるよ…"
                );
              }

            }
        }
      );

    showText(
      "準備できたよ。今日は、どうだった？"
    );

    input.disabled = false;
    input.focus();

  } catch (error) {

    console.error(error);

    showStatus(
      "AIの起動に失敗しちゃった…"
    );

  }
}


/* ========================================
   終了ワード
======================================== */

function isEndCommand(text) {

  const commands = [
    "今日は終了",
    "今日はおやすみ"
  ];

  return commands.includes(
    text.trim()
  );
}


/* ========================================
   記憶整理
======================================== */

async function finishDay() {

  busy = true;
  input.disabled = true;

  await fadeOutText();

  showStatus(
    "今日の記憶を整理中…"
  );

  try {

    /*
     * 今日の会話をQwenに要約させる
     */

    const memory =
      await createMemory(
        engine,
        history
      );

    /*
     * 保存
     */

    saveMemory(memory);

    /*
     * 今回の履歴は役目を終えたので削除
     */

    clearHistory();

    history = [];

    await fadeOutText();

    showText(
      "今日のこと、覚えておくね。"
    );

    /*
     * テロップを少し見せる
     */

    await new Promise(resolve =>
      setTimeout(resolve, 1800)
    );

    /*
     * CronyGOへ移動
     */

    window.location.href =
      "https://cronygo.vercel.app";

  } catch (error) {

    console.error(
      "Memory error:",
      error
    );

    await fadeOutText();

    showText(
      "ごめん、今日は記憶を整理できなかった…"
    );

    busy = false;
    input.disabled = false;
    input.focus();
  }
}


/* ========================================
   AIに質問
======================================== */

async function askAI(text) {

  if (!engine) {
    return;
  }

  busy = true;
  input.disabled = true;


  /* ---------- ユーザー発話 ---------- */

  await fadeOutText();

  showText(
    "「" + text + "」",
    0.025
  );

  /*
   * 履歴へ保存
   */

  saveMessage(
    "user",
    text
  );

  history.push({
    role: "user",
    content: text
  });


  /* ---------- 少し間 ---------- */

  await new Promise(resolve =>
    setTimeout(resolve, 500)
  );


  /* ---------- 思考 ---------- */

  await fadeOutText();

  showStatus(
    "考えているよ…"
  );


  try {

    /*
     * 前回の記憶
     */

    const memory =
      loadMemory();


    /*
     * システムプロンプト
     */

    const systemPrompt =
      "あなたは親しみやすいパーソナルAIです。" +
      "日本語で自然に会話してください。" +
      "回答は簡潔にしてください。" +
      "堅苦しい表現は避けてください。";


    /*
     * 前回の記憶があれば追加
     */

    const messages = [

      {
        role: "system",
        content:
          memory
            ? systemPrompt +
              "\n\n[前回のあらすじ]\n" +
              memory
            : systemPrompt
      }

    ];


    /*
     * 今日の会話
     */

    history.forEach(message => {

      messages.push({
        role: message.role,
        content: message.content
      });

    });


    /*
     * AI生成
     */

    const response =
      await engine.chat.completions.create({

        messages,

        temperature: 0.7,

        max_tokens: 256

      });


    const answer =
      response
        .choices?.[0]
        ?.message
        ?.content
        ||
        "うまく答えられなかったみたい。";


    /*
     * AIの返答を保存
     */

    saveMessage(
      "assistant",
      answer
    );

    history.push({
      role: "assistant",
      content: answer
    });


    /* ---------- 表示 ---------- */

    await fadeOutText();

    showText(answer);


  } catch (error) {

    console.error(error);

    await fadeOutText();

    showText(
      "ごめん、ちょっと考えがうまくまとまらなかった。"
    );

  }


  busy = false;

  input.disabled = false;
  input.focus();
}


/* ========================================
   入力
======================================== */

input.addEventListener(
  "keydown",
  async e => {

    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const text =
      input.value.trim();

    if (!text || busy) {
      return;
    }

    input.value = "";


    /*
     * 終了ワードなら
     * AIへの通常質問にはしない
     */

    if (isEndCommand(text)) {

      await finishDay();

      return;
    }


    /*
     * 通常会話
     */

    await askAI(text);

  }
);


/* ========================================
   起動
======================================== */

window.addEventListener(
  "load",
  () => {

    loadModel();

  }
);
