// ==========================================================================
//  Harcama ekleme / düzenleme formu
//  Hazır sebep listesi + "Diğer" ile serbest metin girişi
// ==========================================================================
import {
  esc, ikon, toast, modalAc, butonMesgul, firebaseHata,
  bugun, paraCoz, paraYaz, paraInputBagla
} from "./utils.js";
import { HARCAMA_SEBEPLERI, harcamaEkle, harcamaGuncelle } from "./veri.js";

export function harcamaFormAc({ parselId, harcama = null, bitince }) {
  const duzenleme = !!harcama;
  const h = harcama || {};
  const hazirMi = HARCAMA_SEBEPLERI.some((grup) => grup.secenekler.includes(h.sebep));
  const serbest = duzenleme && !hazirMi;

  const m = modalAc({
    baslik: duzenleme ? "Harcamayı Düzenle" : "Yeni Harcama Ekle",
    icerikHTML: `
      <form id="harcama-form" novalidate>
        <div class="alan">
          <label for="h-sebep">Harcama Sebebi *</label>
          <select id="h-sebep">
            <option value="">— Seçiniz —</option>
            ${HARCAMA_SEBEPLERI.map((grup) => `
              <optgroup label="${esc(grup.baslik)}">
                ${grup.secenekler.map((s) =>
                  `<option value="${esc(s)}" ${h.sebep === s ? "selected" : ""}>${esc(s)}</option>`
                ).join("")}
              </optgroup>`).join("")}
            <option value="__diger__" ${serbest ? "selected" : ""}>✎ Diğer (kendim yazacağım)</option>
          </select>
          <div class="ipucu">Listede yoksa "Diğer"i seçip serbestçe yazabilirsiniz.</div>
        </div>

        <div class="alan ${serbest ? "" : "gizli"}" id="h-ozel-alan">
          <label for="h-ozel">Harcama Sebebi (serbest metin) *</label>
          <input id="h-ozel" type="text" placeholder="Örn: Vinç kiralama bedeli"
                 value="${serbest ? esc(h.sebep || "") : ""}">
        </div>

        <div class="ikili">
          <div class="alan">
            <label for="h-tutar">Harcanan Tutar (₺) *</label>
            <input id="h-tutar" type="text" required placeholder="25.000,00"
                   value="${h.tutar ? paraYaz(h.tutar) : ""}">
          </div>
          <div class="alan">
            <label for="h-tarih">Harcama Tarihi *</label>
            <input id="h-tarih" type="date" value="${esc(h.tarih || bugun())}">
          </div>
        </div>

        <hr class="form-ayrac">
        <div class="form-bolum-basligi">Belge Bilgisi (isteğe bağlı)</div>

        <div class="ikili">
          <div class="alan">
            <label for="h-firma">Ödenen Firma / Kişi</label>
            <input id="h-firma" type="text" value="${esc(h.firma || "")}" placeholder="ABC İnşaat Ltd. Şti.">
          </div>
          <div class="alan">
            <label for="h-belge">Belge / Fatura No</label>
            <input id="h-belge" type="text" value="${esc(h.belgeNo || "")}" placeholder="FTR-2026-0145">
          </div>
        </div>

        <div class="alan">
          <label for="h-aciklama">Açıklama</label>
          <textarea id="h-aciklama" placeholder="Detay…">${esc(h.aciklama || "")}</textarea>
        </div>

        <div id="harcama-hata" class="uyari gizli"></div>
      </form>`,
    altHTML: `
      <span class="bosluk"></span>
      <button class="btn" data-rol="iptal" type="button">Vazgeç</button>
      <button class="btn btn-ana" data-rol="kaydet" type="button">
        ${ikon("tik", { boyut: 15 })} ${duzenleme ? "Kaydet" : "Harcamayı Ekle"}
      </button>`
  });

  const sebepSec = m.govde.querySelector("#h-sebep");
  const ozelAlan = m.govde.querySelector("#h-ozel-alan");
  const ozelInput = m.govde.querySelector("#h-ozel");

  sebepSec.addEventListener("change", () => {
    const diger = sebepSec.value === "__diger__";
    ozelAlan.classList.toggle("gizli", !diger);
    if (diger) ozelInput.focus();
  });

  paraInputBagla(m.govde.querySelector("#h-tutar"));

  m.alt.querySelector('[data-rol="iptal"]').onclick = m.kapat;
  m.alt.querySelector('[data-rol="kaydet"]').onclick = kaydet;
  m.govde.querySelector("#harcama-form").addEventListener("submit", (e) => {
    e.preventDefault();
    kaydet({ currentTarget: m.alt.querySelector('[data-rol="kaydet"]') });
  });

  async function kaydet(e) {
    const g = (id) => m.govde.querySelector(id);
    const hata = g("#harcama-hata");

    let sebep = sebepSec.value;
    if (sebep === "__diger__") sebep = ozelInput.value.trim();
    const tutar = paraCoz(g("#h-tutar").value);
    const tarih = g("#h-tarih").value;

    const hatalar = [];
    if (!sebep) hatalar.push("Harcama sebebi zorunludur.");
    if (tutar <= 0) hatalar.push("Tutar 0'dan büyük olmalıdır.");
    if (!tarih) hatalar.push("Harcama tarihi zorunludur.");

    if (hatalar.length) {
      hata.className = "uyari";
      hata.innerHTML = `${ikon("uyari")}<span>${hatalar.map(esc).join("<br>")}</span>`;
      return;
    }
    hata.className = "uyari gizli";

    const veri = {
      sebep,
      tutar,
      tarih,
      firma: g("#h-firma").value.trim(),
      belgeNo: g("#h-belge").value.trim(),
      aciklama: g("#h-aciklama").value.trim()
    };

    const btn = e.currentTarget;
    butonMesgul(btn, true, "Kaydediliyor…");
    try {
      if (duzenleme) {
        await harcamaGuncelle(parselId, harcama.id, veri);
        toast("Harcama güncellendi", "basarili");
      } else {
        await harcamaEkle(parselId, veri);
        toast("Harcama eklendi", "basarili");
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
