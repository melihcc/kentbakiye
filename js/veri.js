// ==========================================================================
//  Veri katmanı — Firestore okuma/yazma + hesaplamalar
//
//  Koleksiyon yapısı:
//    kullanicilar/{uid}
//    parseller/{parselId}
//    parseller/{parselId}/malikler/{malikId}
//    parseller/{parselId}/harcamalar/{harcamaId}
// ==========================================================================
import {
  db, auth,
  collection, collectionGroup, doc,
  getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, writeBatch
} from "./firebase.js";
import { yuvarla, ayEkle, bugun, taksitDurumu } from "./utils.js";

/* ====================== KULLANICI PROFİLİ ====================== */

/** Giriş yapan kullanıcının profil kaydını getirir (yoksa null) */
export async function profilGetir(uid) {
  const d = await getDoc(doc(db, "kullanicilar", uid));
  return d.exists() ? { uid: d.id, ...d.data() } : null;
}

/** Profil kaydını oluşturur veya günceller */
export async function profilYaz(uid, veri) {
  await setDoc(
    doc(db, "kullanicilar", uid),
    {
      ...veri,
      eposta: auth.currentUser ? auth.currentUser.email : null,
      guncellemeTarihi: serverTimestamp()
    },
    { merge: true }
  );
}

/* ====================== PARSELLER ====================== */

export async function parselleriGetir() {
  const s = await getDocs(query(collection(db, "parseller"), orderBy("olusturmaTarihi", "desc")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function parselGetir(id) {
  const d = await getDoc(doc(db, "parseller", id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() };
}

export async function parselEkle(veri) {
  const r = await addDoc(collection(db, "parseller"), {
    ...veri,
    olusturmaTarihi: serverTimestamp(),
    olusturan: auth.currentUser ? auth.currentUser.email : null
  });
  return r.id;
}

export async function parselGuncelle(id, veri) {
  await updateDoc(doc(db, "parseller", id), {
    ...veri,
    guncellemeTarihi: serverTimestamp(),
    guncelleyen: auth.currentUser ? auth.currentUser.email : null
  });
}

/** Parseli, tüm malik ve harcama alt kayıtlarıyla birlikte siler */
export async function parselSil(id) {
  const [malikler, harcamalar] = await Promise.all([
    getDocs(collection(db, "parseller", id, "malikler")),
    getDocs(collection(db, "parseller", id, "harcamalar"))
  ]);

  const hepsi = [...malikler.docs, ...harcamalar.docs];
  // Firestore batch limiti 500
  for (let i = 0; i < hepsi.length; i += 400) {
    const b = writeBatch(db);
    hepsi.slice(i, i + 400).forEach((d) => b.delete(d.ref));
    await b.commit();
  }
  await deleteDoc(doc(db, "parseller", id));
}

/* ====================== MALIKLER ====================== */

export async function malikleriGetir(parselId) {
  const s = await getDocs(collection(db, "parseller", parselId, "malikler"));
  const liste = s.docs.map((d) => ({ id: d.id, ...d.data() }));
  liste.sort((a, b) => (a.adSoyad || "").localeCompare(b.adSoyad || "", "tr"));
  return liste;
}

export async function malikEkle(parselId, parselAdi, veri) {
  const r = await addDoc(collection(db, "parseller", parselId, "malikler"), {
    ...veri,
    parselId,
    parselAdi,
    olusturmaTarihi: serverTimestamp(),
    olusturan: auth.currentUser ? auth.currentUser.email : null
  });
  return r.id;
}

export async function malikGuncelle(parselId, malikId, veri) {
  await updateDoc(doc(db, "parseller", parselId, "malikler", malikId), {
    ...veri,
    guncellemeTarihi: serverTimestamp()
  });
}

export async function malikSil(parselId, malikId) {
  await deleteDoc(doc(db, "parseller", parselId, "malikler", malikId));
}

/** Tek bir taksitin ödendi bilgisini değiştirir */
export async function taksitDurumDegistir(parselId, malik, taksitIndex) {
  const taksitler = (malik.taksitler || []).map((t, i) => {
    if (i !== taksitIndex) return t;
    const yeniDurum = !t.odendi;
    return {
      ...t,
      odendi: yeniDurum,
      odemeTarihi: yeniDurum ? bugun() : null
    };
  });
  await malikGuncelle(parselId, malik.id, { taksitler });
  return taksitler;
}

/* ====================== HARCAMALAR ====================== */

export async function harcamalariGetir(parselId) {
  const s = await getDocs(collection(db, "parseller", parselId, "harcamalar"));
  const liste = s.docs.map((d) => ({ id: d.id, ...d.data() }));
  liste.sort((a, b) => String(b.tarih || "").localeCompare(String(a.tarih || "")));
  return liste;
}

export async function harcamaEkle(parselId, veri) {
  const r = await addDoc(collection(db, "parseller", parselId, "harcamalar"), {
    ...veri,
    parselId,
    olusturmaTarihi: serverTimestamp(),
    olusturan: auth.currentUser ? auth.currentUser.email : null
  });
  return r.id;
}

export async function harcamaGuncelle(parselId, harcamaId, veri) {
  await updateDoc(doc(db, "parseller", parselId, "harcamalar", harcamaId), {
    ...veri,
    guncellemeTarihi: serverTimestamp()
  });
}

export async function harcamaSil(parselId, harcamaId) {
  await deleteDoc(doc(db, "parseller", parselId, "harcamalar", harcamaId));
}

/* ====================== TOPLU (panel icin) ====================== */

/**
 * Bütün parsellerin alt koleksiyonunu tek seferde okur (collectionGroup).
 *
 * collectionGroup sorgusu Firestore kurallarında joker yollu bir kural ister
 * ( match /{yol=**}/malikler/{id} ). Kural dar yazılmışsa sorgu
 * "permission-denied" döner; bu durumda parsel parsel okuyarak devam ederiz.
 *
 * @param {string} altKoleksiyon "malikler" | "harcamalar"
 * @param {string[]} parselIdler yedek yol için parsel kimlikleri
 */
async function altKoleksiyonuTopla(altKoleksiyon, parselIdler = []) {
  try {
    const s = await getDocs(collectionGroup(db, altKoleksiyon));
    return s.docs.map((d) => ({ id: d.id, ...d.data(), parselId: d.ref.parent.parent.id }));
  } catch (err) {
    const yedekMumkun = err && (err.code === "permission-denied" || err.code === "failed-precondition");
    if (!yedekMumkun || !parselIdler.length) throw err;

    console.warn(
      `collectionGroup("${altKoleksiyon}") reddedildi (${err.code}); ` +
      "parsel parsel okunuyor. Firestore kurallarına joker yollu kuralı ekleyin."
    );

    const yiginlar = await Promise.all(
      parselIdler.map((pid) => getDocs(collection(db, "parseller", pid, altKoleksiyon)))
    );
    return yiginlar.flatMap((s, i) =>
      s.docs.map((d) => ({ id: d.id, ...d.data(), parselId: parselIdler[i] }))
    );
  }
}

/** Tüm parsellerin tüm malikleri — bildirimler ve özet için */
export async function tumMalikleriGetir(parselIdler = []) {
  return altKoleksiyonuTopla("malikler", parselIdler);
}

/** Tüm harcamalar */
export async function tumHarcamalariGetir(parselIdler = []) {
  return altKoleksiyonuTopla("harcamalar", parselIdler);
}

/* ====================== HESAPLAMALAR ====================== */

/** Bir malikin özeti */
export function malikOzet(malik) {
  const taksitler = malik.taksitler || [];
  let toplam = 0, odenen = 0, gecikmis = 0, bekleyen = 0;
  let odenenAdet = 0, gecikmisAdet = 0;

  taksitler.forEach((t) => {
    const tutar = Number(t.tutar) || 0;
    toplam += tutar;
    const d = taksitDurumu(t);
    if (d === "odendi") { odenen += tutar; odenenAdet++; }
    else if (d === "gecikmis") { gecikmis += tutar; gecikmisAdet++; }
    else bekleyen += tutar;
  });

  // Sözleşme tutarı girilmişse onu esas al, yoksa taksit toplamı
  const sozlesme = Number(malik.toplamTutar) || toplam;

  return {
    toplam: yuvarla(sozlesme),
    taksitToplam: yuvarla(toplam),
    odenen: yuvarla(odenen),
    gecikmis: yuvarla(gecikmis),
    bekleyen: yuvarla(bekleyen),
    kalan: yuvarla(toplam - odenen),
    adet: taksitler.length,
    odenenAdet,
    gecikmisAdet,
    yuzde: toplam > 0 ? Math.min(100, (odenen / toplam) * 100) : 0
  };
}

/** Bir parselin gelir/gider özeti */
export function parselOzet(malikler, harcamalar) {
  let sozlesmeToplam = 0, tahsilEdilen = 0, gecikmis = 0, bekleyen = 0;

  malikler.forEach((m) => {
    const o = malikOzet(m);
    sozlesmeToplam += o.taksitToplam;
    tahsilEdilen += o.odenen;
    gecikmis += o.gecikmis;
    bekleyen += o.bekleyen;
  });

  const harcanan = harcamalar.reduce((t, h) => t + (Number(h.tutar) || 0), 0);

  return {
    sozlesmeToplam: yuvarla(sozlesmeToplam),
    tahsilEdilen: yuvarla(tahsilEdilen),
    gecikmis: yuvarla(gecikmis),
    bekleyen: yuvarla(bekleyen),
    kalanAlacak: yuvarla(sozlesmeToplam - tahsilEdilen),
    harcanan: yuvarla(harcanan),
    bakiye: yuvarla(tahsilEdilen - harcanan),
    malikSayisi: malikler.length,
    harcamaSayisi: harcamalar.length
  };
}

/**
 * Bildirim listesi uretir:
 *  - vadesi geçmiş ödenmemiş taksitler (gecikmiş)
 *  - önümüzdeki N gün içinde vadesi gelen taksitler (yaklaşan)
 */
export function bildirimleriUret(tumMalikler, gunSayisi = 30) {
  const bu = bugun();
  const liste = [];

  tumMalikler.forEach((m) => {
    (m.taksitler || []).forEach((t, i) => {
      if (t.odendi) return;
      const d = taksitDurumu(t);
      if (d === "gecikmis") {
        liste.push({ tip: "gecikmis", malik: m, taksit: t, index: i, tarih: t.tarih });
      } else if (d === "bekliyor" && t.tarih) {
        const fark = (new Date(t.tarih + "T00:00:00") - new Date(bu + "T00:00:00")) / 86400000;
        if (fark <= gunSayisi) {
          liste.push({ tip: "yaklasan", malik: m, taksit: t, index: i, tarih: t.tarih, gunKaldi: Math.round(fark) });
        }
      }
    });
  });

  // Önce gecikmişler (en eski tarih başta), sonra yaklaşanlar
  liste.sort((a, b) => {
    if (a.tip !== b.tip) return a.tip === "gecikmis" ? -1 : 1;
    return String(a.tarih).localeCompare(String(b.tarih));
  });
  return liste;
}

/* ====================== ODEME PLANI URETICI ====================== */

/**
 * Ödeme planı oluşturur.
 * @param {object} p
 * @param {number} p.toplamTutar     Malikin ödeyeceği toplam para
 * @param {number} p.pesinat         Peşin ödenen tutar (0 olabilir)
 * @param {string} p.pesinatTarihi   ISO tarih
 * @param {boolean} p.pesinatOdendi  Peşinat tahsil edildi mi
 * @param {number} p.vadeSayisi      Taksit adedi
 * @param {string} p.ilkTaksitTarihi ISO tarih
 * @param {number} p.aralikAy        Taksitler arası ay (1 = aylık, 3 = 3 ayda bir)
 * @returns {Array} taksit listesi
 */
export function planUret({
  toplamTutar,
  pesinat = 0,
  pesinatTarihi = bugun(),
  pesinatOdendi = true,
  vadeSayisi = 12,
  ilkTaksitTarihi,
  aralikAy = 1
}) {
  const taksitler = [];
  const toplam = yuvarla(toplamTutar);
  const pesin = yuvarla(Math.min(pesinat, toplam));

  if (pesin > 0) {
    taksitler.push({
      no: 0,
      tip: "pesinat",
      tarih: pesinatTarihi,
      tutar: pesin,
      odendi: !!pesinatOdendi,
      odemeTarihi: pesinatOdendi ? pesinatTarihi : null,
      aciklama: "Peşinat"
    });
  }

  const kalan = yuvarla(toplam - pesin);
  const adet = Math.max(0, Math.floor(vadeSayisi));

  if (adet > 0 && kalan > 0) {
    // Kuruş farkını son taksite yüklemek için taban tutarı 2 haneye yuvarla
    const taban = Math.floor((kalan / adet) * 100) / 100;
    let dagitilan = 0;
    const baslangic = ilkTaksitTarihi || ayEkle(pesinatTarihi, aralikAy);

    for (let i = 0; i < adet; i++) {
      const sonuncu = i === adet - 1;
      const tutar = sonuncu ? yuvarla(kalan - dagitilan) : taban;
      dagitilan = yuvarla(dagitilan + tutar);
      taksitler.push({
        no: i + 1,
        tip: "taksit",
        tarih: ayEkle(baslangic, i * aralikAy),
        tutar,
        odendi: false,
        odemeTarihi: null,
        aciklama: ""
      });
    }
  }

  return taksitler;
}

/** Taksit listesini numaralandırıp temizler (düzenlemeden sonra) */
export function planNormalize(taksitler) {
  let sayac = 0;
  return taksitler
    .filter((t) => (Number(t.tutar) || 0) > 0 || t.tip === "pesinat")
    .map((t) => {
      const tip = t.tip === "pesinat" ? "pesinat" : "taksit";
      if (tip === "taksit") sayac++;
      return {
        no: tip === "pesinat" ? 0 : sayac,
        tip,
        tarih: t.tarih,
        tutar: yuvarla(t.tutar),
        odendi: !!t.odendi,
        odemeTarihi: t.odendi ? (t.odemeTarihi || bugun()) : null,
        aciklama: t.aciklama || (tip === "pesinat" ? "Peşinat" : "")
      };
    });
}
/* ====================== HAZIR HARCAMA SEBEPLERİ ====================== */
// Kentsel dönüşüm sürecinde en sık karşılaşılan gider kalemleri.
// Kullanıcı bunlardan birini seçebilir ya da "Diğer" ile serbest metin girebilir.
export const HARCAMA_SEBEPLERI = [
  {
    baslik: "Proje ve İzinler",
    secenekler: [
      "Mimari Proje Bedeli",
      "Statik Proje Bedeli",
      "Mekanik / Elektrik Proje Bedeli",
      "Zemin Etüdü",
      "Ruhsat Harçları ve Belediye Ödemeleri",
      "Riskli Yapı Tespiti",
      "Tapu / Noter Masrafları",
      "İskân (Yapı Kullanma İzni) İşlemleri",
      "Danışmanlık / Müşavirlik"
    ]
  },
  {
    baslik: "Malik Ödemeleri",
    secenekler: [
      "Kira Yardımı Ödemesi",
      "Taşınma Bedeli",
      "Malike Nakit Ödeme"
    ]
  },
  {
    baslik: "Kaba Yapı",
    secenekler: [
      "Yıkım İşleri",
      "Hafriyat ve Nakliye",
      "Temel / Kaba İnşaat (Beton-Demir)",
      "Duvar ve Sıva İşleri",
      "Çatı İşleri",
      "Isı Yalıtımı / Mantolama"
    ]
  },
  {
    baslik: "Tesisat",
    secenekler: [
      "Elektrik Tesisatı",
      "Sıhhi Tesisat",
      "Doğalgaz Tesisatı",
      "Asansör",
      "Isıtma / Soğutma Sistemi"
    ]
  },
  {
    baslik: "İnce İşler",
    secenekler: [
      "Kapı / Pencere (Doğrama)",
      "Zemin Kaplama (Seramik-Parke)",
      "Mutfak / Banyo Dolabı",
      "Boya ve Badana",
      "Peyzaj / Çevre Düzenlemesi"
    ]
  },
  {
    baslik: "Genel Giderler",
    secenekler: [
      "Müteahhit Hakediş Ödemesi",
      "İşçilik / Personel Maaşı",
      "SGK ve Vergi Ödemeleri",
      "Malzeme Alımı",
      "Makine / Ekipman Kirası",
      "İnşaat All Risk Sigortası",
      "Şantiye Genel Giderleri"
    ]
  }
];

/** Düz liste (arama/doğrulama için) */
export const HARCAMA_SEBEP_LISTESI = HARCAMA_SEBEPLERI.flatMap((g) => g.secenekler);
