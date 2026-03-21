"use strict";
(() => {
  // src/evaluate.ts
  var NUM_WORDS = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
    "10": "ten",
    "11": "eleven",
    "12": "twelve",
    "13": "thirteen",
    "20": "twenty",
    "30": "thirty",
    "100": "hundred",
    "1000": "thousand",
    "1000000": "million",
    "1000000000000": "trillion"
  };
  function normalizeTranscript(transcript) {
    return transcript.toLowerCase().replace(/\b\d+\b/g, (n) => NUM_WORDS[n] || n).replace(/[^a-z ]/g, "").trim().split(/\s+/);
  }
  function processAnswer(transcript, targetWord, retryCount2) {
    const target = targetWord.toLowerCase().replace(/[^a-z]/g, "").trim();
    const heard = normalizeTranscript(transcript);
    const correct = heard.some((w) => w === target);
    const displayHeard = heard.join(" ").trim();
    if (correct) {
      return {
        correct: true,
        screenMessage: "You got it!",
        screenClass: "correct",
        cindyMood: "happy",
        spoken: "You got it!",
        showNext: true
      };
    }
    const screenMessage = !displayHeard ? "No speech detected \u2014 try again!" : `I heard "${displayHeard}". Try again!`;
    return {
      correct: false,
      screenMessage,
      screenClass: "incorrect",
      cindyMood: retryCount2 >= 2 ? "crying" : "sad",
      spoken: screenMessage,
      showNext: false
    };
  }

  // src/client.ts
  var RECORD_SECONDS = 3;
  function removeBubbleBackground(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;
    const isLight = (x, y) => {
      const i = (y * w + x) * 4;
      return data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200;
    };
    const visited = new Uint8Array(w * h);
    const queue = [];
    for (let x = 0; x < w; x++) {
      queue.push(x, 0);
      queue.push(x, h - 1);
    }
    for (let y = 1; y < h - 1; y++) {
      queue.push(0, y);
      queue.push(w - 1, y);
    }
    for (let qi = 0; qi < queue.length; qi += 2) {
      const x = queue[qi], y = queue[qi + 1];
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const idx = y * w + x;
      if (visited[idx] || !isLight(x, y)) continue;
      visited[idx] = 1;
      data[idx * 4 + 3] = 0;
      queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    ctx.putImageData(imageData, 0, 0);
    img.src = canvas.toDataURL();
  }
  var WORDS = [
    "two",
    "ten",
    "three",
    "twelve",
    "thirteen",
    "twenty",
    "thirty",
    "eight",
    "thousand",
    "trillion"
  ];
  function pickWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }
  var ttsAudio = null;
  var youGotItAudio = new Audio("/speak?word=You%20got%20it!&raw=1");
  youGotItAudio.preload = "auto";
  async function speakWord(word, options = {}) {
    if (options.cache) {
      youGotItAudio.currentTime = 0;
      youGotItAudio.play().catch((err) => console.error("TTS play failed:", err));
      return;
    }
    try {
      const rawParam = options.raw ? "&raw=1" : "";
      const res = await fetch(`/speak?word=${encodeURIComponent(word)}${rawParam}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (ttsAudio) {
        ttsAudio.pause();
        URL.revokeObjectURL(ttsAudio.src);
      }
      ttsAudio = new Audio(objectUrl);
      ttsAudio.onended = () => URL.revokeObjectURL(objectUrl);
      ttsAudio.play().catch((err) => console.error("TTS play failed:", err));
    } catch (err) {
      console.error("TTS fetch failed:", err);
    }
  }
  var btn = document.getElementById("mic-btn");
  var statusEl = document.getElementById("status");
  var countdown = document.getElementById("countdown");
  var playback = document.getElementById("playback");
  var player = document.getElementById("audio-player");
  var wordEl = document.getElementById("word");
  var feedbackEl = document.getElementById("feedback");
  var cindyEl = document.getElementById("cindy");
  var nextBtn = document.getElementById("next-btn");
  var bubbleBg = document.getElementById("bubble-bg");
  if (bubbleBg.complete) {
    removeBubbleBackground(bubbleBg);
  } else {
    bubbleBg.addEventListener("load", () => removeBubbleBackground(bubbleBg), { once: true });
  }
  function showCindy(mood) {
    cindyEl.src = `images/Cindy_${mood}.png`;
  }
  function showPrompt(word) {
    feedbackEl.innerHTML = `Say <strong>${word}</strong>`;
    feedbackEl.className = "";
    showCindy("neutral");
  }
  nextBtn.addEventListener("click", () => {
    const next = pickWord();
    wordEl.textContent = next;
    showPrompt(next);
    nextBtn.classList.add("hidden");
    btn.classList.remove("hidden");
    statusEl.textContent = "Press the mic to record";
    wordSpoken = true;
    speakWord(next);
  });
  var firstWord = pickWord();
  wordEl.textContent = firstWord;
  showPrompt(firstWord);
  var mediaRecorder = null;
  var chunks = [];
  var timerInterval = null;
  var retryCount = 0;
  var wordSpoken = false;
  btn.addEventListener("click", async () => {
    if (mediaRecorder && mediaRecorder.state === "recording") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startRecording(stream);
    } catch (err) {
      statusEl.textContent = "Microphone access denied.";
      console.error(err);
    }
  });
  async function blobToWav(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();
    const targetRate = 16e3;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetRate), targetRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start();
    const resampled = await offlineCtx.startRendering();
    return encodeWav(resampled.getChannelData(0), targetRate);
  }
  function encodeWav(samples, sampleRate) {
    const pcm = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      pcm[i] = s < 0 ? s * 32768 : s * 32767;
    }
    const buf = new ArrayBuffer(44 + pcm.byteLength);
    const view = new DataView(buf);
    const w = (off, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
    };
    w(0, "RIFF");
    view.setUint32(4, 36 + pcm.byteLength, true);
    w(8, "WAVE");
    w(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    w(36, "data");
    view.setUint32(40, pcm.byteLength, true);
    new Int16Array(buf, 44).set(pcm);
    return buf;
  }
  async function startRecording(stream) {
    chunks = [];
    playback.style.display = "none";
    btn.disabled = true;
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      try {
        const wavBuffer = await blobToWav(blob);
        const form = new FormData();
        form.append("audio", new Blob([wavBuffer], { type: "audio/wav" }), "audio.wav");
        form.append("words", JSON.stringify([wordEl.textContent]));
        const res = await fetch("/transcribe", { method: "POST", body: form });
        const { transcript } = await res.json();
        const outcome = processAnswer(transcript, wordEl.textContent, retryCount);
        feedbackEl.textContent = outcome.screenMessage;
        feedbackEl.className = outcome.screenClass;
        statusEl.textContent = "";
        showCindy(outcome.cindyMood);
        if (outcome.spoken) speakWord(outcome.spoken, outcome.correct ? { cache: true } : { raw: true });
        if (outcome.correct) {
          retryCount = 0;
          btn.classList.add("hidden");
          nextBtn.classList.remove("hidden");
        } else {
          retryCount++;
          statusEl.textContent = "Press the mic to record";
        }
      } catch (err) {
        feedbackEl.textContent = "(transcription error)";
        console.error(err);
      }
      btn.disabled = false;
    };
    mediaRecorder.start();
    statusEl.textContent = "Get ready\u2026";
    if (!wordSpoken) {
      speakWord(wordEl.textContent);
      wordSpoken = true;
    }
    await new Promise((r) => setTimeout(r, 1e3));
    btn.classList.add("recording");
    let remaining = RECORD_SECONDS;
    countdown.textContent = String(remaining);
    countdown.classList.remove("hidden");
    statusEl.textContent = "Speak now!";
    timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        countdown.textContent = String(remaining);
      } else {
        clearInterval(timerInterval);
        countdown.classList.add("hidden");
        mediaRecorder.stop();
        btn.classList.remove("recording");
        btn.disabled = false;
        statusEl.textContent = "Processing\u2026";
      }
    }, 1e3);
  }
})();
