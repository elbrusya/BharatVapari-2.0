import { Link } from 'react-router-dom';
import { Briefcase, Users, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-amber-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
                BharatVapari
              </span>
            </div>
            <Link to="/auth">
              <Button
                data-testid="nav-login-button"
                className="rounded-full px-8 py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-48 md:pb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-4 py-2 bg-amber-100 rounded-full mb-6">
                <span className="text-amber-700 font-medium text-sm">INDIA'S #1 STARTUP PLATFORM</span>
              </div>
              <h1
                className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                style={{ fontFamily: 'Outfit' }}
              >
                Connect,{' '}
                <span className="gradient-text">Hire</span>,{' '}
                <span className="gradient-text">Grow</span>
              </h1>
              <p className="text-lg leading-relaxed text-slate-600 mb-8">
                The ultimate platform for Indian startups to find talent, connect with mentors, and
                build the next big thing. Join thousands of entrepreneurs, job seekers, and
                mentors.
              </p>
              <div className="flex gap-4">
                <Link to="/auth">
                  <Button
                    data-testid="hero-get-started-button"
                    className="rounded-full px-8 py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg"
                  >
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1734519614079-f8ac6ac540bd"
                alt="Startup team collaboration"
                className="rounded-3xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4" style={{ fontFamily: 'Outfit' }}>
            Two Powerful Portals
          </h2>
          <p className="text-lg text-slate-600">Everything you need to succeed in one platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Hiring Portal Card */}
          <motion.div
            whileHover={{ y: -8 }}
            className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
              <Briefcase className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Outfit' }}>
              Hiring Portal
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Post jobs, discover talent, and build your dream team. AI-powered matching ensures
              you find the perfect candidates for your startup.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-slate-700">Smart job matching with AI</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-slate-700">Direct chat with candidates</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-slate-700">Application tracking system</span>
              </li>
            </ul>
          </motion.div>

          {/* Mentorship Portal Card */}
          <motion.div
            whileHover={{ y: -8 }}
            className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Outfit' }}>
              Mentorship Portal
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Connect with experienced mentors who've been there. Get guidance, feedback, and
              support to take your startup to the next level.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-slate-700">Expert mentor profiles</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-slate-700">Easy session booking</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-slate-700">Integrated payments</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="gradient-bg rounded-3xl p-12 md:p-16 text-center">
          <MessageCircle className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>
            Start Building Today
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the vibrant community of Indian startups. Whether you're hiring, seeking
            mentorship, or looking for your next opportunity.
          </p>
          <Link to="/auth">
            <Button
              data-testid="cta-join-button"
              className="rounded-full px-10 py-7 bg-white hover:bg-slate-100 text-indigo-600 font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-lg"
            >
              Join BharatVapari
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-600">
          <p>© 2024 BharatVapari. Built for the Indian startup ecosystem.</p>
        </div>
      </footer>
    </div>
  );
}