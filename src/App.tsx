import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import WhatsAppButton from './components/WhatsAppButton'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Pricing from './pages/Pricing'
import Tutors from './pages/Tutors'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import DashboardLayout from './pages/dashboard/Layout'
import Overview from './pages/dashboard/Overview'
import Nets from './pages/dashboard/Nets'
import Assignments from './pages/dashboard/Assignments'
import Topics from './pages/dashboard/Topics'
import ManageTopics from './pages/dashboard/ManageTopics'
import ManageAssignments from './pages/dashboard/ManageAssignments'
import Students from './pages/dashboard/Students'
import StudentDetail from './pages/dashboard/StudentDetail'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-full flex flex-col bg-gradient-to-b from-indigo-50/40 via-white to-white">
        <Header />
        <ScrollToTop />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hizmetler" element={<Services />} />
            <Route path="/hizmetler/:slug" element={<ServiceDetail />} />
            <Route path="/fiyatlar" element={<Pricing />} />
            <Route path="/egitmenler" element={<Tutors />} />
            <Route path="/iletisim" element={<Contact />} />
            <Route path="/giris" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/panel" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="netler" element={<Nets />} />
                <Route path="odevler" element={<Assignments />} />
                <Route path="konu-takibi" element={<Topics />} />
                <Route path="ogrenciler" element={<Students />} />
                <Route path="ogrenciler/:id" element={<StudentDetail />} />
                <Route path="yonetim/konular" element={<ManageTopics />} />
                <Route path="yonetim/odevler" element={<ManageAssignments />} />
              </Route>
            </Route>
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <WhatsAppButton />
        <Toaster position="top-right" />
        <Footer />
      </div>
    </QueryClientProvider>
  )
}

export default App
