// ==========================================================================
//  Giriş ekranı + Şifremi unuttum
//  (Kayıt olma ekranı YOK — kullanıcılar Firebase Console'dan oluşturulur)
// ==========================================================================
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  SIFIRLAMA_ADRESI
} from "./firebase.js";
import { esc, ikon, toast, firebaseHata, butonMesgul } from "./utils.js";

const OZELLIKLER = [
  "Parsel bazlı gelir–gider takibi",
  "Malik başına esnek ödeme planı",
  "Gecikmiş tahsilat uyarıları"
];

/** Sol taraftaki marka paneli — iki ekranda da ortak */
function markaPaneli() {
  return `
    <div class="giris-marka">
      <div class="logo">
        <img src="./assets/kentbakiye-logo-light.png"
             srcset="./assets/kentbakiye-logo-light.png 1x, ./assets/kentbakiye-logo-light@2x.png 2x"
             alt="KentBakiye" width="238">
      </div>

      <div class="slogan">
        <h2>Dönüşümün hesabı <span>net.</span></h2>
        <p>
          Kentsel dönüşüm ve yapı projeleriniz için muhasebe, bütçe, ödeme,
          tahsilat ve mali raporlama sistemi.
        </p>
        <div class="giris-ozellik">
          ${OZELLIKLER.map((o) => `
            <div><span class="tik">${ikon("tik", { boyut: 12 })}</span><span>${esc(o)}</span></div>
          `).join("")}
        </div>
      </div>

      <div class="dipnot">KentBakiye · Kentsel Dönüşüm Muhasebe Sistemi</div>
    </div>`;
}

/* ==========================================================================
   Giriş ekranı
   ========================================================================== */
export function girisEkraniCiz(kok) {
  kok.innerHTML = `
    <div class="giris-sayfa">
      ${markaPaneli()}

      <div class="giris-form-panel">
        <div class="giris-kutu">
          <h1>Tekrar hoş geldiniz</h1>
          <p class="alt">Devam etmek için hesabınızla giriş yapın.</p>

          <form id="giris-form" novalidate>
            <div class="alan">
              <label for="g-eposta">E-posta adresi</label>
              <input id="g-eposta" type="email" autocomplete="username"
                     placeholder="ad.soyad@sirketiniz.com" required>
            </div>
            <div class="alan">
              <label for="g-sifre">Şifre</label>
              <input id="g-sifre" type="password" autocomplete="current-password"
                     placeholder="••••••••" required>
            </div>

            <div id="giris-hata" class="uyari gizli"></div>

            <button class="btn btn-ana btn-blok btn-buyuk" type="submit" style="margin-top:20px">
              Giriş Yap
            </button>
          </form>

          <div class="giris-alt-link">
            Şifrenizi mi unuttunuz?
            <button type="button" id="unuttum-btn">Sıfırlama bağlantısı gönder</button>
          </div>

          <div class="giris-yardim">
            ${ikon("kilit", { boyut: 13 })}
            Bu sistemde açık kayıt yoktur. Hesabınız yoksa şirket yöneticinizle
            iletişime geçin.
          </div>
        </div>
      </div>
    </div>`;

  const form = kok.querySelector("#giris-form");
  const hataKutu = kok.querySelector("#giris-hata");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hataKutu.classList.add("gizli");

    const eposta = kok.querySelector("#g-eposta").value.trim();
    const sifre = kok.querySelector("#g-sifre").value;
    const btn = form.querySelector('button[type="submit"]');

    if (!eposta || !sifre) {
      hataGoster(hataKutu, "E-posta ve şifre alanları zorunludur.");
      return;
    }

    butonMesgul(btn, true, "Giriş yapılıyor…");
    try {
      await signInWithEmailAndPassword(auth, eposta, sifre);
      // Başarılı girişte app.js'deki onAuthStateChanged devreye girer.
    } catch (err) {
      hataGoster(hataKutu, firebaseHata(err));
      butonMesgul(btn, false);
    }
  });

  kok.querySelector("#unuttum-btn").addEventListener("click", () => {
    sifreSifirlamaEkrani(kok, kok.querySelector("#g-eposta").value.trim());
  });
}

/* ==========================================================================
   Şifre sıfırlama ekranı
   ========================================================================== */
function sifreSifirlamaEkrani(kok, onDolduEposta = "") {
  kok.innerHTML = `
    <div class="giris-sayfa">
      ${markaPaneli()}

      <div class="giris-form-panel">
        <div class="giris-kutu">
          <h1>Şifre sıfırlama</h1>
          <p class="alt">
            E-posta adresinizi girin, şifre yenileme bağlantısını size gönderelim.
          </p>

          <form id="sifirla-form" novalidate>
            <div class="alan">
              <label for="s-eposta">E-posta adresi</label>
              <input id="s-eposta" type="email" autocomplete="username"
                     value="${esc(onDolduEposta)}" placeholder="ad.soyad@sirketiniz.com" required>
            </div>

            <div id="sifirla-mesaj" class="uyari gizli"></div>

            <button class="btn btn-ana btn-blok btn-buyuk" type="submit" style="margin-top:20px">
              Sıfırlama Bağlantısı Gönder
            </button>
          </form>

          <div class="giris-alt-link">
            <button type="button" id="geri-btn">← Giriş ekranına dön</button>
          </div>

          <div class="giris-yardim">
            ${ikon("anahtar", { boyut: 13 })}
            Bağlantı birkaç dakika içinde gelmezse spam / gereksiz klasörünüzü kontrol edin.
          </div>
        </div>
      </div>
    </div>`;

  const form = kok.querySelector("#sifirla-form");
  const mesaj = kok.querySelector("#sifirla-mesaj");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eposta = kok.querySelector("#s-eposta").value.trim();
    const btn = form.querySelector('button[type="submit"]');
    mesaj.classList.add("gizli");

    if (!eposta) {
      hataGoster(mesaj, "Lütfen e-posta adresinizi girin.");
      return;
    }

    butonMesgul(btn, true, "Gönderiliyor…");
    try {
      const ayarlar = SIFIRLAMA_ADRESI
        ? { url: SIFIRLAMA_ADRESI, handleCodeInApp: false }
        : undefined;
      await sendPasswordResetEmail(auth, eposta, ayarlar);
      mesaj.className = "uyari tamam";
      mesaj.innerHTML = `${ikon("tik")}<span>
        Şifre yenileme bağlantısı <b>${esc(eposta)}</b> adresine gönderildi.
        Gelen kutunuzu (ve spam klasörünü) kontrol edin.</span>`;
      toast("Sıfırlama e-postası gönderildi", "basarili");
    } catch (err) {
      hataGoster(mesaj, firebaseHata(err));
    } finally {
      butonMesgul(btn, false);
    }
  });

  kok.querySelector("#geri-btn").addEventListener("click", () => girisEkraniCiz(kok));
}

function hataGoster(kutu, metin) {
  kutu.className = "uyari";
  kutu.innerHTML = `${ikon("uyari")}<span>${esc(metin)}</span>`;
}
