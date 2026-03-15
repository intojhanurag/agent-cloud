"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import TerminalDemo from "./TerminalDemo";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 grid-pattern" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          {/* Left */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-neutral-400 text-xs font-medium mb-8">
                Open source CLI tool
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] text-white"
            >
              Deploy to any cloud
              <br />
              <span className="text-neutral-500">with one command</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-neutral-500 max-w-lg leading-relaxed"
            >
              AI agents analyze your project, generate deployment plans, and
              ship to AWS, GCP, or Azure. You approve before anything runs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-3"
            >
              <a
                href="#get-started"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-medium transition-all hover:bg-neutral-200"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="/docs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-neutral-300 font-medium hover:bg-white/5 transition-all"
              >
                Documentation
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8"
            >
              <code className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm font-mono text-neutral-400">
                <span className="text-emerald-500">$</span>
                npm install -g agent-cloud
              </code>
            </motion.div>
          </div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 w-full max-w-2xl"
          >
            <TerminalDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
