import { HiLightBulb, HiAcademicCap, HiChip, HiUserGroup } from "react-icons/hi";

export default function About() {
  return (
    <div className="min-h-[100dvh] fade-in">
      
      {/* Hero */}
      <div className="text-white py-20 text-center px-6 border-b border-surface-variant">
        <div className="t-label text-primary-dim mb-3">About us</div>
        <h1 className="t-h1 text-white mb-4">Building the Future of Engineering</h1>
        <p className="text-outline text-lg max-w-2xl mx-auto">
          Empowering students, makers, and innovators with premium IoT resources.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose max-w-none text-outline">
          <h2 className="t-h2 text-white mb-4">Our Mission</h2>
          <p className="text-lg leading-relaxed mb-8">
            Inovitaz Innovations Pvt. Ltd. was built with a single mission — to make high-quality
            engineering and IoT project resources accessible, affordable, and ready for real-world implementation.
            We bridge the gap between theory and practical application.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <ValueCard 
            icon={HiChip} 
            title="Premium Quality" 
            desc="Projects are built with industry-standard components and documented for real-world assembly." 
          />
          <ValueCard 
            icon={HiAcademicCap} 
            title="Education First" 
            desc="Designed to help you learn, understand, and master complex systems easily." 
          />
          <ValueCard 
            icon={HiLightBulb} 
            title="Innovation" 
            desc="From basic automation to advanced robotics — pick your next build from the catalog." 
          />
          <ValueCard 
            icon={HiUserGroup} 
            title="Community" 
            desc="Join the makers building the next generation of technology." 
          />
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon: Icon, title, desc }) {
  return (
    <div className="p-6 bg-surface rounded-xl border border-surface-variant hover:border-primary-dim/40 transition-colors">
      <div className="w-12 h-12 icon-tile icon-tile-blue rounded-xl mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-outline">{desc}</p>
    </div>
  );
}