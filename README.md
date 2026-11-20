# Fran:D 제안서 스튜디오

고객 조건에 따라 제안 모듈과 품목 팩을 고르고, 편성 순서를 바꾸면서 완성될 페이지를 미리 보는 브라우저 목업입니다. [공개 스튜디오](https://frand-proposal-studio.samin-park.chatgpt.site)

## 실행

저장소를 내려받고 폴더에서 `python -m http.server 8000`을 실행한 뒤 브라우저에서 `http://localhost:8000`을 엽니다. 별도 빌드 없이 동작합니다.

## 구성

- `studio.js`와 `studio.css`가 편집 화면, 하단선, 우측 페이지 번호를 표시합니다.
- `state.js`는 고객 조건과 추천 규칙을, `pagination.js`는 최종 편성의 페이지 번호를 처리합니다.
- `catalog.js`와 `assets/`에는 모듈 정보와 슬라이드 미리보기 이미지가 있습니다.
- 고객 조건은 이 브라우저의 로컬 저장소에, 사용자가 추가한 자료는 IndexedDB에 보관합니다.
