<p align="center">
  <img src="assets/kentbakiye-logo@2x.png" width="380" alt="KentBakiye">
</p>

<p align="center"><b>Dönüşümün hesabı net.</b><br>
Kentsel Dönüşüm Muhasebe Sistemi</p>

---

**KentBakiye**, kentsel dönüşüm ve yapı projeleri için muhasebe, bütçe, ödeme,
tahsilat ve mali raporlama uygulamasıdır. Firebase (Authentication + Firestore)
üzerinde çalışır, derleme adımı gerektirmez; doğrudan GitHub Pages'e yüklenip açılır.

## Özellikler

- **Kayıt ekranı yok.** Kullanıcılar yalnızca Firebase Console'dan tarafınızca oluşturulur.
  Uygulamada sadece *Giriş* ve *Şifremi unuttum* vardır.
- **İlk giriş akışı:** kullanıcı ilk kez girdiğinde ad ve soyadı sorulur
  (`kullanicilar/{uid}` altında saklanır). Sonraki girişlerde uygulama ona adıyla
  hitap eder — panelde saate göre *"Günaydın, Melih"* / *"İyi günler, Melih"*.
  Ad, sağ üstteki menüden istendiği zaman değiştirilebilir.
- **Rehberli tanıtım turu:** ilk girişten hemen sonra 10 adımlık bir tur açılır.
  Gerçek arayüz öğelerini (özet kutuları, bildirimler, "Yeni Parsel" düğmesi)
  spot ışığıyla gösterir; parsel sayfası düzenini, ödeme planı sihirbazını,
  renk kodlarını (tıklanabilir canlı örnekle), harcama tablosunu ve grafiği
  mini örneklerle anlatır. Menüden dilediğiniz zaman tekrar izlenebilir.
- **Kontrol paneli:** altı özet kutusu (aktif parsel, toplam tahsilat, toplam harcama,
  kasa bakiyesi, gecikmiş alacak, kalan alacak), bildirimler ve parsel kartları.
- **Bildirimler:** gecikmiş ödemeler ve 30 gün içinde vadesi gelen taksitler;
  tıklayınca ilgili parselin sayfasına gider.
- **Parsel detay sayfası** iki bölüme ayrılmıştır:
  - **Üst — Gelir:** her malik için ayrı pencere (kart). Kartta ödeme planı listelenir.
    - 🟢 **Yeşil** — ödendi
    - 🟡 **Sarı** — vadesi henüz gelmemiş
    - 🔴 **Kırmızı** — vadesi geçmiş, ödenmemiş
    - Taksite tıklandığında ödendi / ödenmedi olarak değişir ve anında Firestore'a yazılır.
  - **Alt — Gider:** o parsel için yapılan harcamalar tablosu. 6 kategoride 35 hazır
    kentsel dönüşüm gider kalemi + "Diğer" ile serbest metin girişi.
  - **Sağ:** toplam gelen para, toplam harcanan para, halka (donut) grafik ve alacak dökümü.
- **Ödeme planı sihirbazı:** toplam tutar + peşinat + vade + ödeme sıklığı sorulur,
  plan otomatik üretilir; **kaydetmeden önce** her vadenin tarihi ve tutarı tek tek
  düzenlenebilir, satır eklenip silinebilir. Plan toplamı ile sözleşme tutarı
  arasındaki fark canlı gösterilir.
- Mobil, tablet ve masaüstünde çalışan duyarlı arayüz; telefona "ana ekrana ekle"
  ile uygulama gibi kurulabilir (PWA manifest).

## Marka

| | |
|---|---|
| Lacivert | `#12324A` — güven, kurumsallık, denetim |
| Turkuaz | `#14A69B` — dönüşüm, teknoloji, ilerleme |
| Beyaz | `#FFFFFF` — açıklık ve okunabilirlik |
| Tipografi | Manrope (başlıklarda SemiBold/Bold, gövdede Regular) |

Ad daima bitişik ve büyük `K` ile büyük `B` kullanılarak yazılır: **KentBakiye**.

---

## 1) Firebase kurulumu

1. https://console.firebase.google.com adresinden **yeni proje** oluşturun.
2. **Build > Authentication > Get started** → **Sign-in method** sekmesinde
   **Email/Password**'ü etkinleştirin.
3. Aynı sayfadaki **Settings > User actions** bölümünde
   **"Enable create (sign-up)"** seçeneğini **kapatın**. Böylece dışarıdan kimse hesap açamaz.
4. **Users** sekmesinden **Add user** ile çalışanlarınızın e-posta + şifresini siz oluşturun.
   (Kullanıcı isterse "Şifremi unuttum" ile kendi şifresini değiştirir.)
5. **Build > Firestore Database > Create database** → *Production mode* seçin.
6. Firestore'un **Rules** sekmesine [`firestore.rules`](firestore.rules) dosyasının
   içeriğini yapıştırıp **Publish** deyin.
7. **Project settings (⚙) > General > Your apps** bölümünden **Web (`</>`)** uygulaması
   ekleyin, size verilen `firebaseConfig` nesnesini kopyalayın.
8. **`js/config.js`** dosyasını açıp değerleri yapıştırın:

```js
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "proje-adi.firebaseapp.com",
  projectId: "proje-adi",
  storageBucket: "proje-adi.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// GitHub Pages adresiniz (şifre sıfırlama e-postası buraya döner)
export const SIFIRLAMA_ADRESI = "https://KULLANICI-ADINIZ.github.io/kentbakiye/";
```

> `apiKey` gizli bir anahtar değildir, tarayıcıda görünmesi normaldir.
> Güvenlik, Firestore kuralları + kapalı kayıt ile sağlanır.

---

## 2) GitHub Pages'e yayınlama

```bash
git init
git add .
git commit -m "KentBakiye"
git branch -M main
git remote add origin https://github.com/KULLANICI-ADINIZ/kentbakiye.git
git push -u origin main
```

Sonra GitHub'da: **Settings > Pages** → *Source:* **Deploy from a branch** →
*Branch:* `main` / `(root)` → **Save**.

Birkaç dakika içinde adresiniz hazır olur:
`https://KULLANICI-ADINIZ.github.io/kentbakiye/`

### Son adım — Firebase'e alan adını tanıtın

Firebase Console > **Authentication > Settings > Authorized domains** → **Add domain**
ile `KULLANICI-ADINIZ.github.io` adresini ekleyin.
Bu yapılmazsa giriş `auth/unauthorized-domain` hatası verir.

---

## 3) Yerelde çalıştırma

ES modülleri kullanıldığı için dosyayı çift tıklayarak açmak yetmez, bir yerel sunucu gerekir:

```bash
npx serve .
```

Ardından `http://localhost:3000` adresini açın. (`localhost` Firebase'in
**Authorized domains** listesinde varsayılan olarak ekli gelir.)

---

## Veri yapısı

```
kullanicilar/{uid}
  └─ adSoyad, eposta, tanitimGosterildi, guncellemeTarihi

parseller/{parselId}
  ├─ ad, ada, parselNo, il, ilce, mahalle, adres, durum, baslangicTarihi, aciklama
  ├─ malikler/{malikId}
  │    ├─ adSoyad, tcKimlik, telefon, bagimsizBolum, hisse, not
  │    ├─ toplamTutar, pesinat, pesinatTarihi, vadeSayisi, ilkTaksitTarihi, aralikAy
  │    └─ taksitler: [{ no, tip, tarih, tutar, odendi, odemeTarihi, aciklama }]
  └─ harcamalar/{harcamaId}
       └─ sebep, tutar, tarih, firma, belgeNo, aciklama
```

## Dosya düzeni

| Dosya | Görevi |
|---|---|
| `index.html` | Uygulama kabuğu, font ve ikon bağlantıları |
| `manifest.webmanifest` | PWA tanımı (ana ekrana ekleme) |
| `css/style.css` | Marka renkleri ve tüm tasarım sistemi |
| `assets/` | Logo ve uygulama ikonu (PNG, farklı boyutlar) |
| `js/config.js` | **Firebase ayarları — siz doldurun** |
| `js/firebase.js` | Firebase SDK kurulumu |
| `js/utils.js` | Para/tarih biçimlendirme, ikonlar, modal, toast, halka grafik |
| `js/veri.js` | Firestore CRUD, hesaplamalar, plan üretici, gider kalemleri |
| `js/auth.js` | Giriş ve şifre sıfırlama ekranları |
| `js/profil.js` | İlk giriş karşılaması, ad soyad kaydı, selamlama |
| `js/tanitim.js` | Rehberli tanıtım turu |
| `js/app.js` | Oturum kontrolü, üst bar, yönlendirme |
| `js/panel.js` | Kontrol paneli (bildirimler + parseller) |
| `js/parsel.js` | Parsel detay sayfası |
| `js/malik-form.js` | Malik + ödeme planı sihirbazı |
| `js/harcama-form.js` | Harcama formu |
| `js/parsel-form.js` | Parsel formu |
| `firestore.rules` | Firestore güvenlik kuralları |
