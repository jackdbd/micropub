const onSubmit = (event) => {
  event.preventDefault()

  const scope = Array.from(
    document.querySelectorAll('input[name="scope"]:checked')
  )
    .map((elem) => elem.value)
    .join('+')

  const hiddens = Array.from(
    document.querySelectorAll('input[type="hidden"]')
  ).map((elem) => {
    return { name: elem.name, value: elem.value }
  })

  const qs = hiddens.reduce((acc, cv) => {
    return `${acc}&${cv.name}=${encodeURIComponent(cv.value)}`
  }, `action=${event.submitter.value}&scope=${scope}`)

  //   const url = event.target.action
  const url = event.target.attributes.action.value
  window.location.href = `${url}?${qs}`
}

const main = () => {
  const id = 'consent-form'
  const form = document.getElementById(id)
  if (form) {
    form.addEventListener('submit', onSubmit, { once: true, passive: false })
  } else {
    alert(`id ${id} not found on this page`)
  }
}

main()
