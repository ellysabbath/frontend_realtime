import { Link } from 'react-router-dom'
import {
  MapPin,
  MessageCircle,
  Shield,
  Zap,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star,
  Clock,
  Smartphone,
  Phone,
} from 'lucide-react'
import Button from '../components/ui/Button'

export default function LandingPage() {
  // Official WhatsApp click-to-chat link (removed the + sign for the URL)
  const whatsappUrl = 'https://wa.me/255742578691?text=Hello%20tApp%20Support,%20I%20need%20help%20with%20the%20app.'

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-lg">
              t
            </div>
            <span className="font-bold text-slate-900 text-lg">tApp</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</a>
            <a href="#how" className="text-sm font-medium text-slate-600 hover:text-slate-900">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Contact Us - WhatsApp */}
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                <Phone size={14} className="text-green-600" />
                <span className="text-slate-700">Contact Us</span>
              </Button>
            </a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold mb-6">
              <Zap size={14} />
              On-demand vehicle assistance
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              Vehicle trouble? <br />
              <span className="text-gradient">We come to you.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-lg">
              tApp connects you with verified vehicle technicians anywhere in Tanzania. Track them live, chat in-app, and pay only for what you need. Fast, fair, and reliable.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" variant="primary">
                  Request a Technician
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline">
                  Become a Technician
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-8">
              <div>
                <p className="text-3xl font-bold text-slate-900">2,500+</p>
                <p className="text-sm text-slate-500 mt-1">Jobs Completed</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <p className="text-3xl font-bold text-slate-900">500+</p>
                <p className="text-sm text-slate-500 mt-1">Verified Technicians</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <p className="text-3xl font-bold text-slate-900">4.9★</p>
                <p className="text-sm text-slate-500 mt-1">Average Rating</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">D</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Technician</p>
                    <p className="text-xs text-slate-500">Technician • 4.9★</p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500 pulse-dot" />
              </div>
              <div className="h-40 rounded-2xl bg-gradient-to-br from-brand-50 to-slate-100 relative overflow-hidden mb-4">
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-6 h-6 rounded-full bg-brand-600 border-4 border-white shadow-lg pulse-dot" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Estimated arrival</p>
                    <p className="text-sm font-bold text-slate-900">6 min • 2.1 km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Cost</p>
                    <p className="text-sm font-bold text-brand-600">2,100 TZS</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold flex items-center justify-center gap-2">
                  <MessageCircle size={16} /> Chat
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold">
                  Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900">Everything you need</h2>
            <p className="mt-4 text-lg text-slate-600">
              Powerful features for customers, technicians, and garage owners.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MapPin, title: 'Live Tracking', desc: 'Watch your technician approach in real time on the map.', color: 'blue' },
              { icon: MessageCircle, title: 'In-App Chat', desc: 'Chat with typing indicators and online status.', color: 'green' },
              { icon: DollarSign, title: 'Fair Pricing', desc: 'Transparent cost at 1,000 TZS per km. No hidden fees.', color: 'orange' },
              { icon: Shield, title: 'Verified Experts', desc: 'All technicians are vetted and certified.', color: 'purple' },
              { icon: Zap, title: 'Instant Response', desc: 'Request a technician in under 30 seconds.', color: 'blue' },
              { icon: Clock, title: '24/7 Available', desc: 'Emergency assistance day or night.', color: 'green' },
            ].map((f, i) => (
              <div key={i} className="group p-6 bg-white rounded-2xl border border-slate-200/60 hover:shadow-xl hover:border-brand-200 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-${f.color}-50 text-${f.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={24} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900">How it works</h2>
            <p className="mt-4 text-lg text-slate-600">Three simple steps to get back on the road.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Smartphone, title: 'Make a Request', desc: 'Create an account with your phone number, describe your vehicle issue, and set your location.' },
              { step: '02', icon: MapPin, title: 'Track Your Technician', desc: 'Watch the technician approach on the live map and chat with them in-app.' },
              { step: '03', icon: CheckCircle, title: 'Get Fixed & Pay', desc: 'Once fixed, pay securely. Download your invoice for reference.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-black text-slate-100 mb-4">{s.step}</div>
                <div className="w-14 h-14 rounded-2xl gradient-brand text-white flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
                  <s.icon size={26} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section id="pricing" className="py-24 px-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #f97316 0%, transparent 50%)'
        }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to get help on the road?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of drivers who trust tApp. No subscription. Pay only for the service you need.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="accent">
                Get Started Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" className="bg-white/10 text-white border border-white/20 hover:bg-white/20">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-slate-400 text-sm">1,000 TZS per km • No hidden fees • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold">t</div>
                <span className="font-bold text-white text-lg">tApp</span>
              </div>
              <p className="text-sm leading-relaxed">On-demand vehicle technician platform for Tanzania and beyond.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how" className="hover:text-white">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                {/* Contact Us in Footer */}
                <li>
                  <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-green-400 flex items-center gap-2 transition-colors"
                  >
                    <Phone size={14} /> Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2024 tApp. All rights reserved.</p>
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm">Rated 4.9 by 500+ users</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}