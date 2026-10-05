// Armazenamento do widget: window.__HAVIX_HOST__.storage (API padrão da loja).
// O analisador de widgets recusa acesso direto ao storage do navegador; use useHavixStorage('<namespace>').
// O widget só enxerga as chaves do próprio namespace. Valores em JSON (até 8 KB cada, 50 chaves por namespace),
// expiração opcional (ttlSeconds). Sem storage disponível tudo vira no-op: get → null, set → false.
//
// Espelho de havixfront/apps/web/src/host/widgetStorage.ts (mesmas regras); aqui, para o DevKit, os dados ficam
// em memória e somem ao recarregar a página.

export const WIDGET_STORAGE_PREFIX = 'havix:widget:'
export const MAX_VALUE_CHARS = 8 * 1024
export const MAX_KEYS_PER_NAMESPACE = 50

const NAMESPACE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i
const KEY_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/i

export interface WidgetStorageSetOptions {
  /** Expira depois de N segundos (inteiro > 0). */
  ttlSeconds?: number
}

export interface WidgetStorageScope {
  get<T = unknown>(key: string): T | null
  set(key: string, value: unknown, options?: WidgetStorageSetOptions): boolean
  remove(key: string): void
  keys(): string[]
  clear(): void
}

export interface WidgetStorageBridge {
  /** session: true usa o armazenamento da aba (some ao fechar). */
  scope(namespace: string, options?: { session?: boolean }): WidgetStorageScope
}

interface StoredEntry {
  v: unknown
  e?: number
}

type AreaResolver = (session: boolean) => Storage | null

export function createWidgetStorage(resolveArea: AreaResolver, now: () => number = Date.now): WidgetStorageBridge {
  return {
    scope(namespace, options) {
      if (typeof namespace !== 'string' || !NAMESPACE_PATTERN.test(namespace)) {
        throw new Error(`[havix-storage] namespace inválido: use letras, números, ".", "_" ou "-" (até 64)`)
      }
      return createScope(`${WIDGET_STORAGE_PREFIX}${namespace}:`, () => resolveArea(!!options?.session), now)
    },
  }
}

function createScope(prefix: string, area: () => Storage | null, now: () => number): WidgetStorageScope {
  function ownKeys(storage: Storage): string[] {
    const found: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith(prefix)) found.push(key)
    }
    return found
  }

  function read(storage: Storage, fullKey: string): StoredEntry | null {
    const raw = storage.getItem(fullKey)
    if (raw == null) return null
    try {
      const entry = JSON.parse(raw) as StoredEntry
      if (!entry || typeof entry !== 'object' || !('v' in entry)) return null
      if (typeof entry.e === 'number' && entry.e <= now()) {
        storage.removeItem(fullKey)
        return null
      }
      return entry
    } catch {
      return null
    }
  }

  return {
    get<T = unknown>(key: string): T | null {
      const storage = safeArea(area)
      if (!storage || !isValidKey(key)) return null
      try {
        const entry = read(storage, prefix + key)
        return entry ? (entry.v as T) : null
      } catch {
        return null
      }
    },

    set(key, value, options) {
      const storage = safeArea(area)
      if (!storage || !isValidKey(key)) return false
      if (value === undefined) {
        this.remove(key)
        return true
      }
      const entry: StoredEntry = { v: value }
      const ttl = options?.ttlSeconds
      if (ttl !== undefined) {
        if (!Number.isInteger(ttl) || ttl <= 0) return false
        entry.e = now() + ttl * 1000
      }
      let raw: string
      try {
        raw = JSON.stringify(entry)
      } catch {
        return false // referência circular, BigInt etc.
      }
      if (raw.length > MAX_VALUE_CHARS) return false
      try {
        const fullKey = prefix + key
        if (storage.getItem(fullKey) == null) {
          const live = ownKeys(storage).filter((k) => read(storage, k) !== null)
          if (live.length >= MAX_KEYS_PER_NAMESPACE) return false
        }
        storage.setItem(fullKey, raw)
        return true
      } catch {
        return false // cota do navegador estourada
      }
    },

    remove(key) {
      const storage = safeArea(area)
      if (!storage || !isValidKey(key)) return
      try {
        storage.removeItem(prefix + key)
      } catch {
        /* storage indisponível */
      }
    },

    keys() {
      const storage = safeArea(area)
      if (!storage) return []
      try {
        return ownKeys(storage)
          .filter((k) => read(storage, k) !== null)
          .map((k) => k.slice(prefix.length))
      } catch {
        return []
      }
    },

    clear() {
      const storage = safeArea(area)
      if (!storage) return
      try {
        for (const k of ownKeys(storage)) storage.removeItem(k)
      } catch {
        /* storage indisponível */
      }
    },
  }
}

function isValidKey(key: unknown): key is string {
  return typeof key === 'string' && KEY_PATTERN.test(key)
}

function safeArea(area: () => Storage | null): Storage | null {
  try {
    return area()
  } catch {
    return null
  }
}

/** Área em memória com a mesma interface do storage do navegador (DevKit e fallback de host antigo). */
export class MemoryStorageArea implements Storage {
  private readonly data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, String(value)) }
}

export function createMemoryWidgetStorage(): WidgetStorageBridge {
  const persistent = new MemoryStorageArea()
  const tab = new MemoryStorageArea()
  return createWidgetStorage((session) => (session ? tab : persistent))
}
