import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-100">
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
    </div>
  );
};

export default LandingPage;
