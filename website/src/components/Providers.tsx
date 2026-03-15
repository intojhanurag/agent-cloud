"use client";

import { motion } from "framer-motion";

const providers = [
  {
    name: "Amazon Web Services",
    short: "AWS",
    services: [
      "ECS Fargate",
      "Lambda",
      "S3 + CloudFront",
      "CloudWatch",
      "IAM",
      "VPC",
    ],
    description:
      "Deploy containerized apps to ECS, serverless functions to Lambda, and static sites to S3 with CloudFront CDN.",
  },
  {
    name: "Google Cloud Platform",
    short: "GCP",
    services: [
      "Cloud Run",
      "Cloud Functions",
      "Firebase Hosting",
      "App Engine",
      "Cloud Storage",
      "Cloud Build",
    ],
    description:
      "Container deployments on Cloud Run, serverless with Cloud Functions, and static hosting via Firebase.",
  },
  {
    name: "Microsoft Azure",
    short: "Azure",
    services: [
      "Container Apps",
      "Azure Functions",
      "Static Web Apps",
      "App Service",
      "Blob Storage",
      "Resource Groups",
    ],
    description:
      "Modern container apps, serverless functions, static web apps, and PaaS deployments with automatic resource groups.",
  },
];

export default function Providers() {
  return (
    <section id="providers" className="relative py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            One CLI, three clouds
          </h2>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl">
            Same commands, same workflow. Switch providers with a single flag.
            No vendor lock-in.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {providers.map((p, i) => (
            <motion.div
              key={p.short}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-white/5 bg-white/[0.015] overflow-hidden"
            >
              <div className="p-6">
                <span className="inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/8 text-xs font-bold text-neutral-300 tracking-wide">
                  {p.short}
                </span>
                <h3 className="text-lg font-semibold text-white mt-4">
                  {p.name}
                </h3>
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="px-6 pb-3">
                <div className="text-[11px] text-neutral-600 uppercase tracking-wider mb-2.5 font-medium">
                  Services
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.services.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-xs text-neutral-500"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6 pt-3">
                <code className="block w-full px-3 py-2 rounded-md bg-white/[0.02] border border-white/5 text-xs font-mono text-neutral-600">
                  <span className="text-emerald-600">$</span> cloud-agent deploy
                  --cloud {p.short.toLowerCase()}
                </code>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
