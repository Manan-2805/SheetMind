import DashboardSpotlight from '@/components/landing/DashboardSpotlight'
import ExcelEditorSpotlight from '@/components/landing/ExcelEditorSpotlight'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HeroSection from '@/components/landing/HeroSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import PrivacySection from '@/components/landing/PrivacySection'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ExcelEditorSpotlight />
      <DashboardSpotlight />
      <PrivacySection />
      <Footer />
    </div>
  )
}
