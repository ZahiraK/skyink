// Prepares MediaPipe assets so the app is fully self-hosted:
//   1. copies the WASM runtime from node_modules into public/wasm
//   2. downloads the hand landmarker model into public/models (skipped if already present)
// Runs automatically before `npm run dev` and `npm run build`.
import { copyFile, mkdir, readdir, rename, stat } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = path.join(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const wasmDest = path.join(root, 'public/wasm')
const modelDest = path.join(root, 'public/models/hand_landmarker.task')
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

const exists = (p) => stat(p).then(() => true, () => false)
const isCI = Boolean(process.env.CI || process.env.NETLIFY)

async function copyWasm() {
  await mkdir(wasmDest, { recursive: true })
  for (const file of await readdir(wasmSrc)) {
    await copyFile(path.join(wasmSrc, file), path.join(wasmDest, file))
  }
  console.log('[setup] copied MediaPipe WASM runtime to public/wasm')
}

async function downloadModel() {
  if (await exists(modelDest)) {
    console.log('[setup] hand_landmarker.task already present')
    return
  }
  await mkdir(path.dirname(modelDest), { recursive: true })
  console.log('[setup] downloading hand_landmarker.task ...')
  const res = await fetch(MODEL_URL)
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
  const tmp = `${modelDest}.part`
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp))
  await rename(tmp, modelDest) // never leave a half-downloaded model behind
  console.log('[setup] model saved to public/models')
}

try {
  await copyWasm()
  await downloadModel()
} catch (err) {
  console.warn(`[setup] failed: ${err.message}`)
  console.warn(`[setup] download the model manually from:\n  ${MODEL_URL}\n  and save it as public/models/hand_landmarker.task`)
  if (isCI) process.exit(1) // a deploy without the model would be broken, so fail loudly
}
