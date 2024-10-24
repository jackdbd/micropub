const onClick = async () => {
  const id = 'authorization-code-received'
  const el = document.getElementById(id)
  if (!el) {
    alert(`id ${id} not found on this page`)
    return
  }

  const code = el.innerText

  // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
  try {
    const id = 'code'
    await navigator.clipboard.writeText(code)
    const input = document.getElementById(id)
    if (input) {
      input.setAttribute('value', code)
    } else {
      alert(`id ${id} not found on this page`)
    }
  } catch (err) {
    console.error(err)
    alert(`could not write to clipboard: ${err.message}`)
  }
}

const main = () => {
  const id = 'copy-btn'
  const el = document.getElementById(id)
  if (el) {
    el.addEventListener('click', onClick)
  } else {
    alert(`id ${id} not found on this page`)
  }
}

main()
