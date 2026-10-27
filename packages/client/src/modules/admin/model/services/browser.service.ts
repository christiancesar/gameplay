/** Browser APIs the admin ViewModels need, kept out of the ViewModels so specs can replace them. */
async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

function downloadTextFile(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export { copyText, downloadTextFile }
