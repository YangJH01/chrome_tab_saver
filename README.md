<p align="center">
  <img src="./docs/images/readme-icon.png" alt="Tab Save icon" width="96" height="96">
</p>

<h1 align="center">Tab Save</h1>

<p align="center">
  Save the current window as a reusable tab session.
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Chrome-Manifest%20V3-2563EB?style=flat-square">
  <img alt="React" src="https://img.shields.io/badge/React-TypeScript-0F172A?style=flat-square">
  <img alt="Theme" src="https://img.shields.io/badge/Theme-System%20%2F%20Light%20%2F%20Dark-14B8A6?style=flat-square">
  <img alt="Language" src="https://img.shields.io/badge/Language-KO%20%2F%20EN-7C3AED?style=flat-square">
</p>

<p align="center">
  <img src="./docs/images/hero.svg" alt="Tab Save hero banner">
</p>

`Tab Save`는 지금 열려 있는 탭 묶음을 한 번에 저장하고, 필요할 때 다시 여는 Chrome 확장 프로그램입니다. 급하게 창을 닫아야 할 때도, 프로젝트별 시작 탭 조합을 반복해서 열어야 할 때도 흐름을 끊지 않고 이어갈 수 있습니다.

## Why Tab Save

- 지금 열려 있는 창을 세션으로 저장하고 나중에 그대로 다시 열 수 있습니다.
- 팝업에서는 빠르게 저장하고, 관리 페이지에서는 더 자세하게 정리할 수 있습니다.
- 복원 방식을 기본값으로 정해 둘 수 있고, 필요한 세션만 따로 바꿔 열 수도 있습니다.
- 저장 후 현재 탭을 유지할지 바로 정리할지도 선택할 수 있습니다.
- 라이트, 다크, 시스템 테마와 한국어, English UI를 지원합니다.

## Best For

- 업무 시작 전에 늘 여는 탭 조합이 있는 경우
- 리서치 탭을 잠깐 치워 두고 나중에 다시 이어서 보고 싶은 경우
- 프로젝트별로 브라우저 작업 공간을 나눠 관리하고 싶은 경우

## Preview

<p align="center">
  <img src="./docs/images/feature-strip.svg" alt="Tab Save feature preview">
</p>

## What You Can Do

### Save a window in one step

- 현재 창의 복원 가능한 탭을 한 번에 저장
- 세션 이름 직접 입력 가능
- 저장 후 현재 탭을 유지하거나 모두 닫도록 설정 가능

### Restore the way you prefer

- 팝업에서 전역 기본 복원 방식으로 즉시 열기
- 관리 페이지에서 세션별 복원 방식 선택
- `새 탭`
  현재 창에 새 탭들로 복원
- `현재 탭`
  활성 탭을 첫 페이지로 바꾸고 나머지를 옆으로 복원

### Manage saved sessions

- 저장된 세션 이름 수정
- 세션 삭제 / 실행 취소
- 세션 내부 탭 목록 확인
- 개별 탭 삭제

### Set your defaults once

- 기본 복원 방식
- 저장 후 탭 유지 / 닫기
- 시스템 / 라이트 / 다크 테마
- 한국어 / English 언어 전환

## Install In Chrome

### Option 1. Download the latest release

1. 저장소의 `Releases` 페이지에서 최신 ZIP을 다운로드합니다.
2. ZIP을 압축 해제합니다.
3. 압축을 푼 폴더 안에서 `manifest.json`이 바로 보이는지 확인합니다.
4. `chrome://extensions`에서 `압축해제된 확장 프로그램을 로드합니다`로 그 폴더를 선택합니다.

### Option 2. Build it yourself

```bash
npm install
npm run build
```

그다음 Chrome에서:

1. `chrome://extensions`를 엽니다.
2. 우측 상단에서 `개발자 모드`를 켭니다.
3. `압축해제된 확장 프로그램을 로드합니다`를 클릭합니다.
4. 이 프로젝트의 `dist/` 폴더를 선택합니다.

## How It Works

### Save tabs

1. 확장 팝업을 엽니다.
2. 세션 이름을 입력합니다.
3. `저장` 버튼으로 현재 창의 탭을 세션으로 저장합니다.

### Restore tabs

1. 팝업에서 최근 저장 목록을 엽니다.
2. `열기`로 전역 기본 복원 방식에 따라 세션을 복원합니다.
3. 더 세밀한 제어가 필요하면 관리 페이지에서 세션별 복원 방식을 바꿔 복원합니다.

### Manage sessions

1. 관리 페이지를 엽니다.
2. 세션 이름을 수정하거나 삭제합니다.
3. 세션을 펼쳐 포함된 탭 목록을 확인합니다.

## Settings

관리 페이지의 설정 버튼에서 아래 항목을 바꿀 수 있습니다.

- 기본 복원 방식
- 저장 후 탭 처리 방식
- 테마
- 언어

## Your Data Stays Local

- 세션 데이터와 설정은 `chrome.storage.local`에 저장됩니다.
- 다른 기기와 자동 동기화되지는 않습니다.
- `chrome://`, `about:blank` 같은 비표준 URL은 저장 대상에서 제외됩니다.

## Permissions

- `tabs`
  현재 창 탭 조회, 복원, 저장 후 탭 닫기 처리에 사용
- `storage`
  세션과 전역 설정을 로컬에 저장

## For Maintainers

### Create a release ZIP

GitHub `Release`에 ZIP 파일을 손으로 직접 올릴 필요는 없습니다. 아래 순서로 워크플로를 실행하면 테스트, 빌드, ZIP 생성, Release 업로드까지 자동으로 진행됩니다.

1. 저장소의 `Actions` 탭으로 이동합니다.
2. `Release Extension` 워크플로를 엽니다.
3. `Run workflow`를 누릅니다.
4. 브랜치는 `main`을 선택합니다.
5. 버전 예: `0.1.0`을 입력합니다.
6. 완료되면 `Releases`에 `tab-save-0.1.0.zip`이 생성됩니다.

`태그 푸시`는 `v0.1.0`처럼 버전 이름을 Git에 붙여 올려서 같은 워크플로를 자동 실행하는 방식입니다. 지금은 몰라도 괜찮고, 웹에서 `Run workflow`만 눌러도 충분합니다.

### Development

```bash
npm install
npm test
npm run build
```

아이콘을 다시 생성하려면:

```bash
node scripts/generate-icons.mjs
```

### Project Structure

```text
.
├── manager.html
├── popup.html
├── public
│   └── assets
├── scripts
│   └── generate-icons.mjs
├── src
│   ├── components
│   ├── lib
│   ├── pages
│   ├── test
│   ├── manager.tsx
│   ├── manifest.ts
│   ├── popup.tsx
│   └── styles.css
└── private
    └── screenshots
```
