const REMEMBER_ME_KEY = "teeshogs_remember_me"
const REMEMBER_EMAIL_KEY = "teeshogs_remember_email"

function canUseStorage() {
  return typeof window !== "undefined"
}

export function isRememberMeEnabled() {
  if (!canUseStorage()) return true
  return localStorage.getItem(REMEMBER_ME_KEY) !== "false"
}

export function getRememberedEmail() {
  if (!canUseStorage()) return ""
  return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? ""
}

export function setRememberPreference(remember: boolean, email?: string) {
  if (!canUseStorage()) return

  localStorage.setItem(REMEMBER_ME_KEY, remember ? "true" : "false")

  if (remember && email) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, email)
    return
  }

  localStorage.removeItem(REMEMBER_EMAIL_KEY)
}

function activeStore() {
  return isRememberMeEnabled() ? localStorage : sessionStorage
}

function inactiveStore() {
  return isRememberMeEnabled() ? sessionStorage : localStorage
}

export const authStorage = {
  getItem: (key: string) => {
    if (!canUseStorage()) return null
    return activeStore().getItem(key) ?? inactiveStore().getItem(key)
  },
  setItem: (key: string, value: string) => {
    if (!canUseStorage()) return
    activeStore().setItem(key, value)
    inactiveStore().removeItem(key)
  },
  removeItem: (key: string) => {
    if (!canUseStorage()) return
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}
