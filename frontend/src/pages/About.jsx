import { HiLightBulb, HiAcademicCap, HiChip, HiUserGroup } from "react-icons/hi";

export default function About() {
  return (
    <div className="min-h-screen bg-white fade-in">
      
      {/* Hero */}
      <div className="bg-secondary-900 text-white py-20 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Building the Future of Engineering</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">
          Empowering students, makers, and innovators with premium IoT resources.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose max-w-none text-secondary-700">
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">Our Mission</h2>
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
            desc="Every project is tested, verified, and built with industry-standard components." 
          />
          <ValueCard 
            icon={HiAcademicCap} 
            title="Education First" 
            desc="Designed to help you learn, understand, and master complex systems easily." 
          />
          <ValueCard 
            icon={HiLightBulb} 
            title="Innovation" 
            desc="Cutting-edge projects ranging from basic automation to advanced AI robotics." 
          />
          <ValueCard 
            icon={HiUserGroup} 
            title="Community" 
            desc="Join thousands of engineers building the next generation of technology." 
          />
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon: Icon, title, desc }) {
  return (
    <div className="p-6 bg-secondary-50 rounded-xl border border-secondary-100 hover:shadow-md transition-all">
      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <h3 className="text-xl font-semibold text-secondary-900 mb-2">{title}</h3>
      <p className="text-secondary-600">{desc}</p>
    </div>
  );
}