import { HAVIX_HOST_VERSION } from './types'
import { mockCartBridge, mockAuthBridge, mockB2bBridge, mockToastBridge, mockApiBridge } from './mocks'
import type {
  HavixCartBridge,
  HavixAuthBridge,
  HavixB2bBridge,
  HavixToastBridge,
  HavixApiBridge,
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
