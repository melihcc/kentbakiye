// ==========================================================================
//  Tanıtım turu
//  Gerçek arayüz öğelerini spot ışığıyla gösterir, kavramları da
//  canlı mini örneklerle anlatır. İlk girişte otomatik açılır,
//  sonradan kullanıcı menüsünden tekrar başlatılabilir.
// ==========================================================================
import { esc, ikon, fmtTL, fmtTLKisa, halkaGrafik } from "./utils.js";
import { ilkAd, profilGuncelle } from "./profil.js";

let aktifTur = null;

/* ==========================================================================
   Adımlar
   ========================================================================== */
function adimlariUret() {
  return [
    /* -------- 1. Karşılama -------- */
    {
      genis: true,
      baslik: `Merhaba ${ilkAd()}, hoş geldiniz`,
      metin: "Yaklaşık bir dakikada KentBakiye'yi baştan sona tanıyalım. " +
             "İstediğiniz an “Atla” diyebilir, turu daha sonra sağ üstteki menüden tekrar açabilirsiniz.",
      icerikHTML: `
        <div class="tur-ozet">
          ${ozetKutu("bloklar", "Parseller", "Her kentsel dönüşüm projeniz bir parsel")}
          ${ozetKutu("kisiler", "Malik ödemeleri", "Kimden ne zaman ne kadar tahsil edeceğiniz")}
          ${ozetKutu("fis", "Harcamalar", "O parsele harcadığınız her kuruş")}
        </div>`
    },

    /* -------- 2. Özet kutuları (gerçek öğe) -------- */
    {
      hedef: ".stat-grid",
      baslik: "Şirketin genel mali tablosu",
      metin: "Bu altı kutu tüm projelerinizin toplamını gösterir: kaç parseliniz var, " +
             "ne kadar tahsil ettiniz, ne kadar harcadınız, kasada ne kaldı ve " +
             "ne kadar alacağınız gecikti."
    },

    /* -------- 3. Bildirimler (gerçek öğe) -------- */
    {
      hedef: "#bildirim-liste",
      hedefKart: true,
      baslik: "Bildirimler sizi uyarır",
      metin: "Vadesi geçmiş ödemeler kırmızı, 30 gün içinde vadesi gelecekler sarı " +
             "olarak burada listelenir. Bir bildirime tıkladığınızda ilgili parselin " +
             "sayfası açılır."
    },

    /* -------- 4. Yeni parsel (gerçek öğe) -------- */
    {
      hedef: "#yeni-parsel-btn",
      baslik: "Her şey bir parselle başlar",
      metin: "Ada/parsel numarası, konum ve proje durumunu girerek yeni bir " +
             "kentsel dönüşüm projesi açarsınız. Listedeki bir karta tıklayınca " +
             "o parselin kendi sayfası açılır."
    },

    /* -------- 5. Parsel sayfası düzeni -------- */
    {
      genis: true,
      baslik: "Parsel sayfası ikiye ayrılır",
      metin: "Üstte size gelecek paralar, altta sizin yaptığınız harcamalar, " +
             "sağda ise ikisinin özeti bulunur.",
      icerikHTML: `
        <div class="tur-duzen">
          <div class="tur-duzen-sol">
            <div class="tur-blok gelir">
              <span class="bolum-etiket gelir">${ikon("yukariOk")} Gelir</span>
              <b>Bize Yapılacak Ödemeler</b>
              <small>Her malik için ayrı bir pencere</small>
            </div>
            <div class="tur-blok gider">
              <span class="bolum-etiket gider">${ikon("asagiOk")} Gider</span>
              <b>Harcamalarımız</b>
              <small>Yıkımdan iskâna tüm giderler</small>
            </div>
          </div>
          <div class="tur-blok ozet">
            <span class="rozet turkuaz">${ikon("grafik", { boyut: 11 })} Özet</span>
            <b>Gelen · Harcanan</b>
            <small>Kasa bakiyesi ve grafik</small>
          </div>
        </div>`
    },

    /* -------- 6. Ödeme planı sihirbazı -------- */
    {
      genis: true,
      baslik: "Ödeme planını sizin yerinize kuruyoruz",
      metin: "Her malik farklı bir plan isteyebilir. Siz üç bilgiyi girin, planı biz hazırlayalım.",
      icerikHTML: `
        <div class="tur-akis">
          ${akisKutu("1", "Toplam tutar", "Malikin ödeyeceği para")}
          ${akisOk()}
          ${akisKutu("2", "Peşinat", "Peşin alınan kısım")}
          ${akisOk()}
          ${akisKutu("3", "Vade", "Kaç taksit, hangi sıklıkla")}
        </div>
        <div class="uyari bilgi" style="margin-bottom:0">
          ${ikon("bilgi")}
          <span><b>Kaydetmeden önce her vadeyi tek tek düzenleyebilirsiniz.</b>
          Tarihleri ve tutarları değiştirebilir, satır ekleyip silebilirsiniz —
          plan toplamı ile sözleşme tutarı arasındaki fark size canlı gösterilir.</span>
        </div>`
    },

    /* -------- 7. Renk kodları (etkileşimli) -------- */
    {
      genis: true,
      baslik: "Ödemeleri tek tıkla işaretleyin",
      metin: "Malik penceresindeki her satır bir vadedir. Rengi durumu anlatır. " +
             "Tahsilat yaptığınızda satıra tıklayın — anında yeşile döner ve kaydedilir.",
      icerikHTML: `
        <div class="tur-taksitler" id="tur-taksit-demo">
          ${demoTaksit(1, "10.01.2026", 300000, "odendi")}
          ${demoTaksit(2, "15.09.2026", 250000, "bekliyor")}
          ${demoTaksit(3, "15.07.2026", 250000, "gecikmis")}
        </div>
        <div class="tur-renk-aciklama">
          ${renkSatir("var(--yesil-500)", "Yeşil", "Tahsil edildi")}
          ${renkSatir("var(--sari-500)", "Sarı", "Vadesi henüz gelmedi")}
          ${renkSatir("var(--kirmizi-500)", "Kırmızı", "Vadesi geçti, ödenmedi")}
        </div>
        <div class="tur-dene">${ikon("bilgi", { boyut: 14 })} Deneyin: yukarıdaki satırlara tıklayın.</div>`,
      hazir(balon) {
        balon.querySelectorAll("#tur-taksit-demo .taksit").forEach((el) => {
          el.onclick = () => {
            const odendiMi = el.classList.contains("odendi");
            const eski = el.dataset.eski;
            el.classList.remove("odendi", "bekliyor", "gecikmis");
            el.classList.add(odendiMi ? eski : "odendi");
            const d = el.classList.contains("odendi") ? "odendi"
              : el.classList.contains("gecikmis") ? "gecikmis" : "bekliyor";
            el.querySelector(".durum-yazi").textContent =
              { odendi: "Ödendi", bekliyor: "Vadesi gelmedi", gecikmis: "Gecikmiş" }[d];
            el.querySelector(".kutu").textContent =
              d === "odendi" ? "✓" : d === "gecikmis" ? "!" : "";
          };
        });
      }
    },

    /* -------- 8. Harcamalar -------- */
    {
      genis: true,
      baslik: "Harcamaları kaleme dökün",
      metin: "Sayfanın alt bölümüne o parsel için yaptığınız her ödemeyi girersiniz. " +
             "Sebep listesinde kentsel dönüşümde en sık kullanılan 35 kalem hazır gelir; " +
             "listede yoksa “Diğer” ile kendiniz yazarsınız.",
      icerikHTML: `
        <div class="tur-tablo">
          ${demoHarcama("12.06.2026", "Yıkım İşleri", "ABC İnşaat Ltd. Şti.", 450000)}
          ${demoHarcama("20.07.2026", "Kira Yardımı Ödemesi", "8 malik", 120000)}
          ${demoHarcama("05.08.2026", "Ruhsat Harçları", "Belediye", 265000)}
          <div class="tur-tablo-satir toplam">
            <span class="ad">TOPLAM HARCAMA</span>
            <span class="tutar">${fmtTL(835000)}</span>
          </div>
        </div>
        <div class="tur-etiketler">
          ${["Proje ve İzinler", "Malik Ödemeleri", "Kaba Yapı", "Tesisat", "İnce İşler", "Genel Giderler"]
            .map((k) => `<span class="rozet">${esc(k)}</span>`).join("")}
        </div>`
    },

    /* -------- 9. Özet ve grafik -------- */
    {
      genis: true,
      baslik: "Parselin kârı bir bakışta",
      metin: "Sağdaki panel o parsele gelen toplam parayı, harcanan toplam parayı ve " +
             "aradaki kasa bakiyesini halka grafikle gösterir. Siz bir tahsilat işaretledikçe " +
             "veya harcama girdikçe anında güncellenir.",
      icerikHTML: `
        <div class="tur-grafik">
          <div style="max-width:250px">
            ${halkaGrafik(
              [
                { ad: "Gelen Para (Tahsilat)", deger: 1500000, renk: "var(--yesil-500)" },
                { ad: "Harcanan Para", deger: 920000, renk: "var(--kirmizi-500)" }
              ],
              { ortaUst: "Kasa Bakiyesi", ortaAlt: fmtTLKisa(580000), ortaRenk: "var(--mor)" }
            )}
          </div>
          <div class="tur-grafik-not">
            <div class="ozet-satir"><span class="e">Sözleşme toplamı</span><span class="d">${fmtTL(4800000)}</span></div>
            <div class="ozet-satir"><span class="e">Tahsil edilen</span><span class="d d-yesil">${fmtTL(1500000)}</span></div>
            <div class="ozet-satir"><span class="e">Vadesi gelmemiş</span><span class="d d-sari">${fmtTL(2500000)}</span></div>
            <div class="ozet-satir"><span class="e">Gecikmiş alacak</span><span class="d d-kirmizi">${fmtTL(800000)}</span></div>
            <div class="ozet-ayrac"></div>
            <div class="ozet-satir vurgu"><span class="e">Kalan alacak</span><span class="d">${fmtTL(3300000)}</span></div>
          </div>
        </div>`
    },

    /* -------- 10. Bitiş -------- */
    {
      genis: true,
      son: true,
      baslik: "Hazırsınız!",
      metin: "Sıra ilk projenizi açmakta. Bu turu istediğiniz zaman sağ üstteki " +
             "kullanıcı menüsünden tekrar başlatabilirsiniz.",
      icerikHTML: `
        <div class="tur-adimlar-liste">
          ${yapilacak("1", "Parselinizi oluşturun", "Ada, parsel ve konum bilgisiyle.")}
          ${yapilacak("2", "Malikleri ekleyin", "Toplam tutar, peşinat ve vadeyi girin; planı biz kuralım.")}
          ${yapilacak("3", "Harcamaları işleyin", "Kasa bakiyeniz kendiliğinden hesaplansın.")}
        </div>`
    }
  ];
}

/* ==========================================================================
   Tur motoru
   ========================================================================== */

/**
 * @param {object} p
 * @param {Function} [p.bitince]        tur bitince/atlanınca çağrılır
 * @param {Function} [p.parselEkle]     "İlk parselimi ekle" butonuna basılırsa
 * @param {boolean}  [p.isaretle=true]  bitince profilde tanitimGosterildi=true yapılsın mı
 */
export async function turBaslat({ bitince, parselEkle, isaretle = true } = {}) {
  if (aktifTur) return;

  // Tur panel ekranını anlatır — gerekiyorsa önce oraya git
  if ((location.hash || "#/panel") !== "#/panel") location.hash = "#/panel";

  const adimlar = adimlariUret();
  let i = 0;
  let cizimNo = 0;        // eş zamanlı çizimleri ayırt etmek için
  let emniyetZaman = null;

  const katman = document.createElement("div");
  katman.className = "tur-katman";
  katman.innerHTML = `
    <div class="tur-perde" data-perde="ust"></div>
    <div class="tur-perde" data-perde="alt"></div>
    <div class="tur-perde" data-perde="sol"></div>
    <div class="tur-perde" data-perde="sag"></div>
    <div class="tur-cerceve" id="tur-cerceve"></div>
    <div class="tur-balon" id="tur-balon" role="dialog" aria-modal="true"></div>`;
  document.body.appendChild(katman);

  const perdeler = {
    ust: katman.querySelector('[data-perde="ust"]'),
    alt: katman.querySelector('[data-perde="alt"]'),
    sol: katman.querySelector('[data-perde="sol"]'),
    sag: katman.querySelector('[data-perde="sag"]')
  };
  const cerceve = katman.querySelector("#tur-cerceve");
  const balon = katman.querySelector("#tur-balon");

  aktifTur = { kapat };

  // Sayfa CSS ile kilitlenmiyor — kilitlenirse programatik kaydırma da çalışmaz
  // ve ekranın altındaki hedefler spot ışığına alınamaz. Bunun yerine yalnızca
  // KULLANICI kaydırmasını (tekerlek/dokunma) engelliyoruz; turun kendi
  // animasyonlu kaydırması serbest kalıyor.
  let kendiKaydiriyor = false;
  const kullaniciKaydirmasiniEngelle = (e) => { if (!kendiKaydiriyor) e.preventDefault(); };
  katman.addEventListener("wheel", kullaniciKaydirmasiniEngelle, { passive: false });
  katman.addEventListener("touchmove", kullaniciKaydirmasiniEngelle, { passive: false });

  const yenidenKonumla = () => konumla();
  window.addEventListener("resize", yenidenKonumla);
  window.addEventListener("scroll", yenidenKonumla, { passive: true });
  document.addEventListener("keydown", tusDinle);

  // İlk adım merkez adımı olduğu için panel verisini beklemeden anında açılır
  ciz();

  /* ---------------- Çizim ---------------- */
  async function ciz() {
    const benimNo = ++cizimNo;
    const a = adimlar[i];

    balon.className = "tur-balon" + (a.genis ? " genis" : "");
    balon.innerHTML = govdeHTML(a);
    baglantilariKur();
    if (a.hazir) a.hazir(balon);

    // Merkez adımı: beklenecek bir şey yok, hemen yerleş
    if (!a.hedef) { konumla(); return; }

    // Panel hâlâ iskelet gösteriyor olabilir (#yeni-parsel-btn yalnızca veri
    // geldikten sonra basılır). Beklerken balon ortada görünür kalsın —
    // hiçbir koşulda ekranda "hiçlik" olmasın.
    const panelHazir = !!document.querySelector("#yeni-parsel-btn");
    konumla(!panelHazir);

    if (!panelHazir) {
      await elemanBekle("#yeni-parsel-btn", 8000);
      if (benimNo !== cizimNo) return;
    }
    await elemanBekle(a.hedef, 2000);
    if (benimNo !== cizimNo) return;

    // Kaydırma sırasında balonu gizle ki eski yerinden yenisine zıplamasın
    gizle();
    try {
      await hedefeKaydir(a);
    } finally {
      if (benimNo === cizimNo) goster();
    }
  }

  /** Balonu geçici olarak gizler; emniyet zamanlayıcısı her hâlükârda geri açar */
  function gizle() {
    balon.classList.add("hazirlaniyor");
    clearTimeout(emniyetZaman);
    emniyetZaman = setTimeout(goster, 1200);
  }

  function goster() {
    clearTimeout(emniyetZaman);
    konumla();
    balon.classList.remove("hazirlaniyor");
  }

  function govdeHTML(a) {
    return `
      <div class="tur-bas">
        <span class="tur-sayac">${i + 1} / ${adimlar.length}</span>
        <button class="tur-kapat" type="button" aria-label="Turu kapat">✕</button>
      </div>
      <h3>${esc(a.baslik)}</h3>
      <p>${esc(a.metin)}</p>
      ${a.icerikHTML || ""}
      <div class="tur-alt">
        <div class="tur-noktalar">
          ${adimlar.map((_, k) =>
            `<span class="${k === i ? "aktif" : k < i ? "gecti" : ""}"></span>`).join("")}
        </div>
        <span style="flex:1"></span>
        ${i > 0 ? `<button class="btn btn-kucuk" data-rol="geri" type="button">Geri</button>` : ""}
        ${a.son
          ? `<button class="btn btn-ana btn-kucuk" data-rol="bitir" type="button">
               ${ikon("tik", { boyut: 14 })} Turu Bitir</button>`
          : `<button class="btn btn-ana btn-kucuk" data-rol="ileri" type="button">
               İleri ${ikon("sagOk", { boyut: 14 })}</button>`}
      </div>
      ${a.son && parselEkle
        ? `<button class="btn btn-lacivert btn-blok" data-rol="parsel-ekle" type="button"
                   style="margin-top:10px">${ikon("arti", { boyut: 15 })} İlk Parselimi Ekle</button>`
        : ""}
      ${!a.son ? `<button class="tur-atla" data-rol="atla" type="button">Turu atla</button>` : ""}`;
  }

  function baglantilariKur() {
    balon.querySelector(".tur-kapat").onclick = () => bitirVeKapat();
    const btn = (rol) => balon.querySelector(`[data-rol="${rol}"]`);
    if (btn("geri")) btn("geri").onclick = () => git(-1);
    if (btn("ileri")) btn("ileri").onclick = () => git(1);
    if (btn("atla")) btn("atla").onclick = () => bitirVeKapat();
    if (btn("bitir")) btn("bitir").onclick = () => bitirVeKapat();
    if (btn("parsel-ekle")) btn("parsel-ekle").onclick = () => {
      bitirVeKapat();
      if (parselEkle) parselEkle();
    };
  }

  function git(yon) {
    const yeni = i + yon;
    if (yeni < 0 || yeni >= adimlar.length) return;
    i = yeni;
    ciz();
  }

  /* ---------------- Konumlandırma ---------------- */
  function hedefeKaydir(a) {
    const el = hedefEleman(a);
    if (!el) return Promise.resolve();

    const r = el.getBoundingClientRect();
    const pay = 24;
    // Zaten tamamen görünüyorsa kaydırma — gereksiz oynama olmasın
    if (r.top >= pay && r.bottom <= window.innerHeight - pay) return Promise.resolve();

    const hedefY = window.scrollY + r.top - Math.max(pay, (window.innerHeight - r.height) / 2);
    kendiKaydiriyor = true;
    return kaydir(Math.max(0, hedefY)).finally(() => { kendiKaydiriyor = false; });
  }

  function hedefEleman(a) {
    if (!a.hedef) return null;
    const el = document.querySelector(a.hedef);
    if (!el) return null;
    return a.hedefKart ? (el.closest(".kart") || el) : el;
  }

  function konumla(zorlaMerkez = false) {
    const a = adimlar[i];
    const el = zorlaMerkez ? null : hedefEleman(a);

    if (!el) {
      // Merkez adımı: delik yok, ekranın tamamı kararır
      perdeleriYerlestir(0, 0, window.innerWidth, 0);
      cerceve.style.opacity = "0";
      balon.classList.add("ortada");
      balon.style.top = "";
      balon.style.left = "";
      return;
    }

    balon.classList.remove("ortada");

    const G = window.innerWidth;
    const Y = window.innerHeight;
    const r = el.getBoundingClientRect();
    const bosluk = 8;

    // Deliği ekran sınırları içinde tut
    const x = Math.max(0, r.left - bosluk);
    const y = Math.max(0, r.top - bosluk);
    const w = Math.max(0, Math.min(G - x, r.width + bosluk * 2));
    const h = Math.max(0, Math.min(Y - y, r.height + bosluk * 2));

    perdeleriYerlestir(x, y, w, h);

    cerceve.style.opacity = "1";
    cerceve.style.left = `${x}px`;
    cerceve.style.top = `${y}px`;
    cerceve.style.width = `${w}px`;
    cerceve.style.height = `${h}px`;

    const bw = balon.offsetWidth;
    const bh = balon.offsetHeight;
    const pay = 16;

    let ust;
    if (r.bottom + bh + pay <= Y) {
      ust = r.bottom + pay;                          // altına sığıyor
    } else if (r.top - bh - pay >= 0) {
      ust = r.top - bh - pay;                        // üstüne sığıyor
    } else {
      // Hiçbirine sığmıyor (çok dar ekran): balonu, deliği en az kapatacak
      // tarafa yasla — delik üst yarıdaysa aşağı, alt yarıdaysa yukarı.
      ust = (r.top + r.height / 2) < Y / 2
        ? Math.max(pay, Y - bh - pay)
        : pay;
    }

    let sol = r.left + r.width / 2 - bw / 2;
    sol = Math.min(Math.max(pay, sol), G - bw - pay);

    balon.style.top = `${ust}px`;
    balon.style.left = `${sol}px`;
  }

  /** Dört perdeyi, ortada (x,y,w,h) boşluğu kalacak şekilde yerleştirir */
  function perdeleriYerlestir(x, y, w, h) {
    const G = window.innerWidth;
    const Y = window.innerHeight;
    kutu(perdeler.ust, 0, 0, G, y);
    kutu(perdeler.alt, 0, y + h, G, Y - (y + h));
    kutu(perdeler.sol, 0, y, x, h);
    kutu(perdeler.sag, x + w, y, G - (x + w), h);
  }

  function kutu(el, sol, ust, gen, yuk) {
    el.style.left = `${Math.max(0, sol)}px`;
    el.style.top = `${Math.max(0, ust)}px`;
    el.style.width = `${Math.max(0, gen)}px`;
    el.style.height = `${Math.max(0, yuk)}px`;
  }

  /* ---------------- Kapanış ---------------- */
  function tusDinle(e) {
    if (e.key === "Escape") { e.preventDefault(); bitirVeKapat(); }
    else if (e.key === "ArrowRight") git(1);
    else if (e.key === "ArrowLeft") git(-1);
  }

  async function bitirVeKapat() {
    kapat();
    if (isaretle) {
      try { await profilGuncelle({ tanitimGosterildi: true }); }
      catch (err) { console.warn("Tanıtım durumu kaydedilemedi:", err); }
    }
    if (bitince) bitince();
  }

  function kapat() {
    cizimNo++; // devam eden çizimleri iptal et
    clearTimeout(emniyetZaman);
    katman.removeEventListener("wheel", kullaniciKaydirmasiniEngelle);
    katman.removeEventListener("touchmove", kullaniciKaydirmasiniEngelle);
    window.removeEventListener("resize", yenidenKonumla);
    window.removeEventListener("scroll", yenidenKonumla);
    document.removeEventListener("keydown", tusDinle);
    katman.remove();
    aktifTur = null;
  }
}

/* ==========================================================================
   Yardımcılar
   ========================================================================== */
/**
 * Sayfayı hedef konuma yumuşakça kaydırır.
 *
 * Tarayıcının kendi `behavior:"smooth"` desteğine GÜVENMİYORUZ: bazı
 * tarayıcı/webview ve sistem ayarlarında bu çağrı sessizce hiçbir şey yapmaz,
 * o zaman spot ışığı ekran dışında kalır. Bunun yerine zamanlayıcıyla
 * kendimiz animasyon yapıyoruz — her yerde aynı şekilde çalışır.
 */
function kaydir(hedefY, sure = 280) {
  return new Promise((cozumle) => {
    const baslangic = window.scrollY;
    const fark = hedefY - baslangic;
    if (Math.abs(fark) < 2) return cozumle();

    const bas = Date.now();
    const zamanlayici = setInterval(() => {
      const t = Math.min(1, (Date.now() - bas) / sure);
      const e = 1 - Math.pow(1 - t, 3);              // easeOutCubic
      window.scrollTo(0, Math.round(baslangic + fark * e));
      if (t >= 1) {
        clearInterval(zamanlayici);
        cozumle();
      }
    }, 16);
  });
}

/**
 * Bir öğe DOM'a gelene kadar bekler. MutationObserver + zamanlayıcı kullanır;
 * en geç `sure` ms sonra kesinlikle çözülür (bulunduysa true, bulunmadıysa false).
 */
function elemanBekle(sec, sure = 3000) {
  if (document.querySelector(sec)) return Promise.resolve(true);

  return new Promise((cozumle) => {
    let bitti = false;

    const bit = (bulundu) => {
      if (bitti) return;
      bitti = true;
      clearInterval(zamanlayici);
      clearTimeout(emniyet);
      gozlemci.disconnect();
      cozumle(bulundu);
    };

    const bak = () => { if (document.querySelector(sec)) bit(true); };

    const gozlemci = new MutationObserver(bak);
    gozlemci.observe(document.documentElement, { childList: true, subtree: true });

    const zamanlayici = setInterval(bak, 60);      // gözlemci kaçırırsa yedek
    const emniyet = setTimeout(() => bit(false), sure);
  });
}

function ozetKutu(ikonAd, baslik, metin) {
  return `
    <div class="tur-ozet-kutu">
      <span class="rozet-ikon i-turkuaz">${ikon(ikonAd)}</span>
      <b>${esc(baslik)}</b>
      <small>${esc(metin)}</small>
    </div>`;
}

function akisKutu(no, baslik, metin) {
  return `
    <div class="tur-akis-kutu">
      <span class="yuvarlak">${no}</span>
      <b>${esc(baslik)}</b>
      <small>${esc(metin)}</small>
    </div>`;
}

function akisOk() {
  return `<span class="tur-akis-ok">${ikon("sagOk", { boyut: 16 })}</span>`;
}

function demoTaksit(no, tarih, tutar, durum) {
  const yazi = { odendi: "Ödendi", bekliyor: "Vadesi gelmedi", gecikmis: "Gecikmiş" }[durum];
  const kutu = durum === "odendi" ? "✓" : durum === "gecikmis" ? "!" : "";
  return `
    <button class="taksit ${durum}" type="button" data-eski="${durum}">
      <span class="no">${no}</span>
      <span class="orta">
        <span class="tarih">${esc(tarih)}</span>
        <span class="durum-yazi">${yazi}</span>
      </span>
      <span class="tutar">${fmtTLKisa(tutar)}</span>
      <span class="kutu">${kutu}</span>
    </button>`;
}

function renkSatir(renk, ad, anlam) {
  return `
    <div class="tur-renk">
      <span class="kutu" style="background:${renk}"></span>
      <b>${esc(ad)}</b>
      <small>${esc(anlam)}</small>
    </div>`;
}

function demoHarcama(tarih, sebep, firma, tutar) {
  return `
    <div class="tur-tablo-satir">
      <span class="tarih">${esc(tarih)}</span>
      <span class="ad"><span class="nokta"></span>${esc(sebep)}<small>${esc(firma)}</small></span>
      <span class="tutar">${fmtTLKisa(tutar)}</span>
    </div>`;
}

function yapilacak(no, baslik, metin) {
  return `
    <div class="tur-yapilacak">
      <span class="yuvarlak">${no}</span>
      <div><b>${esc(baslik)}</b><small>${esc(metin)}</small></div>
    </div>`;
}
