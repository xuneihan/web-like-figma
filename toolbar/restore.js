var restore = () => {
  if (document.querySelector('liaison-app')) return
  const liaison = document.createElement('liaison-app')
  document.body.prepend(liaison)
}

restore()
