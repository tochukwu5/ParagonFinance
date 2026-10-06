import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Renders `value` as a QR code and offers it as a PNG download.
//
// Always dark-on-white with a quiet-zone margin regardless of the page theme:
// phone cameras decode a light-on-dark code unreliably, and this one is
// meant to be scanned off a screen or printed.
export default function QrCode({ value, size = 220, filename = 'paragon-pay-qr', showDownload = true }) {
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!value) { setSrc(''); return }
    let cancelled = false
    setFailed(false)

    // 2x for sharpness on high-density screens and in the downloaded file.
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0D1117', light: '#FFFFFF' },
    })
      .then(url => { if (!cancelled) setSrc(url) })
      .catch(() => { if (!cancelled) setFailed(true) })

    return () => { cancelled = true }
  }, [value, size])

  if (failed) {
    return <p className="text-xs text-red-400">Couldn't generate the QR code.</p>
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-xl bg-white p-2"
        style={{ width: size + 16, height: size + 16 }}
      >
        {src && <img src={src} alt="QR code for payment link" width={size} height={size} />}
      </div>

      {showDownload && src && (
        <a
          href={src}
          download={filename + '.png'}
          className="text-xs text-[#00D4FF] hover:underline"
        >
          Download QR code
        </a>
      )}
    </div>
  )
}