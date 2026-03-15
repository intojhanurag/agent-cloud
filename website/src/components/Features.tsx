"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  Zap,
  GitBranch,
  Terminal,
  Cloud,
  Eye,
  FileCode,
  BarChart3,
  Lock,
  Layers,
  RefreshCcw,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Three specialized agents analyze your project, plan deployments, and validate your environment.",
  },
  {
    icon: Cloud,
    title: "Multi-Cloud Support",
    description:
      "Deploy to AWS, Google Cloud, or Azure. One CLI, three clouds. Switch providers with a single flag.",
  },
  {
    icon: Eye,
    title: "Human-in-the-Loop",
    description:
      "Review AI-generated plans before execution. Approve, modify, or reject. You stay in control.",
  },
  {
    icon: Terminal,
    title: "CLI-First Design",
    description:
      "Built with Commander.js. Interactive prompts, spinners, and clean terminal output.",
  },
  {
    icon: Shield,
    title: "Security Hardened",
    description:
      "Shell injection prevention on every exec call. Command allowlists and path traversal protection.",
  },
  {
    icon: Zap,
    title: "Zero-Config Deploy",
    description:
      "Auto-detects runtime, framework, and dependencies. Generates Dockerfiles for Node.js, Python, and Go.",
  },
  {
    icon: FileCode,
    title: "Dockerfile Generation",
    description:
      "No Dockerfile? Automatically generates optimized multi-stage builds for your stack.",
  },
  {
    icon: BarChart3,
    title: "Cost Estimation",
    description:
      "Get estimated monthly costs before deploying. Compare pricing across all three providers.",
  },
  {
    icon: GitBranch,
    title: "Deployment History",
    description:
      "Track every deployment with full history. View URLs, resources, costs, and durations.",
  },
  {
    icon: Lock,
    title: "Credential Safety",
    description:
      "Uses your existing cloud CLI credentials. No tokens stored. Works with SSO and MFA.",
  },
  {
    icon: Layers,
    title: "Dry Run Mode",
    description:
      "Preview the entire plan without creating resources. Perfect for CI/CD pipelines.",
  },
  {
    icon: RefreshCcw,
    title: "Easy Cleanup",
    description:
      "Remove all deployed resources with a single command. Select specific deployments to tear down.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Everything you need to ship
          </h2>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl">
            From project analysis to production deployment, agent-cloud handles
            the complexity so you can focus on building.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="bg-black p-7 hover:bg-white/[0.02] transition-colors"
            >
              <f.icon className="w-5 h-5 text-neutral-500 mb-4" strokeWidth={1.5} />
              <h3 className="text-[15px] font-semibold text-white mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
