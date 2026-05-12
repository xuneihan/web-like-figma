import {platform} from './platform.js'

const schemeStorageKey = 'liaison-color-scheme'
const defaultColorScheme = 'auto'

const schemeOptions = [
  'auto',
  'light',
  'dark',
]

const colorSchemeState = {
  mode: defaultColorScheme
}

const sendColorScheme = async () => {
  const tabs = await platform.tabs.query({active: true, currentWindow: true})
  const tab = tabs ? tabs[0] : undefined
  if (!tab) return

  try {
    await platform.tabs.sendMessage(tab.id, {
      action: 'COLOR_SCHEME',
      params: {mode: colorSchemeState.mode},
    })
  } catch (_) {}
}

export const getColorScheme = async () => {
  try {
    const value = await platform.storage.sync.get([schemeStorageKey])
    let foundValue = value ? value[schemeStorageKey] : undefined

    if (!foundValue) {
      foundValue = defaultColorScheme
      await platform.storage.sync.set({[schemeStorageKey]: defaultColorScheme})
    }

    schemeOptions.forEach(option => {
      platform.contextMenus.update(option, {
        checked: option === foundValue
      }, () => { void platform.runtime.lastError })
    })

    colorSchemeState.mode = foundValue
    await sendColorScheme()
    return foundValue
  } catch (e) {
    console.warn('getColorScheme error:', e)
  }
}

// load synced scheme choice on load
getColorScheme()

platform.runtime.onInstalled.addListener(() => {
  platform.contextMenus.create({
    id:     'color-scheme',
    title:  'Theme',
    contexts: ['all'],
  })

  schemeOptions.forEach(option => {
    platform.contextMenus.create({
      id:       option,
      parentId: 'color-scheme',
      title:    ' '+option,
      checked:  false,
      type:     'radio',
      contexts: ['all'],
    })
  })
})

platform.contextMenus.onClicked.addListener(({parentMenuItemId, menuItemId}, tab) => {
  if (parentMenuItemId !== 'color-scheme') return

  platform.storage.sync.set({[schemeStorageKey]: menuItemId})
  colorSchemeState.mode = menuItemId

  sendColorScheme()
})
