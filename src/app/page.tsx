import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-forest-light text-forest-deep">
      {/* Navigation Taskbar */}
      <nav className="bg-forest-deep text-forest-light p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 bg-forest-mid rounded-full flex items-center justify-center text-forest-deep text-sm">C</span>
            Chatty
          </div>
          <div className="hidden md:flex space-x-8 font-medium">
            <Link href="#mission" className="hover:text-forest-mid transition">Mission</Link>
            <Link href="#features" className="hover:text-forest-mid transition">Features</Link>
            <Link href="#contact" className="hover:text-forest-mid transition">Contact</Link>
          </div>
          <div className="flex space-x-4">
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 text-sm font-semibold hover:text-forest-mid transition"
            >
              Log In
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-4 py-2 bg-forest-mid text-forest-deep rounded-full text-sm font-bold hover:bg-forest-dark hover:text-forest-light transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-forest-dark text-forest-light overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-forest-mid rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-24 w-64 h-64 bg-forest-light rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
            Redefining Language <br/>
            <span className="text-forest-mid">Learning Online.</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Chatty isn't just another app. We're a lush ecosystem where language 
            enthusiasts connect, grow, and flourish through natural conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/auth/signup"
              className="bg-forest-mid text-forest-deep px-10 py-4 rounded-full font-black text-xl hover:bg-forest-light transition shadow-2xl"
            >
              Start Growing Now
            </Link>
            <Link
              href="#mission"
              className="bg-transparent border-2 border-forest-light text-forest-light px-10 py-4 rounded-full font-bold text-xl hover:bg-forest-light hover:text-forest-dark transition"
            >
              Our Roots
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-forest-dark text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                At Chatty, we believe that languages are like trees in a forest—they thrive best when they are part of a connected network. Traditional learning is often isolated and dry. We are here to change that.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our platform is designed to facilitate organic growth by connecting you with mentors who guide your path and peers who share your journey. We don't just teach words; we foster connections that make those words meaningful.
              </p>
            </div>
            <div className="bg-forest-light p-12 rounded-3xl border-2 border-forest-mid relative">
              <div className="absolute -top-6 -left-6 bg-forest-dark text-white p-4 rounded-xl shadow-xl rotate-3">
                100% Organic Learning
              </div>
              <h3 className="text-2xl font-bold text-forest-deep mb-4 italic">"Redefining what it means to be fluent."</h3>
              <p className="text-forest-dark opacity-80">— The Chatty Philosophy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-forest-light/30">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-forest-dark text-4xl font-bold mb-4">The Chatty Ecosystem</h2>
          <p className="text-xl text-forest-deep opacity-70">A complete environment for linguistic growth.</p>
        </div>
        
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { 
              title: "Mentor Networks", 
              desc: "Connect with certified teachers who act as the strong trunks supporting your growth.",
              icon: "🌳"
            },
            { 
              title: "Peer Pollination", 
              desc: "Talk with fellow learners to share knowledge and strengthen your conversational roots.",
              icon: "🐝"
            },
            { 
              title: "Lush Content", 
              desc: "Explore a library of resources that adapt to your specific learning stage.",
              icon: "🍃"
            }
          ].map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-forest-mid/20 hover:border-forest-mid transition hover:shadow-xl group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition duration-300">{f.icon}</div>
              <h3 className="text-xl font-bold text-forest-deep mb-4">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 bg-forest-deep text-forest-light">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Plant a Seed</h2>
            <p className="text-forest-mid">Have questions? We'd love to hear from you.</p>
          </div>
          
          <form className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-forest-dark/50 p-8 rounded-3xl backdrop-blur-sm">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 opacity-80">Your Name</label>
                <input type="text" className="w-full bg-forest-deep border border-forest-mid rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-forest-mid transition" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 opacity-80">Email Address</label>
                <input type="email" className="w-full bg-forest-deep border border-forest-mid rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-forest-mid transition" placeholder="john@example.com" />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-2 opacity-80">Message</label>
              <textarea className="flex-1 w-full bg-forest-deep border border-forest-mid rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-forest-mid transition mb-6" placeholder="Tell us something..."></textarea>
              <button className="bg-forest-mid text-forest-deep font-bold py-4 rounded-xl hover:bg-forest-light transition">Send Message</button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-forest-dark text-forest-mid text-center border-t border-forest-deep">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-bold text-forest-light">Chatty</div>
          <div className="flex space-x-8 text-sm">
            <Link href="#" className="hover:text-forest-light transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-forest-light transition">Terms of Service</Link>
          </div>
          <div className="text-xs opacity-50">
            &copy; 2026 Chatty. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
