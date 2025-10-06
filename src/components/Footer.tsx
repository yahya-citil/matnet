export default function Footer() {
  return (
    <footer className="border-t border-indigo-100/60 bg-white">
      <div className="container py-8 text-sm text-gray-600 flex items-center justify-between">
        <p>© {new Date().getFullYear()} MatematikNET</p>
        <p className="opacity-80">Basit, hızlı, sonuç odaklı.</p>
      </div>
    </footer>
  )
}

