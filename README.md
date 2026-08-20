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


