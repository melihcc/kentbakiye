// ==========================================================================
//  Parsel ekleme / düzenleme formu
// ==========================================================================
import { esc, ikon, toast, modalAc, butonMesgul, firebaseHata, bugun } from "./utils.js";
import { parselEkle, parselGuncelle } from "./veri.js";

const DURUMLAR = [
  "Sözleşme Aşaması",
  "Proje / Ruhsat",
  "Yıkım",
  "İnşaat Devam Ediyor",
  "İnce İşler",
  "İskân Aşaması",
  "Tamamlandı",
  "Beklemede"
];

export function parselFormAc({ parsel = null, bitince }) {
  const duzenleme = !!parsel;
  const p = parsel || {};

  const m = modalAc({
    baslik: duzenleme ? "Parseli Düzenle" : "Yeni Parsel Ekle",
    icerikHTML: `
      <form id="parsel-form" novalidate>
        <div class="form-bolum-basligi">Proje Bilgisi</div>

        <div class="alan">
          <label for="p-ad">Proje / Parsel Adı *</label>
          <input id="p-ad" type="text" value="${esc(p.ad || "")}"
                 placeholder="Örn: Yıldız Konakları" required>
        </div>

        <div class="ikili">
          <div class="alan">
            <label for="p-ada">Ada No</label>
            <input id="p-ada" type="text" value="${esc(p.ada || "")}" placeholder="1234">
          </div>
          <div class="alan">
            <label for="p-parsel">Parsel No</label>
            <input id="p-parsel" type="text" value="${esc(p.parselNo || "")}" placeholder="7">
          </div>
        </div>

        <hr class="form-ayrac">
        <div class="form-bolum-basligi">Konum</div>

        <div class="uclu">
          <div class="alan">
            <label for="p-il">İl</label>
            <input id="p-il" type="text" value="${esc(p.il || "")}" placeholder="İstanbul">
          </div>
          <div class="alan">
            <label for="p-ilce">İlçe</label>
            <input id="p-ilce" type="text" value="${esc(p.ilce || "")}" placeholder="Kadıköy">
          </div>
          <div class="alan">
            <label for="p-mahalle">Mahalle</label>
            <input id="p-mahalle" type="text" value="${esc(p.mahalle || "")}" placeholder="Caferağa">
          </div>
        </div>

        <div class="alan">
          <label for="p-adres">Açık Adres</label>
          <input id="p-adres" type="text" value="${esc(p.adres || "")}" placeholder="Sokak, No…">
        </div>

        <hr class="form-ayrac">
        <div class="form-bolum-basligi">Durum</div>

        <div class="ikili">
          <div class="alan">
            <label for="p-durum">Proje Durumu</label>
            <select id="p-durum">
              ${DURUMLAR.map((d) =>
                `<option ${p.durum === d ? "selected" : ""}>${d}</option>`).join("")}
            </select>
          </div>
          <div class="alan">
            <label for="p-baslangic">Başlangıç Tarihi</label>
            <input id="p-baslangic" type="date" value="${esc(p.baslangicTarihi || bugun())}">
          </div>
        </div>

        <div class="alan">
          <label for="p-aciklama">Açıklama</label>
          <textarea id="p-aciklama" placeholder="Proje ile ilgili notlar…">${esc(p.aciklama || "")}</textarea>
        </div>

        <div id="parsel-hata" class="uyari gizli"></div>
      </form>`,
    altHTML: `
      <span class="bosluk"></span>
      <button class="btn" data-rol="iptal" type="button">Vazgeç</button>
      <button class="btn btn-ana" data-rol="kaydet" type="button">
        ${ikon("tik", { boyut: 15 })} ${duzenleme ? "Kaydet" : "Parseli Oluştur"}
      </button>`
  });

  m.alt.querySelector('[data-rol="iptal"]').onclick = m.kapat;
  m.alt.querySelector('[data-rol="kaydet"]').onclick = kaydet;
  m.govde.querySelector("#parsel-form").addEventListener("submit", (e) => {
    e.preventDefault();
    kaydet({ currentTarget: m.alt.querySelector('[data-rol="kaydet"]') });
  });

  async function kaydet(e) {
    const g = (id) => m.govde.querySelector(id);
    const hata = g("#parsel-hata");
    const ad = g("#p-ad").value.trim();

    if (!ad) {
      hata.className = "uyari";
      hata.innerHTML = `${ikon("uyari")}<span>Proje / Parsel adı zorunludur.</span>`;
      g("#p-ad").focus();
      return;
    }
    hata.className = "uyari gizli";

    const veri = {
      ad,
      ada: g("#p-ada").value.trim(),
      parselNo: g("#p-parsel").value.trim(),
      il: g("#p-il").value.trim(),
      ilce: g("#p-ilce").value.trim(),
      mahalle: g("#p-mahalle").value.trim(),
      durum: g("#p-durum").value,
      baslangicTarihi: g("#p-baslangic").value || "",
      adres: g("#p-adres").value.trim(),
      aciklama: g("#p-aciklama").value.trim()
    };

    const btn = e.currentTarget;
    butonMesgul(btn, true, "Kaydediliyor…");
    try {
      if (duzenleme) {
        await parselGuncelle(parsel.id, veri);
        toast("Parsel güncellendi", "basarili");
      } else {
        await parselEkle(veri);
        toast("Parsel oluşturuldu", "basarili");
      }
      m.kapat();
      if (bitince) bitince();
    } catch (err) {
      console.error(err);
      toast(firebaseHata(err), "hata");
      butonMesgul(btn, false);
    }
  }
}
