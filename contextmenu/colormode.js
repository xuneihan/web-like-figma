const storagekey = 'liaison-color-mode'
const defaultcolormode = 'hex'

const color_options = [
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

const colormodestate = {
  mode: defaultcolormode
}

var platform = typeof browser === 'undefined'
  ? chrome
  : browser

const sendColorMode = () => {
  platform.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (platform.runtime.lastError) return;
    const tab = tabs ? tabs[0] : undefined;
    if (tab) {
      platform.tabs.sendMessage(tab.id, {
        action: 'COLOR_MODE',
        params: {mode:colormodestate.mode},
      }).catch(() => {})
    }
  })
}

export const getColorMode = () => {
  platform.storage.sync.get([storagekey], value => {
    if (platform.runtime.lastError) {
      console.warn('getColorMode error:', platform.runtime.lastError)
      return
    }

    let found_value = value ? value[storagekey] : undefined

    const is_default = found_value
      ? found_value === defaultcolormode
      : false

    // first run
    if (!found_value && !is_default) {
      found_value = defaultcolormode
      platform.storage.sync.set({[storagekey]: defaultcolormode})
    }

    // migrate old choices
    if (found_value === 'hsla') {
      found_value = 'hsl'
      platform.storage.sync.set({[storagekey]: found_value})
    }
    if (found_value === 'rgba') {
      found_value = 'rgb'
      platform.storage.sync.set({[storagekey]: found_value})
    }

    // update checked state of color contextmenu radio list
    color_options.forEach(option => {
      platform.contextMenus.update(option, {
        checked: option === found_value
      }, () => { void platform.runtime.lastError })
    })

    // send liaison user preference
    colormodestate.mode = found_value
    sendColorMode()

    return found_value
  })
}

// load synced color choice on load
getColorMode()

platform.runtime.onInstalled.addListener(() => {
  platform.contextMenus.create({
    id:     'color-mode',
    title:  'Colors',
    contexts: ['all'],
  })

  color_options.forEach(option => {
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

  platform.storage.sync.set({[storagekey]: menuItemId})
  colormodestate.mode = menuItemId

  sendColorMode()
})
