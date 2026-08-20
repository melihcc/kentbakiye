// ==========================================================================
//  Malik ekleme / düzenleme + Ödeme planı sihirbazı
//
//  Adım 1: Malik bilgileri + Toplam tutar / Peşinat / Vade
//  Adım 2: Otomatik üretilen plan tablosu — kullanıcı her vadeyi
//          (tarih + tutar) düzenleyebilir, satır ekleyip silebilir.
//          Ancak ondan sonra kaydedilir.
// ==========================================================================
import {
  esc, ikon, fmtTL, paraCoz, paraYaz, yuvarla, bugun, ayEkle, toast,
  modalAc, butonMesgul, firebaseHata, paraInputBagla, taksitDurumu, DURUM_RENK
} from "./utils.js";
import { planUret, planNormalize, malikEkle, malikGuncelle } from "./veri.js";

/**
 * @param {object} p
 * @param {string} p.parselId
 * @param {string} p.parselAdi
 * @param {object|null} p.malik   düzenleme için mevcut malik (yoksa null)
 * @param {Function} p.bitince   kayıttan sonra çağrılır
 */
export function malikFormAc({ parselId, parselAdi, malik = null, bitince }) {
  const duzenleme = !!malik;

  const m = modalAc({
    baslik: duzenleme ? "Malik ve Ödeme Planını Düzenle" : "Yeni Malik Ekle",
    genis: true
  });

  const durum = {
    bilgi: {
      adSoyad: malik?.adSoyad || "",
      tcKimlik: malik?.tcKimlik || "",
      telefon: malik?.telefon || "",
      bagimsizBolum: malik?.bagimsizBolum || "",
      hisse: malik?.hisse || "",
      not: malik?.not || "",
      toplamTutar: malik?.toplamTutar || 0,
      pesinat: malik?.pesinat || 0,
      pesinatTarihi: malik?.pesinatTarihi || bugun(),
      pesinatOdendi: malik?.pesinatOdendi !== undefined ? malik.pesinatOdendi : true,
      vadeSayisi: malik?.vadeSayisi ?? 12,
      ilkTaksitTarihi: malik?.ilkTaksitTarihi || ayEkle(bugun(), 1),
      aralikAy: malik?.aralikAy || 1
    },
    taksitler: duzenleme ? JSON.parse(JSON.stringify(malik.taksitler || [])) : []
  };

  adim1Ciz();

  /* ======================================================================
     ADIM 1 — Bilgiler
     ====================================================================== */
  function adim1Ciz() {
    const b = durum.bilgi;
    m.govde.innerHTML = `
      ${adimGosterge(1)}

      <form id="malik-adim1" novalidate>
        <div class="form-bolum-basligi">Malik Bilgileri</div>

        <div class="ikili">
          <div class="alan">
            <label for="f-ad">Ad Soyad *</label>
            <input id="f-ad" type="text" value="${esc(b.adSoyad)}" placeholder="Ahmet Yılmaz" required>
          </div>
          <div class="alan">
            <label for="f-tel">Telefon</label>
            <input id="f-tel" type="tel" value="${esc(b.telefon)}" placeholder="0532 000 00 00">
          </div>
        </div>

        <div class="uclu">
          <div class="alan">
            <label for="f-tc">T.C. Kimlik No</label>
            <input id="f-tc" type="text" value="${esc(b.tcKimlik)}" maxlength="11"
                   inputmode="numeric" placeholder="00000000000">
          </div>
          <div class="alan">
            <label for="f-bb">Bağımsız Bölüm / Daire</label>
            <input id="f-bb" type="text" value="${esc(b.bagimsizBolum)}" placeholder="Daire 5">
          </div>
          <div class="alan">
            <label for="f-hisse">Hisse</label>
            <input id="f-hisse" type="text" value="${esc(b.hisse)}" placeholder="1/8">
          </div>
        </div>

        <hr class="form-ayrac">
        <div class="form-bolum-basligi">Ödeme Koşulları</div>

        <div class="alan">
          <label for="f-toplam">Ödenecek Toplam Tutar (₺) *</label>
          <input id="f-toplam" type="text" required placeholder="1.500.000,00"
                 value="${b.toplamTutar ? paraYaz(b.toplamTutar) : ""}">
          <div class="ipucu">Malikin bize ödeyeceği toplam para — peşinat dâhil.</div>
        </div>

        <div class="uclu">
          <div class="alan">
            <label for="f-pesinat">Peşin Ödenen (₺)</label>
            <input id="f-pesinat" type="text" placeholder="0,00"
                   value="${b.pesinat ? paraYaz(b.pesinat) : ""}">
          </div>
          <div class="alan">
            <label for="f-pesinat-tarih">Peşinat Tarihi</label>
            <input id="f-pesinat-tarih" type="date" value="${esc(b.pesinatTarihi)}">
          </div>
          <div class="alan">
            <label>Peşinat Durumu</label>
            <label class="onay-satir">
              <input id="f-pesinat-odendi" type="checkbox" ${b.pesinatOdendi ? "checked" : ""}>
              <span>Tahsil edildi</span>
            </label>
          </div>
        </div>

        <div class="uclu">
          <div class="alan">
            <label for="f-vade">Vade (Taksit Sayısı) *</label>
            <input id="f-vade" type="number" min="0" max="360" step="1"
                   value="${esc(b.vadeSayisi)}" required>
          </div>
          <div class="alan">
            <label for="f-ilk-tarih">İlk Taksit Tarihi</label>
            <input id="f-ilk-tarih" type="date" value="${esc(b.ilkTaksitTarihi)}">
          </div>
          <div class="alan">
            <label for="f-aralik">Ödeme Sıklığı</label>
            <select id="f-aralik">
              ${[[1, "Her ay"], [2, "2 ayda bir"], [3, "3 ayda bir (çeyreklik)"],
                 [6, "6 ayda bir"], [12, "Yılda bir"]]
                .map(([v, ad]) =>
                  `<option value="${v}" ${Number(b.aralikAy) === v ? "selected" : ""}>${ad}</option>`
                ).join("")}
            </select>
          </div>
        </div>

        <div class="alan">
          <label for="f-not">Not</label>
          <textarea id="f-not" placeholder="Bu malikle ilgili notlar…">${esc(b.not)}</textarea>
        </div>

        <div id="adim1-hata" class="uyari gizli"></div>
      </form>`;

    m.altYaz(`
      <button class="btn" data-rol="iptal" type="button">Vazgeç</button>
      <span class="bosluk"></span>
      ${duzenleme
        ? `<button class="btn" data-rol="plan-koru" type="button">Mevcut Planı Koru</button>` : ""}
      <button class="btn btn-ana" data-rol="plan-uret" type="button">
        ${duzenleme ? "Planı Yeniden Oluştur" : "Ödeme Planını Oluştur"} ${ikon("sagOk", { boyut: 15 })}
      </button>`);

    paraInputBagla(m.govde.querySelector("#f-toplam"));
    paraInputBagla(m.govde.querySelector("#f-pesinat"));

    m.alt.querySelector('[data-rol="iptal"]').onclick = m.kapat;

    const koruBtn = m.alt.querySelector('[data-rol="plan-koru"]');
    if (koruBtn) koruBtn.onclick = () => { if (bilgiOku()) adim2Ciz(); };

    m.alt.querySelector('[data-rol="plan-uret"]').onclick = () => {
      if (!bilgiOku()) return;
      const b2 = durum.bilgi;
      durum.taksitler = planUret({
        toplamTutar: b2.toplamTutar,
        pesinat: b2.pesinat,
        pesinatTarihi: b2.pesinatTarihi,
        pesinatOdendi: b2.pesinatOdendi,
        vadeSayisi: b2.vadeSayisi,
        ilkTaksitTarihi: b2.ilkTaksitTarihi,
        aralikAy: b2.aralikAy
      });
      adim2Ciz();
    };

    m.govde.querySelector("#malik-adim1").addEventListener("submit", (e) => {
      e.preventDefault();
      m.alt.querySelector('[data-rol="plan-uret"]').click();
    });
  }

  /** Adım 1 formunu okuyup doğrular */
  function bilgiOku() {
    const g = (id) => m.govde.querySelector(id);
    const hata = g("#adim1-hata");
    const adSoyad = g("#f-ad").value.trim();
    const toplam = paraCoz(g("#f-toplam").value);
    const pesinat = paraCoz(g("#f-pesinat").value);
    const vade = parseInt(g("#f-vade").value, 10) || 0;

    const hatalar = [];
    if (!adSoyad) hatalar.push("Ad Soyad zorunludur.");
    if (toplam <= 0) hatalar.push("Toplam tutar 0'dan büyük olmalıdır.");
    if (pesinat > toplam) hatalar.push("Peşinat, toplam tutardan büyük olamaz.");
    if (vade < 0) hatalar.push("Vade sayısı negatif olamaz.");
    if (vade === 0 && pesinat < toplam) {
      hatalar.push("Vade 0 ise peşinat toplam tutara eşit olmalıdır.");
    }

    if (hatalar.length) {
      hata.className = "uyari";
      hata.innerHTML = `${ikon("uyari")}<span>${hatalar.map(esc).join("<br>")}</span>`;
      hata.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return false;
    }
    hata.className = "uyari gizli";

    durum.bilgi = {
      adSoyad,
      tcKimlik: g("#f-tc").value.trim(),
      telefon: g("#f-tel").value.trim(),
      bagimsizBolum: g("#f-bb").value.trim(),
      hisse: g("#f-hisse").value.trim(),
      not: g("#f-not").value.trim(),
      toplamTutar: toplam,
      pesinat,
      pesinatTarihi: g("#f-pesinat-tarih").value || bugun(),
      pesinatOdendi: g("#f-pesinat-odendi").checked,
      vadeSayisi: vade,
      ilkTaksitTarihi: g("#f-ilk-tarih").value || ayEkle(bugun(), 1),
      aralikAy: parseInt(g("#f-aralik").value, 10) || 1
    };
    return true;
  }

  /* ======================================================================
     ADIM 2 — Plan düzenleme
     ====================================================================== */
  function adim2Ciz() {
    m.govde.innerHTML = `
      ${adimGosterge(2)}

      <div class="uyari bilgi" style="margin-top:0;margin-bottom:16px">
        ${ikon("bilgi")}
        <span><b>Plan önizlemesi.</b> Her vadenin tarihini ve tutarını değiştirebilir,
        satır ekleyip silebilirsiniz. <b>Kaydet</b>'e basmadan hiçbir şey yazılmaz.</span>
      </div>

      <div class="plan-arac">
        <div>
          <div class="baslik">${esc(durum.bilgi.adSoyad)}</div>
          <div class="alt">Sözleşme tutarı: ${fmtTL(durum.bilgi.toplamTutar)}</div>
        </div>
        <span style="flex:1"></span>
        <button class="btn btn-kucuk" type="button" data-rol="satir-ekle">${ikon("arti")} Vade Ekle</button>
        <button class="btn btn-kucuk" type="button" data-rol="esitle">Tutarları Eşitle</button>
      </div>

      <div class="plan-sar">
        <table class="plan-tablo">
          <thead>
            <tr>
              <th style="width:64px">#</th>
              <th style="width:158px">Vade Tarihi</th>
              <th style="width:150px">Tutar (₺)</th>
              <th style="width:78px">Ödendi</th>
              <th>Açıklama</th>
              <th style="width:48px"></th>
            </tr>
          </thead>
          <tbody id="plan-govde"></tbody>
        </table>
      </div>

      <div class="plan-ozet">
        <div><div class="e">Vade Sayısı</div><div class="d" id="oz-adet">0</div></div>
        <div><div class="e">Plan Toplamı</div><div class="d" id="oz-toplam">—</div></div>
        <div><div class="e">Sözleşme</div><div class="d" id="oz-sozlesme">—</div></div>
        <div><div class="e">Fark</div><div class="d" id="oz-fark">—</div></div>
      </div>

      <div id="plan-uyari" class="uyari gizli"></div>`;

    m.altYaz(`
      <button class="btn" data-rol="geri" type="button">${ikon("solOk", { boyut: 15 })} Geri</button>
      <span class="bosluk"></span>
      <button class="btn" data-rol="iptal2" type="button">Vazgeç</button>
      <button class="btn btn-ana" data-rol="kaydet" type="button">
        ${ikon("tik", { boyut: 15 })} ${duzenleme ? "Değişiklikleri Kaydet" : "Malik ve Planı Kaydet"}
      </button>`);

    m.alt.querySelector('[data-rol="geri"]').onclick = adim1Ciz;
    m.alt.querySelector('[data-rol="iptal2"]').onclick = m.kapat;
    m.alt.querySelector('[data-rol="kaydet"]').onclick = kaydet;

    m.govde.querySelector('[data-rol="satir-ekle"]').onclick = () => {
      const son = durum.taksitler[durum.taksitler.length - 1];
      durum.taksitler.push({
        no: durum.taksitler.length,
        tip: "taksit",
        tarih: son ? ayEkle(son.tarih, durum.bilgi.aralikAy || 1) : bugun(),
        tutar: 0,
        odendi: false,
        odemeTarihi: null,
        aciklama: ""
      });
      tabloCiz();
      const sar = m.govde.querySelector(".plan-sar");
      sar.scrollTop = sar.scrollHeight;
    };

    m.govde.querySelector('[data-rol="esitle"]').onclick = () => {
      const fark = yuvarla(durum.bilgi.toplamTutar - planToplami());
      if (Math.abs(fark) < 0.005) { toast("Tutarlar zaten eşit", "basarili"); return; }
      const sonTaksit = [...durum.taksitler].reverse().find((t) => t.tip === "taksit")
        || durum.taksitler[durum.taksitler.length - 1];
      if (!sonTaksit) { toast("Önce bir vade ekleyin", "hata"); return; }
      sonTaksit.tutar = yuvarla((Number(sonTaksit.tutar) || 0) + fark);
      tabloCiz();
      toast("Fark son vadeye eklendi", "basarili");
    };

    tabloCiz();
  }

  function planToplami() {
    return yuvarla(durum.taksitler.reduce((t, x) => t + (Number(x.tutar) || 0), 0));
  }

  function tabloCiz() {
    const tbody = m.govde.querySelector("#plan-govde");
    if (!tbody) return;

    if (!durum.taksitler.length) {
      tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;padding:30px;color:var(--metin-soluk);
                                   font-weight:600;font-size:13.5px">
          Henüz vade yok. "Vade Ekle" ile ekleyebilirsiniz.
        </td></tr>`;
      ozetGuncelle();
      return;
    }

    let taksitNo = 0;
    tbody.innerHTML = durum.taksitler.map((t, i) => {
      const pesin = t.tip === "pesinat";
      if (!pesin) taksitNo++;
      return `
        <tr data-i="${i}">
          <td>
            <span class="sira">
              <span class="nokta" style="background:${DURUM_RENK[taksitDurumu(t)]}"></span>
              ${pesin ? "Peş." : taksitNo}
            </span>
          </td>
          <td><input type="date" data-alan="tarih" value="${esc(t.tarih || "")}"></td>
          <td><input type="text" class="sag" data-alan="tutar" value="${paraYaz(t.tutar)}"></td>
          <td style="text-align:center">
            <input type="checkbox" data-alan="odendi" ${t.odendi ? "checked" : ""}
                   aria-label="Ödendi">
          </td>
          <td><input type="text" data-alan="aciklama" placeholder="İsteğe bağlı"
                     value="${esc(t.aciklama || "")}"></td>
          <td style="text-align:center">
            <button class="btn btn-ikon btn-hayalet-tehlike" type="button" data-rol="sil"
                    title="Vadeyi sil" aria-label="Vadeyi sil">${ikon("cop")}</button>
          </td>
        </tr>`;
    }).join("");

    tbody.querySelectorAll("tr[data-i]").forEach((tr) => {
      const i = Number(tr.dataset.i);
      const tarihIn = tr.querySelector('[data-alan="tarih"]');
      const tutarIn = tr.querySelector('[data-alan="tutar"]');
      const odendiIn = tr.querySelector('[data-alan="odendi"]');
      const aciklamaIn = tr.querySelector('[data-alan="aciklama"]');

      tarihIn.onchange = () => { durum.taksitler[i].tarih = tarihIn.value; noktaGuncelle(tr, i); };

      paraInputBagla(tutarIn);
      tutarIn.addEventListener("input", () => {
        durum.taksitler[i].tutar = paraCoz(tutarIn.value);
        ozetGuncelle();
      });

      odendiIn.onchange = () => {
        durum.taksitler[i].odendi = odendiIn.checked;
        durum.taksitler[i].odemeTarihi = odendiIn.checked ? bugun() : null;
        noktaGuncelle(tr, i);
      };

      aciklamaIn.addEventListener("input", () => { durum.taksitler[i].aciklama = aciklamaIn.value; });

      tr.querySelector('[data-rol="sil"]').onclick = () => {
        durum.taksitler.splice(i, 1);
        tabloCiz();
      };
    });

    ozetGuncelle();
  }

  function noktaGuncelle(tr, i) {
    const n = tr.querySelector(".nokta");
    if (n) n.style.background = DURUM_RENK[taksitDurumu(durum.taksitler[i])];
  }

  function ozetGuncelle() {
    const g = (id) => m.govde.querySelector(id);
    if (!g("#oz-toplam")) return;

    const toplam = planToplami();
    const sozlesme = durum.bilgi.toplamTutar;
    const fark = yuvarla(sozlesme - toplam);
    const esit = Math.abs(fark) < 0.005;

    g("#oz-adet").textContent = durum.taksitler.length;
    g("#oz-toplam").textContent = fmtTL(toplam);
    g("#oz-sozlesme").textContent = fmtTL(sozlesme);
    g("#oz-fark").textContent = fmtTL(fark);
    g("#oz-fark").className = "d " + (esit ? "d-yesil" : "d-kirmizi");

    const uyari = g("#plan-uyari");
    if (esit) {
      uyari.className = "uyari tamam";
      uyari.innerHTML = `${ikon("tik")}<span>Plan toplamı sözleşme tutarıyla birebir eşit.</span>`;
    } else {
      uyari.className = "uyari sari";
      uyari.innerHTML = `${ikon("uyari")}<span>${fark > 0
        ? `Planda <b>${fmtTL(fark)}</b> eksik var. "Tutarları Eşitle" ile son vadeye ekleyebilirsiniz.`
        : `Plan, sözleşme tutarını <b>${fmtTL(Math.abs(fark))}</b> aşıyor.`}</span>`;
    }
  }

  /* ======================================================================
     Kayıt
     ====================================================================== */
  async function kaydet(e) {
    const btn = e.currentTarget;
    const taksitler = planNormalize(durum.taksitler);

    if (!taksitler.length) {
      toast("En az bir vade eklemelisiniz", "hata");
      return;
    }

    const kayit = { ...durum.bilgi, taksitler, planToplami: planToplami() };

    butonMesgul(btn, true, "Kaydediliyor…");
    try {
      if (duzenleme) {
        await malikGuncelle(parselId, malik.id, kayit);
        toast("Malik güncellendi", "basarili");
      } else {
        await malikEkle(parselId, parselAdi, kayit);
        toast("Malik ve ödeme planı kaydedildi", "basarili");
      }
      m.kapat();
      if (bitince) bitince();
    } catch (err) {
      console.error(err);
      toast(firebaseHata(err), "hata");
      butonMesgul(btn, false);
    }
  }

  /* ---------------- Adım göstergesi ---------------- */
  function adimGosterge(aktif) {
    return `
      <div class="adimlar">
        <div class="adim ${aktif === 1 ? "aktif" : "tamam"}">
          <span class="yuvarlak">${aktif > 1 ? "✓" : "1"}</span>
          <span>Bilgiler</span>
        </div>
        <div class="adim-cizgi ${aktif > 1 ? "dolu" : ""}"></div>
        <div class="adim ${aktif === 2 ? "aktif" : ""}">
          <span class="yuvarlak">2</span>
          <span>Ödeme Planı</span>
        </div>
      </div>`;
  }
}
