// ==========================================================================
//  FIREBASE AYARLARI
//  --------------------------------------------------------------------------
//  Firebase Console > Proje Ayarlari > "Uygulamalariniz" > Web uygulamasi
//  bolumundeki degerleri asagiya yapistirin.
//  (Bu degerler gizli anahtar degildir, tarayiciya acik olmasi normaldir.
//   Guvenlik Firestore kurallari ile saglanir -> firestore.rules dosyasi)
// ==========================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyAOxUHoIVX9v79Cd3QiH_cpunvT7tkAKlQ",
  authDomain: "muhasebe-app-798ea.firebaseapp.com",
  projectId: "muhasebe-app-798ea",
  storageBucket: "muhasebe-app-798ea.firebasestorage.app",
  messagingSenderId: "675564326000",
  appId: "1:675564326000:web:f6cf2776487f643ed638b5",
  measurementId: "G-CS7EWCWBFP"
};

// Sifre sifirlama e-postasindaki baglantinin geri donecegi adres.
// Bos birakilirsa uygulamanin acik oldugu adres kullanilir.
export const SIFIRLAMA_ADRESI = "https://kentbakiye.com/";
