// ==========================================================================
//  Kullanıcı profili
//  İlk girişte ad soyad sorulur, sonraki girişlerde kullanıcıya adıyla hitap edilir.
//  Kayıt yeri: Firestore → kullanicilar/{uid}
// ==========================================================================
import { auth } from "./firebase.js";
import { profilGetir, profilYaz } from "./veri.js";
import { esc, ikon, modalAc, toast, butonMesgul, firebaseHata, basHarfler } from "./utils.js";

let profil = null;

/* ---------------- Erişimciler ---------------- */

export function mevcutProfil() {
  return profil;
}

/** Tam ad; profil yoksa e-postanın kullanıcı adı kısmına düşer */
export function tamAd() {
  if (profil && profil.adSoyad) return profil.adSoyad;
  const eposta = (auth.currentUser && auth.currentUser.email) || "";
  return eposta.split("@")[0].replace(/[._-]+/g, " ").trim() || "Kullanıcı";
}

/** Sadece ilk isim — "Ahmet Yılmaz" → "Ahmet" */
export function ilkAd() {
  return tamAd().trim().split(/\s+/)[0];
}

export function basHarflerim() {
  return basHarfler(tamAd());
}

/** Saate göre selamlama: "Günaydın" / "İyi günler" / "İyi akşamlar" */
export function selamlama() {
  const s = new Date().getHours();
  if (s < 6) return "İyi geceler";
  if (s < 12) return "Günaydın";
  if (s < 18) return "İyi günler";
  return "İyi akşamlar";
}

/* ---------------- Yükleme ---------------- */

/**
 * Oturum açıldıktan sonra profili yükler.
 * @returns {Promise<{profil:object|null, ilkGiris:boolean, hata:any}>}
 */
export async function profilYukle() {
  const user = auth.currentUser;
  if (!user) return { profil: null, ilkGiris: false, hata: null };
  try {
    profil = await profilGetir(user.uid);
    return { profil, ilkGiris: !profil || !profil.adSoyad, hata: null };
  } catch (err) {
    console.error("Profil okunamadı:", err);
    profil = null;
    // Profil okunamazsa uygulama yine de açılsın (ör. kural eksikse)
    return { profil: null, ilkGiris: false, hata: err };
  }
}

export function profilTemizle() {
  profil = null;
}

/** Profilin bir alanını günceller (yerel kopya da tazelenir) */
export async function profilGuncelle(veri) {
  const user = auth.currentUser;
  if (!user) return;
  await profilYaz(user.uid, veri);
  profil = { ...(profil || { uid: user.uid }), ...veri };
  return profil;
}

/* ==========================================================================
   İlk giriş — "Hoş geldiniz, adınız nedir?" penceresi
   ========================================================================== */

/**
 * İlk girişte açılır. Kullanıcı kapatamaz; ad soyad girmeden devam edemez.
 * @returns {Promise<string>} kaydedilen ad soyad
 */
export function hosgeldinAkisi() {
  return new Promise((cozumle) => {
    const eposta = (auth.currentUser && auth.currentUser.email) || "";
    const tahmin = eposta.split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\d+/g, "")
      .trim()
      .replace(/\b\p{Ll}/gu, (c) => c.toLocaleUpperCase("tr-TR"));

    const m = modalAc({
      baslik: "KentBakiye'ye hoş geldiniz",
      icerikHTML: `
        <div class="karsilama">
          <img class="karsilama-logo" src="./assets/kentbakiye-icon-192.png" alt="KentBakiye">
          <h3>Sizi tanıyalım</h3>
          <p>
            Size adınızla hitap edebilmemiz ve kayıtlarda kimin işlem yaptığının
            görünmesi için ad ve soyadınızı yazın. Bunu daha sonra sağ üstteki
            menüden değiştirebilirsiniz.
          </p>
        </div>

        <form id="karsilama-form" novalidate style="margin-top:20px">
          <div class="alan">
            <label for="k-ad">Ad Soyad *</label>
            <input id="k-ad" type="text" autocomplete="name" required
                   placeholder="Örn: Melih Çiftçi" value="${esc(tahmin)}">
          </div>
          <div class="alan" style="margin-bottom:0">
            <label>Hesabınız</label>
            <input type="text" value="${esc(eposta)}" readonly
                   style="background:var(--yuzey-3);color:var(--metin-soluk);cursor:default">
          </div>
          <div id="karsilama-hata" class="uyari gizli"></div>
        </form>`,
      altHTML: `
        <span class="bosluk"></span>
        <button class="btn btn-ana btn-buyuk" data-rol="kaydet" type="button">
          Devam Et ${ikon("sagOk", { boyut: 15 })}
        </button>`
    });

    // İlk girişte kapatma yolu yok — devam etmek zorunlu
    m.kok.querySelector(".modal-bas .kapat").remove();

    const form = m.govde.querySelector("#karsilama-form");
    const hata = m.govde.querySelector("#karsilama-hata");
    const input = m.govde.querySelector("#k-ad");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      m.alt.querySelector('[data-rol="kaydet"]').click();
    });

    m.alt.querySelector('[data-rol="kaydet"]').onclick = async (e) => {
      const adSoyad = input.value.trim().replace(/\s+/g, " ");
      if (adSoyad.length < 3 || !adSoyad.includes(" ")) {
        hata.className = "uyari";
        hata.innerHTML = `${ikon("uyari")}<span>Lütfen ad ve soyadınızı birlikte yazın.</span>`;
        input.focus();
        return;
      }
      hata.className = "uyari gizli";

      const btn = e.currentTarget;
      butonMesgul(btn, true, "Kaydediliyor…");
      try {
        await profilGuncelle({ adSoyad, tanitimGosterildi: false });
        m.kapat();
        cozumle(adSoyad);
      } catch (err) {
        console.error(err);
        hata.className = "uyari";
        hata.innerHTML = `${ikon("uyari")}<span>${esc(firebaseHata(err))}</span>`;
        butonMesgul(btn, false);
      }
    };

    setTimeout(() => { input.focus(); input.select(); }, 80);
  });
}

/* ==========================================================================
   Adı sonradan değiştirme
   ========================================================================== */
export function adDuzenleAc({ bitince } = {}) {
  const m = modalAc({
    baslik: "Adımı Düzenle",
    icerikHTML: `
      <form id="ad-form" novalidate>
        <div class="alan" style="margin-bottom:0">
          <label for="d-ad">Ad Soyad *</label>
          <input id="d-ad" type="text" autocomplete="name" value="${esc(tamAd())}" required>
          <div class="ipucu">Uygulama size bu isimle hitap eder.</div>
        </div>
        <div id="ad-hata" class="uyari gizli"></div>
      </form>`,
    altHTML: `
      <span class="bosluk"></span>
      <button class="btn" data-rol="iptal" type="button">Vazgeç</button>
      <button class="btn btn-ana" data-rol="kaydet" type="button">
        ${ikon("tik", { boyut: 15 })} Kaydet
      </button>`
  });

  const input = m.govde.querySelector("#d-ad");
  const hata = m.govde.querySelector("#ad-hata");

  m.govde.querySelector("#ad-form").addEventListener("submit", (e) => {
    e.preventDefault();
    m.alt.querySelector('[data-rol="kaydet"]').click();
  });

  m.alt.querySelector('[data-rol="iptal"]').onclick = m.kapat;
  m.alt.querySelector('[data-rol="kaydet"]').onclick = async (e) => {
    const adSoyad = input.value.trim().replace(/\s+/g, " ");
    if (adSoyad.length < 3 || !adSoyad.includes(" ")) {
      hata.className = "uyari";
      hata.innerHTML = `${ikon("uyari")}<span>Lütfen ad ve soyadınızı birlikte yazın.</span>`;
      return;
    }
    hata.className = "uyari gizli";

    const btn = e.currentTarget;
    butonMesgul(btn, true, "Kaydediliyor…");
    try {
      await profilGuncelle({ adSoyad });
      toast("Adınız güncellendi", "basarili");
      m.kapat();
      if (bitince) bitince();
    } catch (err) {
      console.error(err);
      hata.className = "uyari";
      hata.innerHTML = `${ikon("uyari")}<span>${esc(firebaseHata(err))}</span>`;
      butonMesgul(btn, false);
    }
  };
}
