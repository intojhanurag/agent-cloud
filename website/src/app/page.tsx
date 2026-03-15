import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Providers from "@/components/Providers";
import CLIShowcase from "@/components/CLIShowcase";
import Architecture from "@/components/Architecture";
import GetStarted from "@/components/GetStarted";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Providers />
      <CLIShowcase />
      <Architecture />
      <GetStarted />
      <Footer />
    </main>
  );
}
