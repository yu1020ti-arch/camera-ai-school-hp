/* =========================================================
   カメラAI×写真オンラインスクール 表示用プログラム
   （掲載内容の編集は data.js のほうで行ってください）
   ========================================================= */

// テキストをHTMLとして安全に埋め込む（<や&などの記号対策）
function esc(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// YouTubeのURLから動画IDを取り出す（data.jsでthumb省略時のサムネ自動取得に使用）
function ytId(url){
  const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([\w-]{11})/);
  return m ? m[1] : "";
}

// サムネイルのimgタグを生成。高画質版を試し、無い動画は標準画質に自動で切り替え
function thumbImg(v, alt){
  if(v.thumb) return `<img src="${esc(v.thumb)}" alt="${esc(alt)}" decoding="async">`;
  const id = ytId(v.url);
  if(!id) return `<img src="https://picsum.photos/seed/fallback/640/360" alt="${esc(alt)}" decoding="async">`;
  return `<img src="https://img.youtube.com/vi/${id}/maxresdefault.jpg" data-fb="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="${esc(alt)}" decoding="async">`;
}

// ヒーローコラージュ
const collage = document.getElementById("heroCollage");
HERO_PHOTOS.forEach((src,i)=>{
  const d=document.createElement("div");
  if(i%5===0) d.className="wide";
  if(i>=12) d.classList.add("sp-hide");
  d.innerHTML=`<img src="${esc(src)}" alt="受講生のみなさんの写真" loading="eager" decoding="async">`;
  collage.appendChild(d);
});

// 対談セクションの文章（data.jsのTALK_INTRO。1行空けで段落に）
document.getElementById("talkIntro").innerHTML =
  (typeof TALK_INTRO === "string" ? TALK_INTRO : "").trim()
    .split(/\n\s*\n/).filter(Boolean)
    .map(p=>`<p>${esc(p.trim()).replace(/\n/g,"<br>")}</p>`).join("");

// 対談動画
document.getElementById("talkGrid").innerHTML = TALK_VIDEOS.map(v=>`
  <a class="talk-card" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">
    <div class="talk-card__thumb">
      ${thumbImg(v, v.title)}
      <span class="talk-card__label">SPECIAL TALK</span>
      <span class="play-btn"></span>
    </div>
    <div class="talk-card__body">
      <h3>${esc(v.title)}</h3>
      <p>${esc(v.desc)}</p>
    </div>
  </a>`).join("");

// 受講生の変化（data.jsのSTORIES。空のときはセクションごと非表示）
const storySec=document.getElementById("stories");
if(typeof STORIES!=="undefined" && Array.isArray(STORIES) && STORIES.length){
  document.getElementById("storyGrid").innerHTML=STORIES.map(s=>{
    const avatar = s.photo
      ? `<img class="story-card__avatar" src="${esc(s.photo)}" alt="${esc(s.name)}" decoding="async">`
      : `<span class="story-card__avatar">${esc((s.name||"？").charAt(0))}</span>`;
    const photos = (s.beforePhoto || s.afterPhoto) ? `
      <div class="story-photos">
        ${s.beforePhoto?`
        <a class="story-photo" href="${esc(s.beforePhoto)}" data-lightbox>
          <img src="${esc(s.beforePhoto)}" alt="${esc(s.name)}のBEFORE写真" loading="lazy" decoding="async">
          <span class="story-photo__label story-photo__label--before">BEFORE</span>
        </a>`:""}
        ${s.afterPhoto?`
        <a class="story-photo" href="${esc(s.afterPhoto)}" data-lightbox>
          <img src="${esc(s.afterPhoto)}" alt="${esc(s.name)}のAFTER写真" loading="lazy" decoding="async">
          <span class="story-photo__label story-photo__label--after">AFTER</span>
        </a>`:""}
      </div>`:"";
    return `
    <article class="story-card">
      <div class="story-card__head">
        ${avatar}
        <div>
          <div class="story-card__name">${esc(s.name)}</div>
          ${s.role?`<div class="story-card__role">${esc(s.role)}</div>`:""}
        </div>
      </div>
      <div class="story-step story-step--before">
        <span class="story-step__label">BEFORE</span>
        <p>${esc(s.before)}</p>
      </div>
      <div class="story-card__arrow">▼</div>
      <div class="story-step story-step--after">
        <span class="story-step__label">AFTER</span>
        <p>${esc(s.after)}</p>
      </div>
      ${photos}
      ${s.voice?`<p class="story-card__voice">${esc(s.voice)}</p>`:""}
    </article>`;
  }).join("");
}else{
  storySec.style.display="none";
}

// オフ会：流れるマルキー（2周分並べてループ）
const track=document.getElementById("marqueeTrack");
track.innerHTML=[...OFFKAI_PHOTOS,...OFFKAI_PHOTOS].map(s=>`<img src="${esc(s)}" alt="オフ会の写真" decoding="async">`).join("");

// オフ会：ギャラリー
document.getElementById("gallery").innerHTML = OFFKAI_PHOTOS.map(s=>
  `<a href="${esc(s)}" data-lightbox><img src="${esc(s)}" alt="オフ会の写真" loading="lazy" decoding="async"></a>`).join("");

// YouTubeサムネの高画質→標準画質フォールバック（inlineハンドラを使わずCSP対応）
document.querySelectorAll("img[data-fb]").forEach(img=>{
  const swap=()=>{ if(img.dataset.fb){ img.src=img.dataset.fb; delete img.dataset.fb; } };
  img.addEventListener("error",swap,{once:true});
  img.addEventListener("load",()=>{ if(img.naturalWidth<=120) swap(); });
  if(img.complete && img.naturalWidth>0 && img.naturalWidth<=120) swap();
});

// ライトボックス（写真の拡大表示）
const lightbox=document.getElementById("lightbox");
const lightboxImg=document.getElementById("lightboxImg");
document.querySelectorAll("[data-lightbox]").forEach(a=>{
  a.addEventListener("click",e=>{
    e.preventDefault();
    lightboxImg.src=a.href;
    lightbox.classList.add("open");
  });
});
document.getElementById("lightboxClose").addEventListener("click",()=>lightbox.classList.remove("open"));
lightbox.addEventListener("click",e=>{if(e.target===lightbox)lightbox.classList.remove("open");});
document.addEventListener("keydown",e=>{if(e.key==="Escape")lightbox.classList.remove("open");});

// ドロワー
const hamburger=document.getElementById("hamburger");
const drawer=document.getElementById("drawer");
hamburger.addEventListener("click",()=>{
  document.body.classList.toggle("drawer-open");
  drawer.classList.toggle("open");
});
drawer.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
  document.body.classList.remove("drawer-open");
  drawer.classList.remove("open");
}));

// スクロールフェードイン
const io=new IntersectionObserver(entries=>{
  entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add("show");io.unobserve(en.target);}});
},{threshold:.12});
document.querySelectorAll(".fade").forEach(el=>io.observe(el));
