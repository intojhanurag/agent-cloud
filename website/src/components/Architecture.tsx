"use client";

import { motion } from "framer-motion";
import { Bot, Wrench, Server } from "lucide-react";

const layers = [
  {
    icon: Bot,
    title: "AI Agents",
    subtitle: "Mastra Framework",
    items: [
      { name: "Analyzer Agent", desc: "Scans projects, detects stack" },
      { name: "Deployment Agent", desc: "Plans infrastructure, estimates costs" },
      { name: "Validator Agent", desc: "Checks CLI, auth, permissions" },
    ],
  },
  {
    icon: Wrench,
    title: "Workflow Engine",
    subtitle: "5-Phase Pipeline",
    items: [
      { name: "Validate", desc: "Environment readiness check" },
      { name: "Analyze + Plan", desc: "Project scan and service mapping" },
      { name: "Approve + Deploy", desc: "Human gate then real execution" },
    ],
  },
  {
    icon: Server,
    title: "Cloud Providers",
    subtitle: "Real Infrastructure",
    items: [
      { name: "AWS Provider", desc: "ECS, Lambda, S3, CloudFront" },
      { name: "GCP Provider", desc: "Cloud Run, Functions, Firebase" },
      { name: "Azure Provider", desc: "Container Apps, Functions, Static" },
    ],
  },
];

export default function Architecture() {
  return (
    <section className="relative py-32">
      <div className="absolute inset-0 grid-pattern" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Architecture
          </h2>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl">
            Three clean layers: AI agents for intelligence, a workflow engine
            for orchestration, and cloud providers for execution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-xl border border-white/5 bg-white/[0.015] overflow-hidden"
            >
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <layer.icon className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {layer.title}
                    </h3>
                    <p className="text-xs text-neutral-600">{layer.subtitle}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3.5">
                {layer.items.map((item) => (
                  <div key={item.name} className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-neutral-700 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-300">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
