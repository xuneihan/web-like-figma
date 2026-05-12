import {platform} from './platform.js'

var toggleIt

export const gimmeToggle = toggleIn => {
  toggleIt = toggleIn
  platform.action.onClicked.addListener(toggleIt)
}

platform.runtime.onInstalled.addListener(() => {
  platform.contextMenus.create({
    id:     'launcher',
    title:  'Show/Hide',
    contexts: ['all'],
  })
})

platform.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
  if (menuItemId === 'launcher' && toggleIt)
    toggleIt(tab)
})
