"use client";

import { motion } from "framer-motion";
import { Search, FileCode2, CheckCircle2, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Analyze",
    description:
      "AI agents scan your project, detect your tech stack, framework, databases, and dependencies. Works with Node.js, Python, Go, and static sites.",
    command: "cloud-agent analyze",
  },
  {
    icon: FileCode2,
    step: "02",
    title: "Plan",
    description:
      "The deployment planner maps your project to optimal cloud services, estimates costs, and generates infrastructure commands.",
    command: "cloud-agent deploy --cloud aws",
  },
  {
    icon: CheckCircle2,
    step: "03",
    title: "Approve",
    description:
      "Review the generated plan with services, estimated costs, and commands. Approve to proceed, or use --dry-run to preview first.",
    command: "? Proceed with deployment? (y/N)",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Deploy",
    description:
      "Real cloud resources are created. ECS clusters, Cloud Run services, Container Apps. Get a live URL when it completes.",
    command: "URL: https://my-app.us-east-1.aws.com",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            How it works
          </h2>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl">
            Four phases from code to cloud. AI handles the complexity, you keep the control.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-white/5 bg-white/[0.015] p-7"
            >
              <div className="flex items-start gap-5">
                <span className="text-4xl font-bold text-white/[0.06] leading-none">
                  {s.step}
                </span>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2.5 mb-2">
                    <s.icon className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                    <h3 className="text-base font-semibold text-white">{s.title}</h3>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                    {s.description}
                  </p>
                  <code className="inline-block px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/5 text-xs font-mono text-neutral-500">
                    {s.command}
                  </code>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
