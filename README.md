# 나의 서재

노션 독서 DB → yes24 표지 스크래핑 → 정적 HTML 서재.

## 구조

```
도서/
├── data/books.csv        # 노션에서 export한 CSV (수동 업데이트)
├── covers/               # yes24에서 다운로드한 표지 (스크래퍼가 채움)
├── scripts/
│   ├── scrape-covers.mjs # yes24 표지 스크래핑
│   └── build-site.mjs    # 정적 HTML 빌드
└── dist/                 # 생성된 사이트 (배포 대상)
```

## 사용법

### 1. 노션에서 CSV export

독서리스트 페이지 우상단 `⋯` → `Export` → Format: `Markdown & CSV` → 다운로드.
압축 풀고 CSV 파일을 `data/books.csv`로 저장.

### 2. 표지 스크래핑 (최초 1회, 이후 신규분만)

```bash
npm run scrape
```

yes24 링크에서 표지 이미지를 `covers/` 폴더에 저장. 이미 있는 건 스킵.

### 3. 사이트 빌드

```bash
npm run build
```

`dist/index.html` 생성. 브라우저에서 열면 확인 가능.

### 한번에:

```bash
npm run all
```

## 배포 (GitHub Pages)

추후 추가 예정.
