import * as webllm from "@mlc-ai/web-llm";

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

const bot = document.getElementById("bot");
const bubble = document.getElementById("bubble");
const input = document.getElementById("input");


/* ========================================
   星空
======================================== */

(function createStars() {

  const box = document.getElementById("stars");

  for (let i = 0; i < 50; i++) {

    const star = document.createElement("div");

    star.className = "star";

    star.style.left =
      Math.random() * 100 + "%";

    star.style.top =
      Math.random() * 100 + "%";

    star.style.animationDelay =
      (Math.random() * 5).toFixed(2) + "s";

    star.style.opacity =
      (0.1 + Math.random() * 0.4).toFixed(2);

    box.appendChild(star);
  }

})();


/* ========================================
   瞬き
======================================== */

const eyes =
  document.querySelectorAll(".eye");

function blink() {

  // 喋っているときは瞬きしない
  if (bot.classList.contains("speaking")) {
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
   テロップ表示
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
   テロップを消す
======================================== */

async function fadeOutText() {

  bubble.classList.add("fade-out");

  await new Promise(resolve =>
    setTimeout(resolve, 400)
  );

  bubble.innerHTML = "";

  bubble.classList.remove("fade-out");
}


/* ========================================
   ステータス表示
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

    showStatus("AIを起動しています…");

    engine =
      await webllm.CreateMLCEngine(
        MODEL_ID,
        {
          initProgressCallback: progress => {

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
   AIに質問
======================================== */

async function askAI(text) {

  if (!engine) {
    return;
  }

  busy = true;
  input.disabled = true;

  /*
   * 一度ユーザー発話を表示
   */

  await fadeOutText();

  showText(
    "「" + text + "」",
    0.025
  );

  /*
   * 少し間を置く
   */

  await new Promise(resolve =>
    setTimeout(resolve, 500)
  );

  /*
   * AI思考中
   */

  await fadeOutText();

  showStatus(
    "考えているよ…"
  );

  try {

    const response =
      await engine.chat.completions.create({

        messages: [

          {
            role: "system",
            content:
              "あなたは親しみやすいパーソナルAIです。" +
              "日本語で自然に会話してください。" +
              "回答は簡潔にしてください。" +
              "堅苦しい表現は避けてください。"
          },

          {
            role: "user",
            content: text
          }

        ],

        temperature: 0.7,

        max_tokens: 256

      });

    const answer =
      response.choices?.[0]?.message?.content
      || "うまく答えられなかったみたい。";

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
  async (e) => {

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
