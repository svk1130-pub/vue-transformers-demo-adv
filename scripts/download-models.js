/* ==========================================================================
   download-models.js
   Скачивает модели transformers.js с HuggingFace Hub в public/models/
   и копирует wasm-файлы ONNX Runtime из node_modules/ в public/wasm/.

   Запуск: npm run setup

   Если файл уже существует и имеет ненулевой размер — пропускаем (идемпотентность).
   ========================================================================== */

import { mkdir, writeFile, stat, copyFile, access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const MODELS_DIR = join(ROOT, 'public', 'models')
// ★ ВАЖНО: WASM-файлы кладём в src/wasm/, а НЕ в public/wasm/.
//   onnxruntime-web v1.21+ грузит WASM через динамический import() .mjs-обёртки.
//   Vite ломает import, если .mjs лежит в public/ (добавляет ?import query).
//   Файлы в src/wasm/ Vite корректно резолвит через new URL(..., import.meta.url)
//   в usePipeline.js и даёт статический URL без перехвата.
const WASM_DIR = join(ROOT, 'src', 'wasm')

// Базовый URL HuggingFace Hub
const HF_BASE = 'https://huggingface.co'

// Список моделей и файлов, которые нужно скачать.
// transformers.js по умолчанию использует квантованные ONNX-модели.
// Для seq2seq (opus-mt) нужны отдельные encoder/decoder файлы:
//   - onnx/encoder_model_quantized.onnx
//   - onnx/decoder_model_merged_quantized.onnx
const MODELS = {
  'Xenova/detr-resnet-50': [
    'config.json',
    'preprocessor_config.json',
    'onnx/model.onnx',
  ],
  'Xenova/opus-mt-ru-en': [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'generation_config.json',
    'special_tokens_map.json',
    'onnx/encoder_model_quantized.onnx',
    'onnx/decoder_model_merged_quantized.onnx',
  ],
  'Xenova/opus-mt-en-ru': [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'generation_config.json',
    'special_tokens_map.json',
    'onnx/encoder_model_quantized.onnx',
    'onnx/decoder_model_merged_quantized.onnx',
  ],
}

// WASM-файлы, которые копируем из node_modules/onnxruntime-web/dist/
// Включаем и .wasm, и .mjs-обёртки: ONNX Runtime Web в новых версиях требует
// .mjs-файл-посредник для динамического импорта WebAssembly.
// Кладём только simd-threaded вариант — он идёт в onnxruntime-web dist по умолчанию.
const WASM_FILES = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.mjs',
]

// ---------------------------------------------------------------------------
// Утилиты

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

async function fileExistsNonEmpty(path) {
  try {
    const s = await stat(path)
    return s.isFile() && s.size > 0
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// fetch с retry-логикой (для нестабильных сетей — особенно на Windows)
// Экспоненциальная задержка: 1с → 2с → 4с → 8с (макс 30с)
// Таймаут: 10 минут на файл (модели до 160 МБ на медленном канале)
const FETCH_TIMEOUT_MS = 10 * 60 * 1000
const FETCH_MAX_RETRIES = 5

async function fetchWithRetry(url) {
  for (let attempt = 1; attempt <= FETCH_MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (vue-transformers-setup)',
          'Accept': '*/*',
        },
        signal: controller.signal,
        redirect: 'follow',
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return Buffer.from(await res.arrayBuffer())
    } catch (e) {
      clearTimeout(timeout)
      if (attempt === FETCH_MAX_RETRIES) {
        throw new Error(`Все ${FETCH_MAX_RETRIES} попыток не удались: ${e.message}`)
      }
      const waitMs = Math.min(1000 * 2 ** (attempt - 1), 30000)
      console.log(`    попытка ${attempt}/${FETCH_MAX_RETRIES}: ${e.message}, повтор через ${waitMs}мс`)
      await new Promise((r) => setTimeout(r, waitMs))
    } finally {
      clearTimeout(timeout)
    }
  }
}

async function downloadFile(url, destPath) {
  if (await fileExistsNonEmpty(destPath)) {
    console.log(`  ✓ уже скачан: ${destPath.replace(ROOT + '/', '')}`)
    return
  }
  await ensureDir(dirname(destPath))

  console.log(`  ↓ скачиваю: ${url}`)
  try {
    const buf = await fetchWithRetry(url)
    await writeFile(destPath, buf)
    const kb = (buf.length / 1024).toFixed(0)
    console.log(`    сохранён (${kb} КБ)`)
  } catch (e) {
    // Fallback: пробуем зеркало hf-mirror.com (иногда стабильнее на проблемных сетях)
    if (url.startsWith('https://huggingface.co/')) {
      const mirrorUrl = url.replace('https://huggingface.co/', 'https://hf-mirror.com/')
      console.log(`  ↻ пробуем зеркало: ${mirrorUrl}`)
      try {
        const buf = await fetchWithRetry(mirrorUrl)
        await writeFile(destPath, buf)
        const kb = (buf.length / 1024).toFixed(0)
        console.log(`    сохранён через зеркало (${kb} КБ)`)
        return
      } catch (e2) {
        console.error(`  ✗ зеркало тоже не удалось: ${e2.message}`)
      }
    }
    throw e
  }
}

// ---------------------------------------------------------------------------
// Скачивание моделей

async function downloadModels() {
  console.log('\n=== Скачивание моделей ===')
  for (const [modelId, files] of Object.entries(MODELS)) {
    console.log(`\nМодель: ${modelId}`)
    for (const file of files) {
      const url = `${HF_BASE}/${modelId}/resolve/main/${file}`
      const dest = join(MODELS_DIR, modelId, file)
      try {
        await downloadFile(url, dest)
      } catch (e) {
        console.error(`  ✗ ошибка: ${e.message}`)
        // Fallback: для 'onnx/model.onnx' пробуем квантованный вариант
        // (актуально для single-encoder моделей, например detr-resnet-50)
        if (file === 'onnx/model.onnx') {
          const altUrl = `${HF_BASE}/${modelId}/resolve/main/onnx/model_quantized.onnx`
          const altDest = join(MODELS_DIR, modelId, file)
          console.log(`  ↻ пробуем квантованный вариант: ${altUrl}`)
          try {
            await downloadFile(altUrl, altDest)
          } catch (e2) {
            console.error(`  ✗ fallback тоже не удался: ${e2.message}`)
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Копирование WASM

async function copyWasm() {
  console.log('\n=== Копирование WASM-файлов ===')
  await ensureDir(WASM_DIR)

  // onnxruntime-web поставляется как зависимость @huggingface/transformers
  const candidates = [
    join(ROOT, 'node_modules', 'onnxruntime-web', 'dist'),
    join(ROOT, 'node_modules', '@huggingface', 'transformers', 'dist'),
  ]

  let srcDir = null
  for (const c of candidates) {
    if (existsSync(c)) {
      srcDir = c
      break
    }
  }

  if (!srcDir) {
    console.error('  ✗ onnxruntime-web не найден. Сначала запустите: npm install')
    console.error('    Ищли в:')
    candidates.forEach((c) => console.error(`     - ${c}`))
    return
  }
  console.log(`  источник: ${srcDir}`)

  for (const file of WASM_FILES) {
    const src = join(srcDir, file)
    const dest = join(WASM_DIR, file)

    if (await fileExistsNonEmpty(dest)) {
      console.log(`  ✓ уже скопирован: ${file}`)
      continue
    }

    if (!existsSync(src)) {
      console.warn(`  ! не найден в node_modules: ${file} (возможно, не нужен для вашего сценария)`)
      continue
    }

    await copyFile(src, dest)
    console.log(`  ✓ скопирован: ${file}`)
  }
}

// ---------------------------------------------------------------------------
// Main

async function main() {
  console.log('============================================')
  console.log('  Загрузка моделей и WASM для демо')
  console.log('============================================')

  await ensureDir(MODELS_DIR)
  await ensureDir(WASM_DIR)

  await copyWasm()
  await downloadModels()

  console.log('\n============================================')
  console.log('  Готово! Модели в public/models/, WASM в src/wasm/')
  console.log('  Теперь можно запускать: npm run dev')
  console.log('============================================\n')
}

main().catch((e) => {
  console.error('\nКритическая ошибка:', e)
  process.exit(1)
})
