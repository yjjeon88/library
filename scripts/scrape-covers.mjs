import fs from 'node:fs/promises';
import path from 'node:path';
import { parseCSV, extractYes24ProductId } from './lib-csv.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CSV_PATH = path.join(ROOT, 'data', 'books.csv');
const COVERS_DIR = path.join(ROOT, 'covers');
const DELAY_MS = 400;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function fetchYes24CoverUrl(productId) {
  const url = `https://www.yes24.com/Product/Goods/${productId}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // yes24 sets og:image to a high-res cover
  const og = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (og) return og[1];
  // Fallback: look for gImage
  const alt = html.match(/https?:\/\/image\.yes24\.com\/goods\/\d+\/[LXS]/i);
  return alt ? alt[0] : null;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://www.yes24.com/' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

async function main() {
  if (!(await fileExists(CSV_PATH))) {
    console.error(`CSV 파일을 찾을 수 없음: ${CSV_PATH}`);
    console.error(`노션에서 DB를 CSV로 export한 뒤 위 경로에 books.csv 로 저장해주세요.`);
    process.exit(1);
  }
  await fs.mkdir(COVERS_DIR, { recursive: true });

  const text = await fs.readFile(CSV_PATH, 'utf-8');
  const books = parseCSV(text);
  console.log(`총 ${books.length}권 발견.`);

  let scraped = 0, skipped = 0, failed = 0;
  const failures = [];

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const title = b['도서제목'] || b['Title'] || b['title'] || '(제목없음)';
    const link = b['링크'] || b['Link'] || b['link'] || '';
    const pid = extractYes24ProductId(link);

    if (!pid) {
      failed++;
      failures.push({ title, reason: 'yes24 링크 없음', link });
      continue;
    }

    const dest = path.join(COVERS_DIR, `${pid}.jpg`);
    if (await fileExists(dest)) { skipped++; continue; }

    try {
      const imgUrl = await fetchYes24CoverUrl(pid);
      if (!imgUrl) throw new Error('og:image 없음');
      await downloadImage(imgUrl, dest);
      scraped++;
      console.log(`  [${i + 1}/${books.length}] ✓ ${title}`);
      await sleep(DELAY_MS);
    } catch (e) {
      failed++;
      failures.push({ title, reason: e.message, link });
      console.log(`  [${i + 1}/${books.length}] ✗ ${title} — ${e.message}`);
    }
  }

  console.log(`\n완료. 신규: ${scraped}, 스킵(기존): ${skipped}, 실패: ${failed}`);
  if (failures.length) {
    const logPath = path.join(ROOT, 'covers', '_failures.json');
    await fs.writeFile(logPath, JSON.stringify(failures, null, 2));
    console.log(`실패 목록: ${logPath}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
