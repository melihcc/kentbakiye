// ==========================================================================
//  KentBakiye — uygulama girişi
//  Oturum kontrolü + profil akışı + hash tabanlı yönlendirme
//  (GitHub Pages için hash router → sayfa yenilense de çalışır)
// ==========================================================================
import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { esc, ikon, toast, firebaseHata } from "./utils.js";
import { girisEkraniCiz } from "./auth.js";
import { panelCiz } from "./panel.js";
import { parselDetayCiz } from "./parsel.js";
import { parselFormAc } from "./parsel-form.js";
import {
  profilYukle, profilTemizle, hosgeldinAkisi, adDuzenleAc,
  mevcutProfil, tamAd, basHarflerim
} from "./profil.js";
import { turBaslat } from "./tanitim.js";

const app = document.getElementById("app");
const acilis = document.getElementById("acilis");

let kullanici = null;
let kabukCizildi = false;
let profilHazir = false;

/* ==========================================================================
   Oturum
   ========================================================================== */
onAuthStateChanged(auth, async (user) => {
  kullanici = user;
  kabukCizildi = false;
  profilHazir = false;

  if (!user) {
    profilTemizle();
    acilisiKaldir();
    yonlendir();
    return;
  }

  // Profil yüklenmeden kabuk çizilmesin ki kullanıcıya doğru isimle hitap edelim
  const { ilkGiris, hata } = await profilYukle();
  profilHazir = true;
  acilisiKaldir();
  yonlendir();

  if (hata) {
    toast("Profil bilgisi okunamadı. Firestore kurallarını kontrol edin.", "hata", 8000);
    return;
  }

  if (ilkGiris) {
    await hosgeldinAkisi();
    kabukTazele();
    toast(`Hoş geldiniz, ${tamAd()}`, "basarili");
    turBaslat({ parselEkle: yeniParselAc });
  } else if (mevcutProfil() && mevcutProfil().tanitimGosterildi !== true) {
    // Adı var ama turu hiç görmemiş (ör. yarıda bırakılmış bir kurulum)
    turBaslat({ parselEkle: yeniParselAc });
  }
});

function acilisiKaldir() {
  if (acilis && acilis.parentNode) acilis.remove();
}

window.addEventListener("hashchange", yonlendir);

/* ==========================================================================
   Yönlendirme
   ========================================================================== */
function yonlendir() {
  if (!kullanici) {
    const katman = document.getElementById("modal-katman");
    katman.innerHTML = "";
    katman.classList.add("gizli");
    document.body.style.overflow = "";
    girisEkraniCiz(app);
    return;
  }

  if (!profilHazir) return; // profil gelince tekrar çağrılacak
  if (!kabukCizildi) kabukCiz();

  const icerik = document.getElementById("icerik-alan");
  const rota = (location.hash || "#/panel").replace(/^#/, "");

  const parselEsleme = rota.match(/^\/parsel\/([^/]+)$/);
  if (parselEsleme) {
    parselDetayCiz(icerik, decodeURIComponent(parselEsleme[1]));
    return;
  }

  if (rota !== "/panel") {
    location.hash = "#/panel";
    return;
  }

  panelCiz(icerik);
}

/** Ad değişince üst barı ve paneli tazeler */
function kabukTazele() {
  kabukCizildi = false;
  yonlendir();
}

function yeniParselAc() {
  parselFormAc({ bitince: kabukTazele });
}

/* ==========================================================================
   Uygulama kabuğu
   ========================================================================== */
function kabukCiz() {
  const eposta = kullanici.email || "";
  app.innerHTML = `
    <header class="ust-bar">
      <button class="marka" id="marka" type="button" aria-label="Panele git">
        <img src="./assets/kentbakiye-logo.png"
             srcset="./assets/kentbakiye-logo.png 1x, ./assets/kentbakiye-logo@2x.png 2x"
             alt="KentBakiye">
      </button>

      <div class="bosluk"></div>

      <div class="kullanici-menu">
        <button class="kullanici-btn" id="kullanici-btn" type="button"
                aria-haspopup="true" aria-expanded="false">
          <span class="avatar">${esc(basHarflerim())}</span>
          <span class="eposta">${esc(tamAd())}</span>
          <span class="ok">${ikon("asagiChevron", { boyut: 15 })}</span>
        </button>
      </div>
    </header>

    <main class="icerik" id="icerik-alan"></main>`;

  document.getElementById("marka").onclick = () => (location.hash = "#/panel");

  const kbtn = document.getElementById("kullanici-btn");
  const sarmal = kbtn.parentElement;
  let acilir = null;

  kbtn.onclick = (e) => {
    e.stopPropagation();
    if (acilir) return menuKapat();

    acilir = document.createElement("div");
    acilir.className = "acilir";
    acilir.innerHTML = `
      <div class="bilgi">
        <div class="e">Oturum açık</div>
        <div class="d">${esc(tamAd())}</div>
        <div class="e" style="margin-top:5px;text-transform:none;letter-spacing:0;font-weight:600">
          ${esc(eposta)}
        </div>
      </div>
      <button type="button" id="ad-btn">${ikon("kalem", { boyut: 16 })} Adımı düzenle</button>
      <button type="button" id="tur-btn">${ikon("bilgi", { boyut: 16 })} Tanıtımı tekrar izle</button>
      <button type="button" class="tehlike" id="cikis-btn">
        ${ikon("cikis", { boyut: 16 })} Oturumu kapat
      </button>`;
    sarmal.appendChild(acilir);
    kbtn.setAttribute("aria-expanded", "true");

    acilir.querySelector("#ad-btn").onclick = () => {
      menuKapat();
      adDuzenleAc({ bitince: kabukTazele });
    };

    acilir.querySelector("#tur-btn").onclick = () => {
      menuKapat();
      turBaslat({ parselEkle: yeniParselAc });
    };

    acilir.querySelector("#cikis-btn").onclick = async () => {
      menuKapat();
      try {
        await signOut(auth);
        profilTemizle();
        location.hash = "";
        toast("Oturum kapatıldı", "basarili");
      } catch (err) {
        toast(firebaseHata(err), "hata");
      }
    };

    setTimeout(() => document.addEventListener("click", disaridaTikla), 0);
    document.addEventListener("keydown", escKapat);
  };

  function menuKapat() {
    if (!acilir) return;
    acilir.remove();
    acilir = null;
    kbtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", disaridaTikla);
    document.removeEventListener("keydown", escKapat);
  }
  function disaridaTikla(e) { if (!sarmal.contains(e.target)) menuKapat(); }
  function escKapat(e) { if (e.key === "Escape") menuKapat(); }

  kabukCizildi = true;
}

/* ==========================================================================
   Kurulum kontrolü
   ========================================================================== */
import("./config.js").then(({ firebaseConfig }) => {
  if (String(firebaseConfig.apiKey || "").startsWith("BURAYA")) {
    setTimeout(() => {
      toast("Firebase ayarları yapılmamış! js/config.js dosyasını doldurun.", "hata", 12000);
    }, 800);
  }
});
