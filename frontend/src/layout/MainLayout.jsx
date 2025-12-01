import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#071226] text-slate-100">
      <Navbar />
      <main className="flex-1 container mx-auto px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
