"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Terminal } from "lucide-react";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#providers", label: "Providers" },
  { href: "#cli", label: "CLI" },
  { href: "https://agent-cloud-5o86.vercel.app", label: "Docs" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            agent cloud
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://github.com/intojhanurag/agent-cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
          >
            GitHub
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-neutral-400 hover:text-white"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/5"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
