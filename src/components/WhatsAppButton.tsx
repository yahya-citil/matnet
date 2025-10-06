export default function WhatsAppButton() {
  const phone = '905555555555' // örnek; gerçek numara ile değiştirilebilir
  const text = encodeURIComponent('Merhaba, MatematikNET hakkında bilgi almak istiyorum.')
  const href = `https://wa.me/${phone}?text=${text}`
  return (
    <a
      aria-label="WhatsApp ile iletişime geç"
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M12 2a9.93 9.93 0 0 0-8.84 5.46A10 10 0 0 0 3 17.25L2 22l4.87-1a10 10 0 0 0 15-8.67A10.23 10.23 0 0 0 12 2m5.2 14.36c-.22.62-1.28 1.2-1.78 1.25c-.46.05-1.06.07-1.7-.11c-.39-.12-.9-.3-1.55-.58c-2.73-1.18-4.5-3.94-4.63-4.12c-.13-.18-1.11-1.48-1.11-2.82s.7-2-1.29-2.7c.33-.08.7-.1 1.1-.1c.13 0 .25 0 .36.01c.32.02.49.03.7.55c.27.66.93 2.28 1 2.44c.08.16.13.35.03.53c-.1.18-.15.28-.3.44c-.15.16-.3.36-.43.49c-.14.13-.3.27-.14.54c.16.27.7 1.15 1.5 1.86c1.03.92 1.9 1.2 2.17 1.34c.27.13.43.11.6-.06c.17-.17.7-.81.88-1.09c.18-.27.37-.23.62-.14c.25.1 1.61.76 1.88.9c.27.14.45.21.51.33c.06.12.06.69-.16 1.31Z" />
      </svg>
    </a>
  )
}

