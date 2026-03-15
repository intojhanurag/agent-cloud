"use client";

import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const steps = [
  { step: 1, command: "npm install -g agent-cloud", label: "Install" },
  { step: 2, command: "cloud-agent init", label: "Configure" },
  { step: 3, command: "cloud-agent analyze", label: "Analyze" },
  { step: 4, command: "cloud-agent deploy --cloud aws", label: "Deploy" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-neutral-600 hover:text-white transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function GetStarted() {
  return (
    <section id="get-started" className="relative py-32">
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Get started
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            Four commands from install to production.
          </p>
        </motion.div>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.015] p-4"
            >
              <div className="w-7 h-7 rounded-md bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-neutral-500">
                  {s.step}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-neutral-600 mb-0.5 font-medium uppercase tracking-wider">
                  {s.label}
                </div>
                <code className="text-sm font-mono text-neutral-300">
                  <span className="text-emerald-600">$</span> {s.command}
                </code>
              </div>
              <CopyButton text={s.command} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex gap-3"
        >
          <a
            href="/docs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-all text-sm"
          >
            Read the docs
          </a>
          <a
            href="https://github.com/intojhanurag/agent-cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-neutral-400 font-medium hover:bg-white/5 transition-all text-sm"
          >
            View on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
}
