const onSubmit = (event) => {
  event.preventDefault()

  const scope = Array.from(
    document.querySelectorAll('input[name="scope"]:checked')
  )
    .map((cb) => cb.value)
    .join('+')

  const hiddens = Array.from(
    document.querySelectorAll('input[type="hidden"]')
  ).map((cb) => {
    return { name: cb.name, value: cb.value }
  })

  const qs = hiddens.reduce((acc, cv) => {
    return `${acc}&${cv.name}=${encodeURIComponent(cv.value)}`
  }, `scope=${scope}`)

  window.location.href = `${event.target.action}?${qs}`
}

const main = () => {
  const id = 'auth-form'
  const form = document.getElementById('auth-form')
  if (form) {
    form.addEventListener('submit', onSubmit, { aaa: 'foo' })
  } else {
    alert(`id ${id} not found on this page`)
  }
}

main()
