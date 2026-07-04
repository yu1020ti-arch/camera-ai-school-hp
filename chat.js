/* =========================================================
   受講生専用 AIチャット「ゆうすけに質問」
   CHAT_URL（data.jsで設定）が空のときは何も表示されません。
   ========================================================= */
(function(){
  if (typeof CHAT_URL === "undefined" || !CHAT_URL) return;

  // --- 画面の組み立て ---
  const root = document.createElement("div");
  root.innerHTML = `
  <button class="chat-fab" id="chatFab" aria-label="ゆうすけに質問する">
    <span class="chat-fab__icon">💬</span>
    <span class="chat-fab__label">質問する</span>
  </button>
  <div class="chat-panel" id="chatPanel" aria-hidden="true">
    <div class="chat-head">
      <span class="chat-head__avatar">📷</span>
      <div>
        <div class="chat-head__name">ゆうすけに質問</div>
        <div class="chat-head__sub">カメラ講座のことなら何でもどうぞ</div>
      </div>
      <button class="chat-close" id="chatClose" aria-label="閉じる">×</button>
    </div>

    <div class="chat-gate" id="chatGate">
      <p class="chat-gate__text">こちらは受講生専用のチャットです。<br>スクールでお伝えしている<b>合言葉</b>を入力してください。</p>
      <input class="chat-gate__input" id="chatPassInput" type="text" placeholder="合言葉" autocomplete="off">
      <button class="chat-gate__btn" id="chatPassBtn">はじめる</button>
      <p class="chat-gate__err" id="chatGateErr"></p>
    </div>

    <div class="chat-body" id="chatBody" hidden>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-inputrow">
        <textarea class="chat-input" id="chatInput" rows="1" placeholder="質問を入力…"></textarea>
        <button class="chat-send" id="chatSend" aria-label="送信">➤</button>
      </div>
      <p class="chat-note">AIのゆうすけが回答します。分からないことは運営のゆうすけに直接ご質問ください。</p>
    </div>
  </div>`;
  document.body.appendChild(root);

  const $ = (id)=>document.getElementById(id);
  const fab=$("chatFab"), panel=$("chatPanel"), closeBtn=$("chatClose");
  const gate=$("chatGate"), passInput=$("chatPassInput"), passBtn=$("chatPassBtn"), gateErr=$("chatGateErr");
  const body=$("chatBody"), messagesEl=$("chatMessages"), input=$("chatInput"), sendBtn=$("chatSend");

  let password = sessionStorage.getItem("chat_pass") || "";
  const history = [];   // {role:"user"|"assistant", content:"..."}
  let sending = false;

  function addBubble(role, text){
    const div=document.createElement("div");
    div.className = "chat-msg chat-msg--" + (role==="user" ? "user" : "bot");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showChat(){
    gate.hidden = true;
    body.hidden = false;
    if(!messagesEl.childElementCount){
      addBubble("bot","こんにちは、ゆうすけです😊 カメラ講座について、気になることを気軽に聞いてくださいね。");
    }
    input.focus();
  }

  function openPanel(){
    panel.classList.add("open");
    panel.setAttribute("aria-hidden","false");
    fab.classList.add("hide");
    if(password) showChat(); else passInput.focus();
  }
  function closePanel(){
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden","true");
    fab.classList.remove("hide");
  }

  fab.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);

  passBtn.addEventListener("click", ()=>{
    const v = passInput.value.trim();
    if(!v){ gateErr.textContent="合言葉を入力してください"; return; }
    password = v;
    sessionStorage.setItem("chat_pass", v);
    gateErr.textContent="";
    showChat();
  });
  passInput.addEventListener("keydown", e=>{ if(e.key==="Enter") passBtn.click(); });

  async function send(){
    const text = input.value.trim();
    if(!text || sending) return;
    input.value = "";
    sending = true;
    sendBtn.disabled = true;

    addBubble("user", text);
    history.push({role:"user", content:text});
    const typing = addBubble("bot","…考え中…");
    typing.classList.add("chat-msg--typing");

    try{
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          password: password,
          messages: history.slice(-8),   // 直近のやりとりだけ送る（費用節約）
        }),
      });

      if(res.status === 401){
        typing.remove();
        history.pop();
        password = "";
        sessionStorage.removeItem("chat_pass");
        body.hidden = true;
        gate.hidden = false;
        gateErr.textContent = "合言葉が違うようです。もう一度入力してください。";
        return;
      }
      if(res.status === 429){
        typing.remove();
        history.pop();
        addBubble("bot","今日はたくさん質問をいただいたので、少しお休みします🙏 また明日聞いてくださいね。急ぎの場合は運営のゆうすけに直接ご質問ください。");
        return;
      }
      if(!res.ok) throw new Error("HTTP "+res.status);

      const data = await res.json();
      typing.remove();
      const reply = (data && data.reply) ? data.reply : "うまく答えられませんでした。運営のゆうすけに直接質問してください。";
      addBubble("bot", reply);
      history.push({role:"assistant", content:reply});
    }catch(err){
      typing.remove();
      history.pop();
      addBubble("bot","通信がうまくいきませんでした🙏 少し時間をおいて試してみてください。急ぎの場合は運営のゆうすけに直接ご質問ください。");
    }finally{
      sending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", e=>{
    if(e.key==="Enter" && !e.shiftKey && !e.isComposing){
      e.preventDefault();
      send();
    }
  });
})();
