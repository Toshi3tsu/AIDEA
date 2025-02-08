// src/frontend/app/_app.tsx (または _app.js)
import '@/styles/globals.css' // 既存のglobals.css のインポート
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'; // DHTMLX Gantt の CSS をインポート

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}