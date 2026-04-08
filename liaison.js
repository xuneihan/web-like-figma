import {gimmeToggle} from "./contextmenu/launcher.js"
import {getColorMode} from "./contextmenu/colormode.js"
import {getColorScheme} from "./contextmenu/colorscheme.js"

const state = {
  loaded:   {},
  injected: {},
}

var platform = typeof browser === 'undefined'
  ? chrome
  : browser

const toggleIn = async ({id:tab_id}) => {
  // toggle out: it's currently loaded and injected
  if (state.loaded[tab_id] && state.injected[tab_id]) {
    await platform.scripting.executeScript({
      target: {tabId: tab_id},
      files: ['/toolbar/eject.js'],
    })
    state.injected[tab_id] = false
  }

  // toggle in: it's loaded and needs injected
  else if (state.loaded[tab_id] && !state.injected[tab_id]) {
    await platform.scripting.executeScript({
      target: {tabId: tab_id},
      files: ['/toolbar/restore.js'],
    })
    state.injected[tab_id] = true
    getColorMode()
    getColorScheme()
  }

  // fresh start in tab
  else {
    try {
      await platform.scripting.insertCSS({
        target: {tabId: tab_id},
        files: ['/toolbar/bundle.css' ],
      })
      try {
        await platform.scripting.executeScript({
          target: {tabId: tab_id},
          world: 'MAIN',
          func: () => {
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
              try {
                window.trustedTypes.createPolicy('default', {
                  createHTML: function(s) { return s; },
                  createScript: function(s) { return s; },
                  createScriptURL: function(s) { return s; }
                });
              } catch (e) {}
            }
          }
        });
      } catch (e) {}

      await platform.scripting.executeScript({
        target: {tabId: tab_id},
        files: ['/toolbar/inject.js'],
      })

      state.loaded[tab_id]    = true
      state.injected[tab_id]  = true
      getColorMode()
      getColorScheme()
    } catch (e) {
      console.warn("Liaison could not inject to this tab:", e)
    }
  }

  platform.tabs.onUpdated.addListener(function(tabId) {
    if (tabId === tab_id)
      state.loaded[tabId] = false
  })
}

gimmeToggle(toggleIn)
