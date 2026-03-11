import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Tab Save",
  version: "0.1.0",
  description: "현재 창 탭을 폴더처럼 저장하고 새 창으로 다시 여는 크롬 확장입니다.",
  action: {
    default_popup: "popup.html",
    default_title: "Tab Save",
    default_icon: {
      "16": "assets/icon-16.png",
      "32": "assets/icon-32.png",
      "48": "assets/icon-48.png",
      "128": "assets/icon-128.png"
    }
  },
  icons: {
    "16": "assets/icon-16.png",
    "32": "assets/icon-32.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png"
  },
  options_page: "manager.html",
  permissions: ["tabs", "storage"]
});
