import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UploadPage from './pages/UploadPage'
import ImagePage from './pages/ImagePage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AlbumsPage from './pages/AlbumsPage'
import CreateAlbumPage from './pages/CreateAlbumPage'
import AlbumDetailPage from './pages/AlbumDetailPage'
import EditAlbumPage from './pages/EditAlbumPage'
import EditImagePage from './pages/EditImagePage'
import ActivityPage from './pages/ActivityPage'
import SearchPage from './pages/SearchPage'
import AdminPage from './pages/AdminPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import TagPage from './pages/TagPage'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="image/:id" element={<ImagePage />} />
            <Route path="user/:username" element={<ProfilePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="auth/callback" element={<AuthCallbackPage />} />
            <Route path="albums" element={<AlbumsPage />} />
            <Route path="albums/create" element={<CreateAlbumPage />} />
            <Route path="albums/:id" element={<AlbumDetailPage />} />
            <Route path="albums/:id/edit" element={<EditAlbumPage />} />
            <Route path="image/:id/edit" element={<EditImagePage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="tags/:tagSlug" element={<TagPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  </ErrorBoundary>
  )
}

export default App