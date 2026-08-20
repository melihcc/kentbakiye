// ==========================================================================
//  KentBakiye — Yardımcı fonksiyonlar
// ==========================================================================

export const $ = (sec, kok = document) => kok.querySelector(sec);
export const $$ = (sec, kok = document) => Array.from(kok.querySelectorAll(sec));

/** HTML kaçışı — kullanıcı metinlerini template içine gömerken şart */
export function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ==========================================================================
   İkonlar (satır içi SVG — dış bağımlılık yok)
   ========================================================================== */
const IKONLAR = {
  bina: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>',
  bloklar: '<path d="M3 21h18M4 21V10l5-3v14M13 21V4l7 4v13M8 21v-4M17 12h.01M17 16h.01"/>',
  zil: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  kisiler: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  fis: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  grafik: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/>',
  arti: '<path d="M12 5v14M5 12h14"/>',
  kalem: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  cop: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  solOk: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  sagOk: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  yukariOk: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  asagiOk: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  tik: '<path d="M20 6 9 17l-5-5"/>',
  uyari: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>',
  bilgi: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  konum: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  cikis: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  asagiChevron: '<path d="m6 9 6 6 6-6"/>',
  cuzdan: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M18 12a2 2 0 0 0 0 4h3v-4Z"/>',
  takvim: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  saat: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  carpi: '<path d="M18 6 6 18M6 6l12 12"/>',
  yukselen: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  dusen: '<path d="M22 17 13.5 8.5 8.5 13.5 2 7"/><path d="M16 17h6v-6"/>',
  kilit: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  anahtar: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  klasor: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  kalkan: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>'
};

/** Satır içi SVG ikon üretir */
export function ikon(ad, { boyut = 0, sinif = "" } = {}) {
  const govde = IKONLAR[ad];
  if (!govde) return "";
  const olcu = boyut ? ` width="${boyut}" height="${boyut}"` : "";
  return `<svg${olcu} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    class="${sinif}" aria-hidden="true">${govde}</svg>`;
}

/* ==========================================================================
   Para
   ========================================================================== */

/** 1234567.5 -> "1.234.567,50 ₺" */
export function fmtTL(n) {
  const sayi = Number(n) || 0;
  return sayi.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " ₺";
}

/** Kısa gösterim: "1.250.000 ₺" (kuruşsuz) */
export function fmtTLKisa(n) {
  const sayi = Math.round(Number(n) || 0);
  return sayi.toLocaleString("tr-TR") + " ₺";
}

/** Çok kısa gösterim: "1,25 Mn ₺" — dar kutular için */
export function fmtTLOzet(n) {
  const s = Number(n) || 0;
  const mutlak = Math.abs(s);
  if (mutlak >= 1e9) return (s / 1e9).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " Mr ₺";
  if (mutlak >= 1e6) return (s / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " Mn ₺";
  if (mutlak >= 1e4) return (s / 1e3).toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " B ₺";
  return fmtTLKisa(s);
}

/** "1.250.000,50" veya "1250000.50" -> 1250000.5 */
export function paraCoz(deger) {
  if (typeof deger === "number") return deger;
  if (!deger) return 0;
  let s = String(deger).trim().replace(/[^\d.,-]/g, "");
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    const parcalar = s.split(".");
    if (parcalar.length > 2) s = parcalar.join("");
    else if (parcalar.length === 2 && parcalar[1].length === 3) s = parcalar.join("");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/** 2 haneye yuvarla (kayan nokta hatalarını temizler) */
export const yuvarla = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Girdi kutusuna yazmak için: 1250000.5 -> "1.250.000,50" */
export const paraYaz = (n) =>
  (Number(n) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Para girişi olan input'a odak çıkışında TR formatlama ekler */
export function paraInputBagla(input) {
  if (!input) return;
  input.setAttribute("inputmode", "decimal");
  input.addEventListener("blur", () => {
    const d = paraCoz(input.value);
    input.value = d ? paraYaz(d) : "";
  });
  input.addEventListener("focus", () => input.select());
}

/* ==========================================================================
   Tarih
   ========================================================================== */

export function isoYap(d) {
  const y = d.getFullYear();
  const a = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${a}-${g}`;
}

/** Bugün -> "YYYY-MM-DD" (yerel saat) */
export function bugun() {
  return isoYap(new Date());
}

/** "2026-03-05" -> "05.03.2026" */
export function fmtTarih(iso) {
  if (!iso) return "-";
  const p = String(iso).split("-");
  if (p.length !== 3) return iso;
  return `${p[2]}.${p[1]}.${p[0]}`;
}

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
               "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

/** "2026-03-05" -> "Mart 2026" */
export function ayAdi(iso) {
  if (!iso) return "";
  const p = String(iso).split("-");
  return `${AYLAR[Number(p[1]) - 1] || ""} ${p[0]}`;
}

/** "2026-03-05" -> "5 Mart 2026" */
export function fmtTarihUzun(iso) {
  if (!iso) return "-";
  const p = String(iso).split("-");
  if (p.length !== 3) return iso;
  return `${Number(p[2])} ${AYLAR[Number(p[1]) - 1] || ""} ${p[0]}`;
}

/** ISO tarihe n ay ekler; ay sonu taşmasını engeller (31 Ocak + 1 ay = 28/29 Şubat) */
export function ayEkle(iso, n) {
  const [y, a, g] = String(iso).split("-").map(Number);
  const d = new Date(y, a - 1 + n, 1);
  const ayinSonGunu = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(g, ayinSonGunu));
  return isoYap(d);
}

/** İki ISO tarih arasındaki gün farkı (b - a) */
export function gunFarki(a, b) {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2 - d1) / 86400000);
}

/* ==========================================================================
   Taksit durumu
   ========================================================================== */

/**
 * Taksitin durumunu hesaplar.
 *   odendi   -> yeşil
 *   bekliyor -> sarı    (vadesi gelmemiş)
 *   gecikmis -> kırmızı (vadesi geçmiş, ödenmemiş)
 */
export function taksitDurumu(taksit, referansTarih = bugun()) {
  if (taksit.odendi) return "odendi";
  if (taksit.tarih && taksit.tarih < referansTarih) return "gecikmis";
  return "bekliyor";
}

export const DURUM_ETIKET = {
  odendi: "Ödendi",
  bekliyor: "Vadesi gelmedi",
  gecikmis: "Gecikmiş"
};

export const DURUM_RENK = {
  odendi: "var(--yesil-500)",
  bekliyor: "var(--sari-500)",
  gecikmis: "var(--kirmizi-500)"
};

/* ==========================================================================
   Toast
   ========================================================================== */

export function toast(mesaj, tip = "bilgi", sure = 3200) {
  const alan = document.getElementById("toast-alan");
  if (!alan) return;
  const t = document.createElement("div");
  t.className = "toast " + (tip === "hata" ? "hata" : tip === "basarili" ? "basarili" : "");
  const im = tip === "hata" ? "!" : tip === "basarili" ? "✓" : "i";
  t.innerHTML = `<span class="ikon">${im}</span><span>${esc(mesaj)}</span>`;
  alan.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .25s, transform .25s";
    t.style.opacity = "0";
    t.style.transform = "translateX(28px)";
    setTimeout(() => t.remove(), 260);
  }, sure);
}

/* ==========================================================================
   Modal
   ========================================================================== */

/**
 * Modal açar.
 * @returns {{kok:HTMLElement, govde:HTMLElement, alt:HTMLElement, kapat:Function, altYaz:Function}}
 */
export function modalAc({ baslik, icerikHTML = "", genis = false, altHTML = "" }) {
  const katman = document.getElementById("modal-katman");
  const kok = document.createElement("div");
  kok.className = "modal" + (genis ? " genis" : "");
  kok.innerHTML = `
    <div class="modal-bas">
      <h3>${esc(baslik)}</h3>
      <button class="kapat" type="button" aria-label="Kapat">✕</button>
    </div>
    <div class="modal-govde"></div>
    <div class="modal-alt${altHTML ? "" : " gizli"}">${altHTML}</div>`;
  const govde = kok.querySelector(".modal-govde");
  govde.innerHTML = icerikHTML;

  // Aynı anda birden fazla modal açılırsa öncekini gizle
  Array.from(katman.children).forEach((c) => (c.style.display = "none"));
  katman.appendChild(kok);
  katman.classList.remove("gizli");
  document.body.style.overflow = "hidden";

  function kapat() {
    kok.remove();
    document.removeEventListener("keydown", tusDinle);
    const kalan = Array.from(katman.children);
    if (!kalan.length) {
      katman.classList.add("gizli");
      document.body.style.overflow = "";
    } else {
      kalan[kalan.length - 1].style.display = "";
    }
  }

  function tusDinle(e) {
    if (e.key === "Escape" && katman.lastElementChild === kok) kapat();
  }

  kok.querySelector(".kapat").addEventListener("click", kapat);
  document.addEventListener("keydown", tusDinle);

  setTimeout(() => {
    const ilk = kok.querySelector("input:not([type=hidden]):not([readonly]), select, textarea");
    if (ilk) ilk.focus();
  }, 60);

  const nesne = {
    kok,
    govde,
    alt: kok.querySelector(".modal-alt"),
    kapat,
    /** Alt buton çubuğunu yeniden yazar */
    altYaz(html) {
      const alt = kok.querySelector(".modal-alt");
      alt.innerHTML = html;
      alt.classList.toggle("gizli", !html);
      nesne.alt = alt;
      return alt;
    }
  };
  return nesne;
}

/** Onay penceresi -> Promise<boolean> */
export function onay(mesaj, {
  baslik = "Emin misiniz?",
  onayMetni = "Evet, sil",
  tehlike = true
} = {}) {
  return new Promise((cozumle) => {
    const m = modalAc({
      baslik,
      icerikHTML: `
        <div class="uyari ${tehlike ? "" : "bilgi"}" style="margin-top:0">
          ${ikon(tehlike ? "uyari" : "bilgi")}
          <span>${esc(mesaj)}</span>
        </div>`,
      altHTML: `
        <span class="bosluk"></span>
        <button class="btn" data-rol="iptal" type="button">Vazgeç</button>
        <button class="btn ${tehlike ? "btn-tehlike" : "btn-ana"}" data-rol="tamam" type="button">
          ${esc(onayMetni)}
        </button>`
    });
    m.alt.querySelector('[data-rol="iptal"]').onclick = () => { m.kapat(); cozumle(false); };
    m.alt.querySelector('[data-rol="tamam"]').onclick = () => { m.kapat(); cozumle(true); };
  });
}

/* ==========================================================================
   Firebase hata mesajları
   ========================================================================== */

export function firebaseHata(err) {
  const kod = (err && err.code) || "";
  const sozluk = {
    "auth/invalid-email": "E-posta adresi geçersiz.",
    "auth/user-disabled": "Bu kullanıcı hesabı devre dışı bırakılmış.",
    "auth/user-not-found": "Bu e-posta ile kayıtlı kullanıcı bulunamadı.",
    "auth/wrong-password": "Şifre hatalı.",
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
    "auth/too-many-requests": "Çok fazla hatalı deneme yapıldı. Lütfen birazdan tekrar deneyin.",
    "auth/network-request-failed": "İnternet bağlantısı kurulamadı.",
    "auth/missing-password": "Lütfen şifrenizi girin.",
    "auth/operation-not-allowed": "Bu işlem Firebase tarafında kapalı.",
    "auth/unauthorized-domain": "Bu adres Firebase'de yetkili alan adları listesinde değil.",
    "permission-denied": "Bu işlem için yetkiniz yok.",
    "unavailable": "Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.",
    "failed-precondition": "Sorgu için gerekli Firestore dizini eksik."
  };
  if (sozluk[kod]) return sozluk[kod];
  if (kod) return `Hata: ${kod}`;
  return (err && err.message) || "Beklenmeyen bir hata oluştu.";
}

/* ==========================================================================
   Halka (donut) grafik
   ========================================================================== */

/**
 * SVG halka grafik üretir.
 * @param {Array<{ad:string, deger:number, renk:string}>} dilimler
 */
export function halkaGrafik(dilimler, {
  boyut = 196, kalinlik = 24, ortaUst = "", ortaAlt = "", ortaRenk = "var(--metin)"
} = {}) {
  const toplam = dilimler.reduce((t, d) => t + (Number(d.deger) || 0), 0);
  const r = (boyut - kalinlik) / 2;
  const cevre = 2 * Math.PI * r;
  const merkez = boyut / 2;
  const BOSLUK = toplam > 0 ? Math.min(6, cevre * 0.012) : 0;
  const dolgun = dilimler.filter((d) => (Number(d.deger) || 0) > 0);

  let daireler = `<circle cx="${merkez}" cy="${merkez}" r="${r}" fill="none"
      stroke="var(--yuzey-3)" stroke-width="${kalinlik}"/>`;

  if (toplam > 0) {
    let kayma = 0;
    dolgun.forEach((d) => {
      const uzunluk = (Number(d.deger) / toplam) * cevre;
      const cizgi = dolgun.length > 1 ? Math.max(1, uzunluk - BOSLUK) : uzunluk;
      daireler += `<circle cx="${merkez}" cy="${merkez}" r="${r}" fill="none"
        stroke="${d.renk}" stroke-width="${kalinlik}"
        stroke-dasharray="${cizgi.toFixed(2)} ${(cevre - cizgi).toFixed(2)}"
        stroke-dashoffset="${(-kayma).toFixed(2)}"
        stroke-linecap="round"
        transform="rotate(-90 ${merkez} ${merkez})"><title>${esc(d.ad)}: ${fmtTL(d.deger)}</title></circle>`;
      kayma += uzunluk;
    });
  }

  const lejant = dilimler.map((d) => {
    const yuzde = toplam > 0 ? ((Number(d.deger) || 0) / toplam) * 100 : 0;
    return `
      <div class="lejant-satir">
        <span class="kutu" style="background:${d.renk}"></span>
        <span class="ad">${esc(d.ad)}</span>
        <span class="val">${fmtTLKisa(d.deger)}</span>
        <span style="color:var(--metin-soluk);font-size:12px;font-weight:700;min-width:38px;text-align:right">
          %${yuzde.toFixed(0)}
        </span>
      </div>`;
  }).join("");

  return `
    <div class="grafik-sar">
      <svg width="${boyut}" height="${boyut}" viewBox="0 0 ${boyut} ${boyut}" role="img"
           aria-label="Gelir gider dağılımı">
        ${daireler}
        <text x="${merkez}" y="${merkez - 6}" text-anchor="middle"
          font-size="11.5" fill="var(--metin-soluk)" font-weight="700"
          letter-spacing=".06em">${esc(ortaUst).toLocaleUpperCase("tr-TR")}</text>
        <text x="${merkez}" y="${merkez + 17}" text-anchor="middle"
          font-size="18" fill="${ortaRenk}" font-weight="800"
          letter-spacing="-.03em">${esc(ortaAlt)}</text>
      </svg>
      <div class="grafik-lejant">${lejant}</div>
    </div>`;
}

/* ==========================================================================
   Diğer
   ========================================================================== */

/** Butonu meşgul/normal duruma alır */
export function butonMesgul(btn, mesgul, mesaj = "Kaydediliyor…") {
  if (!btn) return;
  if (mesgul) {
    btn.dataset.eskiMetin = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = esc(mesaj);
  } else {
    btn.disabled = false;
    if (btn.dataset.eskiMetin) btn.innerHTML = btn.dataset.eskiMetin;
  }
}

export function bosDurum({ ikonAd = "klasor", baslik, aciklama = "", butonHTML = "" }) {
  return `
    <div class="bos">
      <div class="ikon">${ikon(ikonAd)}</div>
      <h3>${esc(baslik)}</h3>
      ${aciklama ? `<p>${esc(aciklama)}</p>` : ""}
      ${butonHTML}
    </div>`;
}

/** Ad soyaddan baş harfleri üretir: "Ahmet Yılmaz" -> "AY" */
export function basHarfler(ad) {
  const p = String(ad || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (p[0][0] + p[p.length - 1][0]).toLocaleUpperCase("tr-TR");
}
