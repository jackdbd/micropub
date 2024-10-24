const onClick = async () => {
  const el = document.getElementById('code-block')

  if (!el) {
    return
  }

  const code = el.innerText

  // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
  try {
    await navigator.clipboard.writeText(code)
    alert(`Authorization code copied to clipboard`)
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  //   console.log(`=== auth success ===`)

  const el = document.getElementById('copy-btn')
  if (el) {
    el.addEventListener('click', onClick)
  }
}

main()
