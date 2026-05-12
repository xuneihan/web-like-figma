import {platform} from './platform.js'

const storageKey = 'liaison-color-mode'
const defaultColorMode = 'hex'

const colorOptions = [
  'hsl',
  'hex',
  'rgb',
  // 'hsv',
  // 'lch',
  // 'lab',
  // 'hcl',
  // 'cmyk',
  // 'gl',
  // 'as authored',
]

const colorModeState = {
  mode: defaultColorMode
}

const sendColorMode = async () => {
  const tabs = await platform.tabs.query({active: true, currentWindow: true})
  const tab = tabs ? tabs[0] : undefined
  if (!tab) return

  try {
    await platform.tabs.sendMessage(tab.id, {
      action: 'COLOR_MODE',
      params: {mode: colorModeState.mode},
    })
  } catch (_) {}
}

export const getColorMode = async () => {
  try {
    const value = await platform.storage.sync.get([storageKey])
    let foundValue = value ? value[storageKey] : undefined

    if (!foundValue) {
      foundValue = defaultColorMode
      await platform.storage.sync.set({[storageKey]: defaultColorMode})
    }

    if (foundValue === 'hsla') {
      foundValue = 'hsl'
      await platform.storage.sync.set({[storageKey]: foundValue})
    }
    if (foundValue === 'rgba') {
      foundValue = 'rgb'
      await platform.storage.sync.set({[storageKey]: foundValue})
    }

    colorOptions.forEach(option => {
      platform.contextMenus.update(option, {
        checked: option === foundValue
      }, () => { void platform.runtime.lastError })
    })

    colorModeState.mode = foundValue
    await sendColorMode()
    return foundValue
  } catch (e) {
    console.warn('getColorMode error:', e)
  }
}

// load synced color choice on load
getColorMode()

platform.runtime.onInstalled.addListener(() => {
  platform.contextMenus.create({
    id:     'color-mode',
    title:  'Colors',
    contexts: ['all'],
  })

  colorOptions.forEach(option => {
    platform.contextMenus.create({
      id:       option,
      parentId: 'color-mode',
      title:    ' '+option,
      checked:  false,
      type:     'radio',
      contexts: ['all'],
    })
  })
})

platform.contextMenus.onClicked.addListener(({parentMenuItemId, menuItemId}, tab) => {
  if (parentMenuItemId !== 'color-mode') return

  platform.storage.sync.set({[storageKey]: menuItemId})
  colorModeState.mode = menuItemId

  sendColorMode()
})
