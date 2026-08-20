// ==========================================================================
//  Parsel detay sayfası
//    ÜST : Bize yapılacak ödemeler (her malik ayrı pencere/kart)
//    ALT : Bu parsel için yaptığımız harcamalar
//    SAĞ : Özet + halka grafik
// ==========================================================================
import {
  esc, ikon, fmtTL, fmtTLKisa, fmtTarih, toast, onay, bosDurum, basHarfler,
  halkaGrafik, taksitDurumu, DURUM_ETIKET, DURUM_RENK, firebaseHata
} from "./utils.js";
import {
  parselGetir, malikleriGetir, harcamalariGetir, malikSil, harcamaSil,
  taksitDurumDegistir, malikOzet, parselOzet
} from "./veri.js";
import { malikFormAc } from "./malik-form.js";
import { harcamaFormAc } from "./harcama-form.js";
import { parselFormAc } from "./parsel-form.js";

export async function parselDetayCiz(kok, parselId) {
  kok.innerHTML = `
    <div class="iskelet" style="width:150px;height:14px;margin-bottom:18px"></div>
    <div class="iskelet" style="width:280px;height:30px;margin-bottom:26px"></div>
    <div class="iskelet" style="height:420px;border-radius:16px"></div>`;

  let parsel, malikler, harcamalar;
  try {
    parsel = await parselGetir(parselId);
    if (!parsel) {
      kok.innerHTML = `<div class="kart">${bosDurum({
        ikonAd: "uyari",
        baslik: "Parsel bulunamadı",
        aciklama: "Bu parsel silinmiş veya adres hatalı olabilir.",
        butonHTML: `<button class="btn btn-ana" id="panele-don">← Panele dön</button>`
      })}</div>`;
      kok.querySelector("#panele-don").onclick = () => (location.hash = "#/panel");
      return;
    }
    [malikler, harcamalar] = await Promise.all([
      malikleriGetir(parselId),
      harcamalariGetir(parselId)
    ]);
  } catch (err) {
    console.error(err);
    kok.innerHTML = `<div class="kart"><div class="kart-govde">
      <div class="uyari" style="margin-top:0">${ikon("uyari")}
        <span>Parsel yüklenemedi: ${esc(firebaseHata(err))}</span></div>
    </div></div>`;
    return;
  }

  const konum = [parsel.mahalle, parsel.ilce, parsel.il].filter(Boolean).join(" / ");

  kok.innerHTML = `
    <button class="geri-link" id="geri-btn">${ikon("solOk")} Panele dön</button>

    <div class="sayfa-baslik">
      <div style="min-width:0">
        <div class="etiket-satir" style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px">
          ${(parsel.ada || parsel.parselNo)
            ? `<span class="rozet ada">Ada ${esc(parsel.ada || "—")} / Parsel ${esc(parsel.parselNo || "—")}</span>`
            : ""}
          <span class="rozet turkuaz">${esc(parsel.durum || "Belirtilmemiş")}</span>
        </div>
        <h1>${esc(parsel.ad)}</h1>
        <p style="display:flex;align-items:center;gap:6px">
          ${ikon("konum", { boyut: 14 })} ${esc(konum || "Konum belirtilmemiş")}
          ${parsel.adres ? ` · ${esc(parsel.adres)}` : ""}
        </p>
      </div>
      <div class="bosluk"></div>
      <div class="islemler">
        <button class="btn" id="parsel-duzenle">${ikon("kalem")} Parseli Düzenle</button>
      </div>
    </div>

    <div class="detay-duzen">
      <div class="detay-sol">

        <!-- ===== ÜST BÖLÜM : ÖDEMELER ===== -->
        <section class="kart">
          <div class="kart-bas">
            <span class="bolum-etiket gelir">${ikon("yukariOk")} Gelir</span>
            <h2>Bize Yapılacak Ödemeler</h2>
            <span class="sayac-rozet">${malikler.length}</span>
            <span class="bosluk"></span>
            <button class="btn btn-ana btn-kucuk" id="malik-ekle">${ikon("arti")} Malik Ekle</button>
          </div>
          <div class="kart-govde" id="malik-alan"></div>
        </section>

        <!-- ===== ALT BÖLÜM : HARCAMALAR ===== -->
        <section class="kart">
          <div class="kart-bas">
            <span class="bolum-etiket gider">${ikon("asagiOk")} Gider</span>
            <h2>Bu Parsel İçin Harcamalarımız</h2>
            <span class="sayac-rozet">${harcamalar.length}</span>
            <span class="bosluk"></span>
            <button class="btn btn-kucuk" id="harcama-ekle">${ikon("arti")} Harcama Ekle</button>
          </div>
          <div id="harcama-alan"></div>
        </section>

      </div>

      <!-- ===== SAĞ : ÖZET + GRAFİK ===== -->
      <aside class="detay-sag">
        <div class="kart">
          <div class="kart-bas"><h2>${ikon("grafik")} Parsel Özeti</h2></div>
          <div class="kart-govde" id="grafik-alan"></div>
        </div>

        <div class="kart">
          <div class="kart-bas"><h2>${ikon("cuzdan")} Alacak Durumu</h2></div>
          <div class="kart-govde" style="display:flex;flex-direction:column;gap:12px" id="alacak-alan"></div>
        </div>
      </aside>
    </div>`;

  kok.querySelector("#geri-btn").onclick = () => (location.hash = "#/panel");
  kok.querySelector("#parsel-duzenle").onclick = () =>
    parselFormAc({ parsel, bitince: yenile });
  kok.querySelector("#malik-ekle").onclick = () =>
    malikFormAc({ parselId, parselAdi: parsel.ad, bitince: yenile });
  kok.querySelector("#harcama-ekle").onclick = () =>
    harcamaFormAc({ parselId, bitince: yenile });

  function yenile() { parselDetayCiz(kok, parselId); }

  malikleriCiz();
  harcamalariCiz();
  sagPanelCiz();

  /* ============================================================
     ÜST BÖLÜM — Malik pencereleri
     ============================================================ */
  function malikleriCiz() {
    const alan = kok.querySelector("#malik-alan");

    if (!malikler.length) {
      alan.innerHTML = bosDurum({
        ikonAd: "kisiler",
        baslik: "Henüz malik eklenmemiş",
        aciklama: "Malik ekleyip toplam tutar, peşinat ve vade bilgisinden " +
                  "otomatik ödeme planı oluşturun.",
        butonHTML: `<button class="btn btn-ana btn-buyuk" id="bos-malik-btn">
                      ${ikon("arti")} İlk Maliki Ekle</button>`
      });
      alan.querySelector("#bos-malik-btn").onclick = () =>
        malikFormAc({ parselId, parselAdi: parsel.ad, bitince: yenile });
      return;
    }

    alan.innerHTML = `<div class="malik-grid">${malikler.map((m) => {
      const o = malikOzet(m);
      const bilgi = [
        m.bagimsizBolum ? `Bağ. Böl. ${m.bagimsizBolum}` : "",
        m.hisse ? `Hisse ${m.hisse}` : "",
        m.telefon || ""
      ].filter(Boolean);

      const taksitHTML = (m.taksitler || []).map((t, i) => {
        const d = taksitDurumu(t);
        const solEtiket = t.tip === "pesinat"
          ? `<span class="pesin-etiket">PEŞİN</span>`
          : `<span class="no">${t.no}</span>`;
        const kutuIc = d === "odendi" ? "✓" : d === "gecikmis" ? "!" : "";
        return `
          <button class="taksit ${d}" type="button" data-malik="${esc(m.id)}" data-i="${i}"
                  title="${esc(DURUM_ETIKET[d])} — tıklayarak durumu değiştirin">
            ${solEtiket}
            <span class="orta">
              <span class="tarih">${fmtTarih(t.tarih)}</span>
              <span class="durum-yazi">${esc(DURUM_ETIKET[d])}</span>
            </span>
            <span class="tutar">${fmtTLKisa(t.tutar)}</span>
            <span class="kutu">${kutuIc}</span>
          </button>`;
      }).join("") || `
        <div style="padding:20px;text-align:center;color:var(--metin-soluk);font-size:13px;font-weight:600">
          Ödeme planı yok
        </div>`;

      return `
        <article class="malik-kart ${o.gecikmisAdet > 0 ? "uyari-var" : ""}" data-malik="${esc(m.id)}">
          <div class="m-bas">
            <div class="ust-satir">
              <span class="m-avatar">${esc(basHarfler(m.adSoyad))}</span>
              <div style="flex:1;min-width:0">
                <div class="ad">${esc(m.adSoyad || "İsimsiz Malik")}</div>
                ${bilgi.length
                  ? `<div class="bilgi">${bilgi.map((b) => `<span>${esc(b)}</span>`).join("")}</div>`
                  : ""}
              </div>
              ${o.gecikmisAdet > 0
                ? `<span class="rozet kirmizi">${o.gecikmisAdet} gecikmiş</span>` : ""}
            </div>

            <div class="m-ilerleme">
              <div class="satir">
                <span>${o.odenenAdet}/${o.adet} vade tahsil edildi</span>
                <b>%${o.yuzde.toFixed(0)}</b>
              </div>
              <div class="ilerleme"><i style="width:${o.yuzde.toFixed(1)}%"></i></div>
            </div>
          </div>

          <div class="m-ozet">
            <div><div class="e">Sözleşme</div><div class="d">${fmtTLKisa(o.taksitToplam)}</div></div>
            <div><div class="e">Tahsil Edilen</div><div class="d d-yesil">${fmtTLKisa(o.odenen)}</div></div>
            <div><div class="e">Kalan</div>
              <div class="d ${o.gecikmis > 0 ? "d-kirmizi" : "d-sari"}">${fmtTLKisa(o.kalan)}</div></div>
          </div>

          <div class="m-taksitler">${taksitHTML}</div>

          <div class="m-islem">
            <button class="btn btn-kucuk" data-rol="m-duzenle">${ikon("kalem")} Planı Düzenle</button>
            <span style="flex:1"></span>
            <button class="btn btn-ikon btn-hayalet-tehlike" data-rol="m-sil"
                    title="Maliki sil" aria-label="Maliki sil">${ikon("cop")}</button>
          </div>
        </article>`;
    }).join("")}</div>`;

    /* Taksite tıklama → ödendi / ödenmedi */
    alan.querySelectorAll(".taksit").forEach((el) => {
      el.onclick = async () => {
        const m = malikler.find((x) => x.id === el.dataset.malik);
        const i = Number(el.dataset.i);
        if (!m) return;

        el.style.opacity = "0.55";
        el.style.pointerEvents = "none";
        try {
          const yeni = await taksitDurumDegistir(parselId, m, i);
          m.taksitler = yeni;
          malikleriCiz();
          sagPanelCiz();
          toast(
            yeni[i].odendi ? "Ödeme tahsil edildi olarak işaretlendi" : "Ödeme işareti kaldırıldı",
            yeni[i].odendi ? "basarili" : "bilgi",
            1900
          );
        } catch (err) {
          console.error(err);
          toast(firebaseHata(err), "hata");
          el.style.opacity = "";
          el.style.pointerEvents = "";
        }
      };
    });

    /* Malik düzenle / sil */
    alan.querySelectorAll(".malik-kart").forEach((kart) => {
      const m = malikler.find((x) => x.id === kart.dataset.malik);

      kart.querySelector('[data-rol="m-duzenle"]').onclick = () =>
        malikFormAc({ parselId, parselAdi: parsel.ad, malik: m, bitince: yenile });

      kart.querySelector('[data-rol="m-sil"]').onclick = async () => {
        const ok = await onay(
          `"${m.adSoyad}" adlı malik ve tüm ödeme planı silinecek. Bu işlem geri alınamaz.`,
          { baslik: "Maliki sil", onayMetni: "Evet, sil" }
        );
        if (!ok) return;
        try {
          await malikSil(parselId, m.id);
          toast("Malik silindi", "basarili");
          yenile();
        } catch (err) {
          console.error(err);
          toast(firebaseHata(err), "hata");
        }
      };
    });
  }

  /* ============================================================
     ALT BÖLÜM — Harcamalar
     ============================================================ */
  function harcamalariCiz() {
    const alan = kok.querySelector("#harcama-alan");

    if (!harcamalar.length) {
      alan.innerHTML = bosDurum({
        ikonAd: "fis",
        baslik: "Bu parsel için harcama girilmemiş",
        aciklama: "Yıkımdan iskâna kadar tüm giderleri buraya işleyin; " +
                  "sağdaki grafik ve kasa bakiyesi otomatik güncellenir.",
        butonHTML: `<button class="btn btn-ana btn-buyuk" id="bos-harcama-btn">
                      ${ikon("arti")} İlk Harcamayı Ekle</button>`
      });
      alan.querySelector("#bos-harcama-btn").onclick = () =>
        harcamaFormAc({ parselId, bitince: yenile });
      return;
    }

    const toplam = harcamalar.reduce((t, h) => t + (Number(h.tutar) || 0), 0);

    alan.innerHTML = `
      <div class="tablo-sar">
        <table class="tablo">
          <thead>
            <tr>
              <th style="width:112px">Tarih</th>
              <th>Harcama Sebebi</th>
              <th style="width:170px">Firma / Kişi</th>
              <th style="width:140px">Belge No</th>
              <th class="sag" style="width:150px">Tutar</th>
              <th style="width:92px"></th>
            </tr>
          </thead>
          <tbody>
            ${harcamalar.map((h) => `
              <tr data-id="${esc(h.id)}">
                <td style="white-space:nowrap;font-weight:600">${fmtTarih(h.tarih)}</td>
                <td>
                  <div class="harcama-sebep"><span class="nokta"></span>${esc(h.sebep)}</div>
                  ${h.aciklama ? `<div class="harcama-aciklama">${esc(h.aciklama)}</div>` : ""}
                </td>
                <td style="color:var(--metin-orta)">${esc(h.firma || "—")}</td>
                <td style="color:var(--metin-soluk);font-size:13px">${esc(h.belgeNo || "—")}</td>
                <td class="sag d-kirmizi" style="font-weight:800;white-space:nowrap">${fmtTL(h.tutar)}</td>
                <td>
                  <div class="satir-islem">
                    <button class="btn btn-ikon btn-sessiz" data-rol="h-duzenle"
                            title="Düzenle" aria-label="Düzenle">${ikon("kalem")}</button>
                    <button class="btn btn-ikon btn-hayalet-tehlike" data-rol="h-sil"
                            title="Sil" aria-label="Sil">${ikon("cop")}</button>
                  </div>
                </td>
              </tr>`).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-transform:uppercase;letter-spacing:.06em;font-size:11.5px;
                                     color:var(--metin-soluk)">Toplam Harcama</td>
              <td class="sag d-kirmizi" style="font-size:16px;letter-spacing:-.03em">${fmtTL(toplam)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>`;

    alan.querySelectorAll("tbody tr").forEach((tr) => {
      const h = harcamalar.find((x) => x.id === tr.dataset.id);
      tr.querySelector('[data-rol="h-duzenle"]').onclick = () =>
        harcamaFormAc({ parselId, harcama: h, bitince: yenile });
      tr.querySelector('[data-rol="h-sil"]').onclick = async () => {
        const ok = await onay(
          `"${h.sebep}" harcaması (${fmtTL(h.tutar)}) silinecek.`,
          { baslik: "Harcamayı sil", onayMetni: "Evet, sil" }
        );
        if (!ok) return;
        try {
          await harcamaSil(parselId, h.id);
          toast("Harcama silindi", "basarili");
          yenile();
        } catch (err) {
          console.error(err);
          toast(firebaseHata(err), "hata");
        }
      };
    });
  }

  /* ============================================================
     SAĞ PANEL — Özet + halka grafik
     ============================================================ */
  function sagPanelCiz() {
    const g = parselOzet(malikler, harcamalar);
    const oran = g.sozlesmeToplam > 0 ? (g.tahsilEdilen / g.sozlesmeToplam) * 100 : 0;

    kok.querySelector("#grafik-alan").innerHTML = `
      ${halkaGrafik(
        [
          { ad: "Gelen Para (Tahsilat)", deger: g.tahsilEdilen, renk: "var(--yesil-500)" },
          { ad: "Harcanan Para", deger: g.harcanan, renk: "var(--kirmizi-500)" }
        ],
        {
          ortaUst: "Kasa Bakiyesi",
          ortaAlt: fmtTLKisa(g.bakiye),
          ortaRenk: g.bakiye >= 0 ? "var(--mor)" : "var(--kirmizi)"
        }
      )}

      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--kenar);
                  display:flex;flex-direction:column;gap:11px">
        <div class="ozet-satir">
          <span class="e">Toplam Gelen</span><span class="d d-yesil">${fmtTL(g.tahsilEdilen)}</span>
        </div>
        <div class="ozet-satir">
          <span class="e">Toplam Harcanan</span><span class="d d-kirmizi">${fmtTL(g.harcanan)}</span>
        </div>
        <div class="ozet-ayrac"></div>
        <div class="ozet-satir vurgu">
          <span class="e">Kasa Bakiyesi</span>
          <span class="d ${g.bakiye >= 0 ? "d-mor" : "d-kirmizi"}">${fmtTL(g.bakiye)}</span>
        </div>
      </div>`;

    kok.querySelector("#alacak-alan").innerHTML = `
      <div class="ozet-satir">
        <span class="e">Sözleşme Toplamı</span><span class="d">${fmtTL(g.sozlesmeToplam)}</span>
      </div>
      <div class="ozet-satir">
        <span class="e">${nokta(DURUM_RENK.odendi)} Tahsil Edilen</span>
        <span class="d d-yesil">${fmtTL(g.tahsilEdilen)}</span>
      </div>
      <div class="ozet-satir">
        <span class="e">${nokta(DURUM_RENK.bekliyor)} Vadesi Gelmemiş</span>
        <span class="d d-sari">${fmtTL(g.bekleyen)}</span>
      </div>
      <div class="ozet-satir">
        <span class="e">${nokta(DURUM_RENK.gecikmis)} Gecikmiş Alacak</span>
        <span class="d d-kirmizi">${fmtTL(g.gecikmis)}</span>
      </div>
      <div class="ozet-ayrac"></div>
      <div class="ozet-satir vurgu">
        <span class="e">Kalan Alacak</span><span class="d">${fmtTL(g.kalanAlacak)}</span>
      </div>

      <div style="margin-top:8px">
        <div class="ilerleme"><i style="width:${Math.min(100, oran).toFixed(1)}%"></i></div>
        <div style="font-size:12.5px;color:var(--metin-soluk);margin-top:8px;
                    text-align:center;font-weight:700">
          Tahsilat oranı: %${oran.toFixed(1)}
        </div>
      </div>`;

    function nokta(renk) {
      return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;
                           background:${renk};margin-right:7px"></span>`;
    }
  }
}
