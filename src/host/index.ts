import { HAVIX_HOST_VERSION } from './types'
import { mockCartBridge, mockAuthBridge, mockB2bBridge, mockToastBridge, mockApiBridge, mockStorageBridge } from './mocks'
import type {
  HavixCartBridge,
  HavixAuthBridge,
  HavixB2bBridge,
  HavixToastBridge,
  HavixApiBridge,
  HavixStorageBridge,
  HavixStorageScope,
} from './types'

export type {
  HavixCart,
  HavixCartLine,
  HavixCartBridge,
  HavixCustomer,
  HavixAuthBridge,
  HavixB2bCredit,
  HavixB2bBridge,
  HavixToastBridge,
  HavixToastVariant,
  HavixApiBridge,
  HavixPagedResponse,
  HavixProductSummary,
  HavixProductDetail,
  HavixVariant,
  HavixCategory,
  HavixReview,
  HavixOrderSummary,
  HavixOrderItem,
  HavixAddress,
  HavixQuote,
  HavixInvoice,
  HavixHostBridge,
  HavixStorageBridge,
  HavixStorageScope,
  HavixStorageSetOptions,
} from './types'

function getHost() {
  return typeof window !== 'undefined' ? window.__HAVIX_HOST__ : undefined
}

let versionChecked = false
function checkVersion() {
  if (versionChecked) return
  versionChecked = true
  const host = getHost()
  if (host && host.version !== HAVIX_HOST_VERSION) {
    console.warn(
      `[havix-host] Versão incompatível: widget espera v${HAVIX_HOST_VERSION}, ` +
      `host fornece v${host.version}. Alguns recursos podem não funcionar.`,
    )
  }
}

export function useHavixCart(): HavixCartBridge {
  checkVersion()
  return (getHost()?.cart as HavixCartBridge | undefined) ?? mockCartBridge
}

export function useHavixAuth(): HavixAuthBridge {
  checkVersion()
  return (getHost()?.auth as HavixAuthBridge | undefined) ?? mockAuthBridge
}

export function useHavixB2b(): HavixB2bBridge {
  checkVersion()
  return (getHost()?.b2b as HavixB2bBridge | undefined) ?? mockB2bBridge
}

export function useHavixToast(): HavixToastBridge {
  checkVersion()
  return (getHost()?.toast as HavixToastBridge | undefined) ?? mockToastBridge
}

export function useHavixApi(): HavixApiBridge {
  checkVersion()
  return (getHost()?.api as HavixApiBridge | undefined) ?? mockApiBridge
}

/**
 * Armazenamento do widget (substitui o acesso direto ao storage do navegador, que o analisador recusa).
 * O namespace isola as chaves deste widget: use um nome único, ex. o id do widget.
 *
 *   const storage = useHavixStorage('promo-bar')
 *   if (!storage.get<boolean>('dismissed')) show.value = true
 *   storage.set('dismissed', true, { ttlSeconds: 7 * 24 * 3600 })
 */
export function useHavixStorage(namespace: string, options?: { session?: boolean }): HavixStorageScope {
  checkVersion()
  const bridge = (getHost()?.storage as HavixStorageBridge | undefined) ?? mockStorageBridge
  return bridge.scope(namespace, options)
}
