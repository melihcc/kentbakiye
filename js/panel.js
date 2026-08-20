// ==========================================================================
//  Ana ekran (Kontrol Paneli) — Bildirimler + Parsel listesi
// ==========================================================================
import {
  esc, ikon, fmtTLKisa, fmtTarih, fmtTarihUzun, toast, onay, bosDurum,
  gunFarki, bugun, firebaseHata
} from "./utils.js";
import {
  parselleriGetir, parselSil, tumMalikleriGetir, tumHarcamalariGetir,
  malikOzet, bildirimleriUret
} from "./veri.js";
import { parselFormAc } from "./parsel-form.js";
import { selamlama, ilkAd } from "./profil.js";

export async function panelCiz(kok) {
  kok.innerHTML = iskelet();

  let parseller, malikler, harcamalar;
  try {
    // Önce parseller: kimlikleri, alt koleksiyonların yedek okuma yolunda gerekiyor
    parseller = await parselleriGetir();
    const idler = parseller.map((p) => p.id);
    [malikler, harcamalar] = await Promise.all([
      tumMalikleriGetir(idler),
      tumHarcamalariGetir(idler)
    ]);
  } catch (err) {
    console.error(err);
    kok.innerHTML = veriHatasi(err);
    const btn = kok.querySelector("#tekrar-dene");
    if (btn) btn.onclick = () => panelCiz(kok);
    return;
  }

  /* --------- Genel toplamlar --------- */
  let genelTahsilat = 0, genelGecikmis = 0, genelBekleyen = 0, genelSozlesme = 0;
  malikler.forEach((m) => {
    const o = malikOzet(m);
    genelTahsilat += o.odenen;
    genelGecikmis += o.gecikmis;
    genelBekleyen += o.bekleyen;
    genelSozlesme += o.taksitToplam;
  });
  const genelHarcama = harcamalar.reduce((t, h) => t + (Number(h.tutar) || 0), 0);
  const bakiye = genelTahsilat - genelHarcama;
  const tahsilatOrani = genelSozlesme > 0 ? (genelTahsilat / genelSozlesme) * 100 : 0;

  /* --------- Parsel bazlı toplamlar --------- */
  const ozetler = {};
  parseller.forEach((p) => {
    ozetler[p.id] = { tahsilat: 0, harcama: 0, malikSayisi: 0, gecikmis: 0, sozlesme: 0 };
  });
  malikler.forEach((m) => {
    const o = ozetler[m.parselId];
    if (!o) return;
    const ozet = malikOzet(m);
    o.tahsilat += ozet.odenen;
    o.gecikmis += ozet.gecikmis;
    o.sozlesme += ozet.taksitToplam;
    o.malikSayisi++;
  });
  harcamalar.forEach((h) => {
    const o = ozetler[h.parselId];
    if (o) o.harcama += Number(h.tutar) || 0;
  });

  const bildirimler = bildirimleriUret(malikler, 30);
  const gecikmisAdet = bildirimler.filter((b) => b.tip === "gecikmis").length;

  /* --------- Çiz --------- */
  kok.innerHTML = `
    <div class="sayfa-baslik">
      <div>
        <div class="ust-etiket">Kontrol Paneli</div>
        <h1 class="selam"><span class="el">👋</span> ${esc(selamlama())}, ${esc(ilkAd())}</h1>
        <p>${esc(fmtTarihUzun(bugun()))} · Tüm projelerinizin güncel mali durumu</p>
      </div>
      <div class="bosluk"></div>
      <div class="islemler">
        <button class="btn btn-ana" id="yeni-parsel-btn">
          ${ikon("arti")} Yeni Parsel
        </button>
      </div>
    </div>

    <div class="stat-grid">
      ${statKutu("bloklar", "i-lacivert", "Aktif Parsel", String(parseller.length), "d-lacivert",
                 `${malikler.length} malik kaydı`)}
      ${statKutu("yukselen", "i-yesil", "Toplam Tahsilat", fmtTLKisa(genelTahsilat), "d-yesil",
                 `Sözleşmelerin %${tahsilatOrani.toFixed(0)}'i`)}
      ${statKutu("dusen", "i-kirmizi", "Toplam Harcama", fmtTLKisa(genelHarcama), "d-kirmizi",
                 `${harcamalar.length} harcama kaydı`)}
      ${statKutu("cuzdan", bakiye >= 0 ? "i-mor" : "i-kirmizi", "Kasa Bakiyesi",
                 fmtTLKisa(bakiye), bakiye >= 0 ? "d-mor" : "d-kirmizi",
                 "Tahsilat − harcama")}
      ${statKutu("uyari", "i-kirmizi", "Gecikmiş Alacak", fmtTLKisa(genelGecikmis), "d-kirmizi",
                 `${gecikmisAdet} vade gecikmede`)}
      ${statKutu("saat", "i-sari", "Kalan Alacak", fmtTLKisa(genelGecikmis + genelBekleyen), "d-sari",
                 "Tahsil edilmemiş toplam")}
    </div>

    <div class="kart" style="margin-bottom:22px">
      <div class="kart-bas">
        <h2>${ikon("zil")} Bildirimler</h2>
        ${bildirimler.length ? `<span class="sayac-rozet">${bildirimler.length}</span>` : ""}
        <span class="bosluk"></span>
        <span class="not">Gecikmiş ve 30 gün içinde vadesi gelen ödemeler</span>
      </div>
      <div class="bildirim-liste" id="bildirim-liste"></div>
    </div>

    <div class="kart">
      <div class="kart-bas">
        <h2>${ikon("bloklar")} Parseller</h2>
        <span class="sayac-rozet">${parseller.length}</span>
        <span class="bosluk"></span>
        <button class="btn btn-kucuk" id="yeni-parsel-btn-2">${ikon("arti")} Parsel Ekle</button>
      </div>
      <div class="kart-govde" id="parsel-alan"></div>
    </div>`;

  bildirimleriCiz();
  parselleriCiz();

  kok.querySelector("#yeni-parsel-btn").onclick = yeniParsel;
  kok.querySelector("#yeni-parsel-btn-2").onclick = yeniParsel;

  function yeniParsel() {
    parselFormAc({ bitince: () => panelCiz(kok) });
  }

  /* ---------------- Bildirimler ---------------- */
  function bildirimleriCiz() {
    const alan = kok.querySelector("#bildirim-liste");

    if (!bildirimler.length) {
      alan.innerHTML = `
        <div style="padding:34px 20px;text-align:center">
          <div style="display:inline-flex;align-items:center;gap:10px;
                      background:var(--yesil-bg);color:var(--yesil);border:1px solid var(--yesil-kenar);
                      padding:11px 17px;border-radius:999px;font-size:13.5px;font-weight:700">
            ${ikon("tik", { boyut: 16 })} Gecikmiş veya yaklaşan ödeme yok
          </div>
        </div>`;
      return;
    }

    alan.innerHTML = bildirimler.slice(0, 40).map((b) => {
      const gecikmis = b.tip === "gecikmis";
      const gun = gecikmis ? gunFarki(b.tarih, bugun()) : b.gunKaldi;
      const gunYazi = gecikmis
        ? `${gun} gün gecikti`
        : gun === 0 ? "Bugün" : `${gun} gün kaldı`;
      const taksitAdi = b.taksit.tip === "pesinat" ? "Peşinat" : `${b.taksit.no}. taksit`;

      return `
        <button class="bildirim ${b.tip}" type="button" data-parsel="${esc(b.malik.parselId || "")}">
          <span class="isaret">${ikon(gecikmis ? "uyari" : "saat", { boyut: 15 })}</span>
          <span class="metin">
            <b>${esc(b.malik.adSoyad || "Malik")}</b>
            <small>${esc(b.malik.parselAdi || "Parsel")} · ${esc(taksitAdi)} · Vade ${fmtTarih(b.tarih)}</small>
          </span>
          <span class="sag-blok">
            <span class="tutar">${fmtTLKisa(b.taksit.tutar)}</span>
            <span class="gun">${esc(gunYazi)}</span>
          </span>
        </button>`;
    }).join("") + (bildirimler.length > 40
      ? `<div style="padding:12px 20px;font-size:12.5px;color:var(--metin-soluk);font-weight:600">
           …ve ${bildirimler.length - 40} bildirim daha</div>`
      : "");

    alan.querySelectorAll(".bildirim").forEach((el) => {
      el.onclick = () => {
        const pid = el.dataset.parsel;
        if (pid) location.hash = `#/parsel/${pid}`;
      };
    });
  }

  /* ---------------- Parsel kartları ---------------- */
  function parselleriCiz() {
    const alan = kok.querySelector("#parsel-alan");

    if (!parseller.length) {
      alan.innerHTML = bosDurum({
        ikonAd: "bloklar",
        baslik: "Henüz parsel eklenmemiş",
        aciklama: "İlk kentsel dönüşüm parselinizi ekleyerek başlayın. " +
                  "Her parsel kendi malik ödemelerini ve harcamalarını taşır.",
        butonHTML: `<button class="btn btn-ana btn-buyuk" id="bos-parsel-btn">
                      ${ikon("arti")} İlk Parseli Ekle</button>`
      });
      alan.querySelector("#bos-parsel-btn").onclick = yeniParsel;
      return;
    }

    alan.innerHTML = `<div class="parsel-grid">${parseller.map((p) => {
      const o = ozetler[p.id];
      const konum = [p.mahalle, p.ilce, p.il].filter(Boolean).join(" / ") || "Konum belirtilmemiş";
      const oran = o.sozlesme > 0 ? (o.tahsilat / o.sozlesme) * 100 : 0;
      const bakiyeP = o.tahsilat - o.harcama;

      return `
        <article class="parsel-kart" data-id="${esc(p.id)}">
          <div class="ust" data-rol="ac">
            <div class="etiket-satir">
              ${(p.ada || p.parselNo)
                ? `<span class="rozet ada">Ada ${esc(p.ada || "—")} / Parsel ${esc(p.parselNo || "—")}</span>`
                : ""}
              <span class="rozet turkuaz">${esc(p.durum || "Belirtilmemiş")}</span>
              ${o.gecikmis > 0
                ? `<span class="rozet kirmizi">${ikon("uyari", { boyut: 11 })} ${fmtTLKisa(o.gecikmis)}</span>`
                : ""}
            </div>
            <h3>${esc(p.ad)}</h3>
            <p class="konum">${ikon("konum")} ${esc(konum)}</p>
          </div>

          <div class="oran" data-rol="ac">
            <div class="satir">
              <span>Tahsilat oranı</span>
              <span style="color:var(--metin)">%${oran.toFixed(0)}</span>
            </div>
            <div class="ilerleme ince"><i style="width:${Math.min(100, oran).toFixed(1)}%"></i></div>
          </div>

          <div class="alt" data-rol="ac">
            <div>
              <div class="e">Malik</div>
              <div class="d">${o.malikSayisi}</div>
            </div>
            <div>
              <div class="e">Tahsilat</div>
              <div class="d d-yesil">${fmtTLKisa(o.tahsilat)}</div>
            </div>
            <div>
              <div class="e">Bakiye</div>
              <div class="d ${bakiyeP >= 0 ? "d-mor" : "d-kirmizi"}">${fmtTLKisa(bakiyeP)}</div>
            </div>
          </div>

          <div class="islem">
            <button class="btn btn-kucuk btn-lacivert" data-rol="ac">
              Detayı Aç ${ikon("sagOk", { boyut: 14 })}
            </button>
            <span style="flex:1"></span>
            <button class="btn btn-ikon btn-sessiz" data-rol="duzenle" title="Parseli düzenle"
                    aria-label="Parseli düzenle">${ikon("kalem")}</button>
            <button class="btn btn-ikon btn-hayalet-tehlike" data-rol="sil" title="Parseli sil"
                    aria-label="Parseli sil">${ikon("cop")}</button>
          </div>
        </article>`;
    }).join("")}</div>`;

    alan.querySelectorAll(".parsel-kart").forEach((kart) => {
      const id = kart.dataset.id;
      const parsel = parseller.find((x) => x.id === id);

      kart.querySelectorAll('[data-rol="ac"]').forEach((el) => {
        el.onclick = (e) => { e.stopPropagation(); location.hash = `#/parsel/${id}`; };
      });

      kart.querySelector('[data-rol="duzenle"]').onclick = (e) => {
        e.stopPropagation();
        parselFormAc({ parsel, bitince: () => panelCiz(kok) });
      };

      kart.querySelector('[data-rol="sil"]').onclick = async (e) => {
        e.stopPropagation();
        const ok = await onay(
          `"${parsel.ad}" parseli; tüm malikleri, ödeme planları ve harcamalarıyla birlikte ` +
          `kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
          { baslik: "Parseli sil", onayMetni: "Evet, kalıcı olarak sil" }
        );
        if (!ok) return;
        try {
          await parselSil(id);
          toast("Parsel silindi", "basarili");
          panelCiz(kok);
        } catch (err) {
          console.error(err);
          toast(firebaseHata(err), "hata");
        }
      };
    });
  }
}

/* ---------------- Parçalar ---------------- */

/** Veri okunamadığında gösterilen, ne yapılacağını anlatan ekran */
function veriHatasi(err) {
  const yetkiSorunu = err && err.code === "permission-denied";
  return `
    <div class="kart" style="max-width:720px;margin:0 auto">
      <div class="kart-bas"><h2>${ikon("uyari")} Veriler yüklenemedi</h2></div>
      <div class="kart-govde">
        <div class="uyari" style="margin-top:0">
          ${ikon("uyari")}<span>${esc(firebaseHata(err))}</span>
        </div>

        ${yetkiSorunu ? `
          <p style="font-size:14px;color:var(--metin-orta);margin-top:16px;line-height:1.65">
            Bu hata neredeyse her zaman <b>Firestore güvenlik kurallarının henüz
            yayınlanmamış olmasından</b> kaynaklanır. Şu adımları izleyin:
          </p>
          <ol style="font-size:13.5px;color:var(--metin-orta);line-height:1.8;
                     margin:12px 0 0;padding-left:22px">
            <li>Firebase Console → <b>Firestore Database</b> → <b>Rules</b> sekmesi</li>
            <li>Projedeki <b>firestore.rules</b> dosyasının tamamını yapıştırın</li>
            <li><b>Publish</b> deyin ve bu sayfayı yenileyin</li>
          </ol>
          <div class="uyari bilgi">
            ${ikon("bilgi")}
            <span>Kurallarda <b>malikler</b> ve <b>harcamalar</b> için
            joker yollu (<code>/{yol=**}/malikler/{id}</code>) satırların bulunması şarttır;
            iç içe yazılmış kurallar panelin toplu sorgusunu yetkilendirmez.</span>
          </div>
        ` : `
          <p style="font-size:13.5px;color:var(--metin-soluk);margin-top:14px">
            Firebase ayarlarınızı (js/config.js) ve internet bağlantınızı kontrol edin.
          </p>
        `}

        <button class="btn btn-ana" id="tekrar-dene" style="margin-top:18px">
          Tekrar Dene
        </button>
      </div>
    </div>`;
}

function statKutu(ikonAd, ikonSinif, etiket, deger, degerSinif, altbilgi) {
  return `
    <div class="stat">
      <div class="bas">
        <span class="rozet-ikon ${ikonSinif}">${ikon(ikonAd)}</span>
        <span class="etiket">${esc(etiket)}</span>
      </div>
      <div class="deger ${degerSinif}">${deger}</div>
      <div class="altbilgi">${esc(altbilgi)}</div>
    </div>`;
}

function iskelet() {
  return `
    <div class="sayfa-baslik">
      <div>
        <div class="iskelet" style="width:110px;height:13px;margin-bottom:9px"></div>
        <div class="iskelet" style="width:210px;height:27px"></div>
      </div>
    </div>
    <div class="stat-grid">
      ${Array.from({ length: 6 }, () => `<div class="iskelet iskelet-stat"></div>`).join("")}
    </div>
    <div class="iskelet" style="height:200px;border-radius:16px;margin-bottom:22px"></div>
    <div class="iskelet-grid">
      ${Array.from({ length: 3 }, () => `<div class="iskelet iskelet-kart"></div>`).join("")}
    </div>`;
}
