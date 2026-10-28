// Firebase のコンソールの「プロジェクトの設定」→「マイアプリ」に出る値。公開されても問題の無い値で、守りは firestore.rules が担う。
// null のあいだはログインの欄を出さない
export const firebaseConfig = {
  apiKey: "AIzaSyBgIGWlmHVchPYKyQMwwz_x8MIalJes3Fw",
  // ログインの中継ページは自分のドメイン（NavyBlooming/navyblooming.github.io の __/auth/）に置く。
  // firebaseapp.com のままだと、Safari が別のサイトの保存領域を分けるため、ログインの途中経過が失われる
  authDomain: "navyblooming.github.io",
  projectId: "yugioh-deck-a361b",
  storageBucket: "yugioh-deck-a361b.firebasestorage.app",
  messagingSenderId: "506699229897",
  appId: "1:506699229897:web:9cd0d2d2148a0850ba7b18",
};
