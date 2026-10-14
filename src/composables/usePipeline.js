import { ref, shallowRef } from 'vue'
import { pipeline, env } from '@huggingface/transformers'

env.useBrowserCache = true
env.allowLocalModels = true
env.allowRemoteModels = false
env.localModelPath = '/models/'

const wasmMjsUrl = new URL('../wasm/ort-wasm-simd-threaded.mjs', import.meta.url).href
const wasmWasmUrl = new URL('../wasm/ort-wasm-simd-threaded.wasm', import.meta.url).href
env.backends.onnx.wasm.wasmPaths = { mjs: wasmMjsUrl, wasm: wasmWasmUrl }

export function usePipeline(task, model, options = {}) {
  const instance = shallowRef(null)
  const loading = ref(false)
  const progress = ref(0)
  const error = ref(null)

  async function load() {
    if (instance.value) return instance.value
    loading.value = true
    error.value = null
    progress.value = 0

    const pipelineOpts = {
      progress_callback: (p) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
          progress.value = Math.round(p.progress)
          console.log(`[usePipeline:${model}] ${p.file || ''} ${p.progress.toFixed(1)}%`)
        } else if (p.status === 'done') {
          console.log(`[usePipeline:${model}] ✓ ${p.file || 'готово'}`)
        } else if (p.status === 'ready') {
          console.log(`[usePipeline:${model}] Модель готова`)
        } else if (p.status === 'error') {
          console.error(`[usePipeline:${model}] Ошибка в callback:`, p)
        }
      },
    }
    if (options.dtype) pipelineOpts.dtype = options.dtype

    try {
      instance.value = await pipeline(task, model, pipelineOpts)
    } catch (e) {
      error.value = e
      console.error(`[usePipeline:${model}] Ошибка загрузки модели:`, e)
    } finally {
      loading.value = false
    }
    return instance.value
  }

  function dispose() {
    if (instance.value && typeof instance.value.dispose === 'function') {
      instance.value.dispose()
    }
    instance.value = null
    progress.value = 0
    error.value = null
  }

  return { instance, loading, progress, error, load, dispose }
}
