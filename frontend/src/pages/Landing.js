import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  MessageCircle, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Zap, 
  Award,
  CheckCircle2,
  ArrowRight,
  Star,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Landing() {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Outfit' }}>
                BharatVapari
              </span>
            </div>
            <Link to="/auth">
              <Button
                data-testid="nav-login-button"
                className="rounded-2xl px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
              >
                Get Started
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-6 border border-blue-200"
                whileHover={{ scale: 1.05 }}
              >
                <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span className="text-blue-700 font-semibold text-sm">India's #1 Startup Ecosystem</span>
              </motion.div>
              
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight"
                style={{ fontFamily: 'Outfit' }}
              >
                Where Indian{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Startups
                </span>{' '}
                Thrive
              </h1>
              
              <p className="text-xl leading-relaxed text-slate-600 mb-8 max-w-xl">
                Connect with top talent, experienced mentors, and endless opportunities. 
                Build the next big thing with India's most vibrant startup community.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link to="/auth">
                  <Button
                    data-testid="hero-get-started-button"
                    className="rounded-2xl px-8 py-7 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-2xl shadow-blue-500/40 hover:shadow-3xl hover:-translate-y-1 transition-all text-lg group"
                  >
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="rounded-2xl px-8 py-7 border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-700 font-semibold text-lg transition-all"
                >
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">10K+</div>
                  <div className="text-sm text-slate-600">Active Startups</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600 mb-1">50K+</div>
                  <div className="text-sm text-slate-600">Professionals</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">1K+</div>
                  <div className="text-sm text-slate-600">Mentors</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
                <img
                  src="https://images.unsplash.com/photo-1590650624342-f527904ca1b3"
                  alt="Startup team collaboration"
                  className="relative rounded-3xl shadow-2xl w-full"
                />
                
                {/* Floating cards */}
                <motion.div 
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-slate-200"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Success Rate</div>
                      <div className="text-lg font-bold text-slate-800">94%</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-slate-200"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Verified</div>
                      <div className="text-lg font-bold text-slate-800">Platform</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid - Bento Style */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-4 py-2 bg-blue-100 rounded-full mb-4">
              <span className="text-blue-700 font-semibold text-sm">PLATFORM FEATURES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Outfit' }}>
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Two powerful portals designed to accelerate your startup journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Hiring Portal - Large Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="md:row-span-2 p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Outfit' }}>
                  Hiring Portal
                </h3>
                <p className="text-blue-100 mb-6 leading-relaxed text-lg">
                  Build your dream team with AI-powered matching. Connect with top talent 
                  across India and scale your startup faster.
                </p>
                
                <div className="space-y-3 mb-8">
                  {[
                    'AI-powered candidate matching',
                    'Direct messaging & interviews',
                    'Application tracking system',
                    'Smart job recommendations'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>

                <img
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
                  alt="Technology platform"
                  className="rounded-2xl shadow-xl mt-6 opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </motion.div>

            {/* Mentorship Portal */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -8 }}
              className="p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-lg hover:shadow-2xl transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800" style={{ fontFamily: 'Outfit' }}>
                Mentorship Portal
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Learn from those who've walked the path. Connect with experienced mentors 
                to navigate your startup journey.
              </p>
              
              <div className="space-y-3">
                {[
                  'Verified expert mentors',
                  'Easy session booking',
                  'Secure payments',
                  '1-on-1 guidance'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Community Feature */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -8 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-2xl shadow-teal-500/20 relative overflow-hidden group"
            >
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full filter blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit' }}>
                  Real-Time Chat
                </h3>
                <p className="text-teal-100 leading-relaxed">
                  Instant messaging between startups, candidates, and mentors. 
                  Build relationships that matter.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Outfit' }}>
              Why Startups Choose Us
            </h2>
            <p className="text-xl text-slate-600">
              Built by founders, for founders
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Lightning Fast',
                description: 'Set up your profile and start connecting in minutes, not days',
                gradient: 'from-yellow-500 to-orange-500'
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: 'Precision Matching',
                description: 'AI-powered algorithms ensure you find the perfect fit every time',
                gradient: 'from-blue-500 to-indigo-500'
              },
              {
                icon: <Award className="w-8 h-8" />,
                title: 'Verified Quality',
                description: 'Every profile is verified. Connect with confidence and trust',
                gradient: 'from-purple-500 to-pink-500'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="p-8 rounded-3xl border-2 border-slate-200 hover:border-slate-300 bg-white shadow-lg hover:shadow-2xl transition-all"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 text-white shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800" style={{ fontFamily: 'Outfit' }}>
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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