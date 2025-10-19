import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css"; 
import { assets } from "../assets/assets";

const features = [
  {
    title: "Daily Free Quizzes",
    description:
      "Enjoy a new set of quizzes every day, absolutely free. Expand your knowledge effortlessly.",
    icon: (
      <svg className="lp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3v3h6v-3c0-1.657-1.343-3-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
  },
  {
    title: "Track Your Progress",
    description:
      "Monitor your performance and see how you’re improving over time. Set personal goals and achieve them.",
    icon: (
      <svg className="lp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4m0 0l3-3m-3 3L9 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Compete with Friends",
    description:
      "Challenge your friends and see who comes out on top. Make learning fun and competitive.",
    icon: (
      <svg className="lp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h.01M12 12h.01M9 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    name: "Fathima.",
    role: "Artist/Learner",
    quote:
      "SmartTrivia has become my daily ritual! The quizzes are so diverse and engaging. I've learned so much in such a fun way.",
    bgClass: "lp-t1",
    image: "/Fathima.svg",
  },
  {
    name: "Rizwan.",
    role: "Quiz Enthusiast",
    quote:
      "Competing with my friends on SmartTrivia is a blast. The friendly competition keeps us all sharp and connected.",
    bgClass: "lp-t2",
    image: "/Rizwan.svg",
  },
  {
    name: "Jessica P.",
    role: "Dedicated Student",
    quote:
      "I love how I can track my progress. It's so motivating to see my knowledge grow over time. Highly recommend!",
    bgClass: "lp-t3",
    image: "/Jessica.svg",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const goLogin = () => navigate("/login");

  return (
    <div className="lp-wrap">
      <header className="lp-header">
        <div className="lp-brand">
          <img src={assets?.logo2 || "/logo.png"} alt="SmartTrivia" className="lp-logo" />
          <span className="lp-brand-text">SMART-TRIVIA</span>
        </div>
        <button className="lp-btn ghost" onClick={goLogin}>Login</button>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-text">
          <h1>Test Your Knowledge with SmartTrivia</h1>
          <p>
            Engage in a variety of quizzes, from general knowledge to niche topics.
            Challenge yourself and learn something new every day.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn primary" onClick={goLogin}>Start Quiz</button>
          </div>
        </div>
        <div className="lp-hero-art">
          <img
            src="/landing-illustration.png"
            alt="Learning Illustration"
            className="lp-hero-img"
          />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2>Why Choose SmartTrivia?</h2>
          <p>Discover the benefits of using SmartTrivia for your daily dose of knowledge and fun.</p>
        </div>
        <div className="lp-features">
          {features.map((f, i) => (
            <div key={i} className="lp-feature-card">
              <div className="lp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section narrow">
        <h2 className="lp-center">What Our Users Say</h2>
        <div className="lp-testimonials">
          {testimonials.map((t, i) => (
            <div key={i} className={`lp-test-card ${t.bgClass}`}>
              <img src={t.image} alt={t.name} className="lp-test-avatar" />
              <p className="lp-test-quote">“{t.quote}”</p>
              <p className="lp-test-name">{t.name}</p>
              <p className="lp-test-role">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Ready to Get Started?</h2>
        <p>Join SmartTrivia today and start your journey of learning and fun.</p>
        <button className="lp-btn light" onClick={goLogin}>Sign Up Now</button>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <img src={assets?.logo2 || "/logo.png"} alt="SmartTrivia" className="lp-logo-sm" />
          <span>SMART-TRIVIA</span>
        </div>
        <div className="lp-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
        <p className="lp-copy">© 2025 SmartTrivia. All rights reserved.</p>
      </footer>
    </div>
  );
}
