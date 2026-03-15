"use client";

import { motion } from "framer-motion";

const commands = [
  {
    name: "init",
    description: "Set up API keys, cloud CLI detection, and preferences",
    usage: "cloud-agent init",
    flags: [],
  },
  {
    name: "analyze",
    description: "Analyze your project and get cloud recommendations",
    usage: "cloud-agent analyze",
    flags: ["--ai", "--local", "--path <dir>"],
  },
  {
    name: "deploy",
    description: "Deploy your application to any cloud provider",
    usage: "cloud-agent deploy --cloud aws",
    flags: [
      "--cloud <provider>",
      "--yes",
      "--app-name <name>",
      "--port <number>",
      "--image <image>",
      "--build-dir <dir>",
      "--dry-run",
    ],
  },
  {
    name: "status",
    description: "Check if your environment is ready for deployment",
    usage: "cloud-agent status --cloud gcp",
    flags: ["--cloud <provider>"],
  },
  {
    name: "logs",
    description: "View logs from your deployed services",
    usage: "cloud-agent logs --cloud aws --service my-app",
    flags: ["--cloud <provider>", "--service <name>", "--lines <n>"],
  },
  {
    name: "cleanup",
    description: "Remove previously deployed cloud resources",
    usage: "cloud-agent cleanup",
    flags: ["--cloud <provider>"],
  },
  {
    name: "history",
    description: "Show your deployment history and stats",
    usage: "cloud-agent history",
    flags: [],
  },
];

export default function CLIShowcase() {
  return (
    <section id="cli" className="relative py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            CLI commands
          </h2>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl">
            Every command you need from init to cleanup. Built with Commander.js
            for a polished terminal experience.
          </p>
        </motion.div>

        <div className="rounded-xl border border-white/5 overflow-hidden divide-y divide-white/5">
          {commands.map((cmd, i) => (
            <motion.div
              key={cmd.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="bg-white/[0.01] hover:bg-white/[0.025] transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3 p-5">
                <div className="md:w-28 shrink-0">
                  <code className="px-2.5 py-1 rounded-md bg-white/5 border border-white/8 text-white text-sm font-mono font-medium">
                    {cmd.name}
                  </code>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-400">{cmd.description}</p>
                </div>
                <div className="shrink-0">
                  <code className="text-xs font-mono text-neutral-600 bg-white/[0.02] px-3 py-1.5 rounded-md border border-white/5">
                    <span className="text-emerald-600">$</span> {cmd.usage}
                  </code>
                </div>
              </div>
              {cmd.flags.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-1.5 md:pl-[calc(7rem+1.25rem)]">
                  {cmd.flags.map((f) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 rounded text-[11px] font-mono text-neutral-600 bg-white/[0.02] border border-white/5"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
