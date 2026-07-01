import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { 
  HiMail, 
  HiPhone, 
  HiLocationMarker, 
  HiChat, 
  HiArrowRight,
  HiShieldCheck,
  HiCreditCard 
} from "react-icons/hi";
import { FaInstagram, FaFacebook, FaLinkedin, FaYoutube } from "react-icons/fa"; // Standard social icons

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useContext(AuthContext);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
  
    const email = newsletterEmail.trim();
  
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
  
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
  
    toast.success("Thanks! Newsletter signup will be available soon.");
    setNewsletterEmail("");
  };

  return (
    <footer className="bg-surface-lowest text-outline mt-auto border-t border-surface-variant">
      
      {/* ========= CTA SECTION (For Visitors Only) ========= */}
      {!user && (
        <div className="relative bg-surface border-b border-surface-variant">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Need help choosing a project?</h3>
                <p className="text-outline text-sm">Our engineering team is available 24/7 to assist you.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="https://wa.me/919705594777"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
                >
                  <HiChat className="w-5 h-5" /> WhatsApp
                </a>
                <Link
                  to="/support"
                  className="px-5 py-2.5 rounded-lg bg-surface-high hover:bg-surface-highest text-white text-sm font-medium flex items-center gap-2 transition-all border border-surface-variant"
                >
                  Contact Support <HiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* 1. Brand & Description */}
          <div className="space-y-4">
{/* Replace Logo Section with this: */}
<Link to="/" className="flex items-center gap-2 group">
  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.35)] group-hover:scale-105 transition-transform">
    {/* Microchip Icon */}
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  </div>
              <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
</Link>
            <p className="text-outline text-sm leading-relaxed">
              India's #1 Marketplace for IoT, Embedded Systems, and Robotics projects. 
              Get production-ready code, circuit diagrams, and expert support.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4 pt-2">
              {[
                { icon: FaInstagram, link: "https://www.instagram.com/inovitaz/" },
                { icon: FaFacebook, link: "#" },
                { icon: FaLinkedin, link: "#" },
                { icon: FaYoutube, link: "https://www.youtube.com/@inovitaz/" }
              ].map((social, idx) => (
                <a 
                  key={idx}
                  href={social.link}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-high hover:bg-primary text-outline hover:text-white transition-all duration-300"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/projects" className="hover:text-primary-400 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span> Browse Projects</Link></li>
              <li><Link to="/projects?category=IoT" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-dim"></span> IoT Solutions</Link></li>
              <li><Link to="/projects?category=Robotics" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-dim"></span> Robotics</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-dim"></span> About Us</Link></li>
            </ul>
          </div>

          {/* 3. Legal & Account */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">Account</h3>
            <ul className="space-y-3 text-sm">
              {user ? (
                <>
                  <li><Link to="/dashboard" className="hover:text-primary-400 transition-colors">My Dashboard</Link></li>
                  {/* <li><Link to="/dashboard" className="hover:text-primary-400 transition-colors">Order History</Link></li> */}
                </>
              ) : (
                <>
                  <li><Link to="/login" className="hover:text-primary-400 transition-colors">Login</Link></li>
                  <li><Link to="/signup" className="hover:text-primary-400 transition-colors">Register</Link></li>
                </>
              )}
              <li><Link to="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund" className="hover:text-primary-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* 4. Newsletter & Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">Stay Updated</h3>
            <form
              onSubmit={handleNewsletterSubmit}
              className="bg-surface p-1 rounded-lg flex mb-6 border border-surface-variant"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-transparent text-sm text-white px-3 py-2 w-full focus:outline-none placeholder-outline"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dim text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Join
              </button>
            </form>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <HiLocationMarker className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>Thullur, Andhra Pradesh,<br />India - 522237</span>
              </div>
              <div className="flex items-center gap-3">
                <HiPhone className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <a href="tel:+919705594777" className="hover:text-white">+91 9705594777</a>
              </div>
              <div className="flex items-center gap-3">
                <HiMail className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <a href="mailto:inovitaz.help@gmail.com" className="hover:text-white">inovitaz.help@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-surface-variant flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-outline text-center md:text-left">
            © {currentYear} <span className="text-white font-medium">Inovitaz</span>. All Rights Reserved.
          </p>
          
          {/* Payment Trust Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-outline text-xs">
              <HiShieldCheck className="w-4 h-4 text-green-500" />
              <span>100% Secure Payment</span>
            </div>
            <div className="h-4 w-px bg-surface-variant"></div>
            <div className="flex items-center gap-2 text-outline">
              <HiCreditCard className="w-6 h-6" title="Credit/Debit Card" />
              <span className="font-bold text-xs tracking-wider">UPI</span>
              <span className="font-bold text-xs tracking-wider">Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;