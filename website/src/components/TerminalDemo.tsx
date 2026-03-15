"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const lines = [
  { text: "$ cloud-agent deploy --cloud aws", color: "text-white", delay: 0 },
  { text: "", color: "", delay: 0.3 },
  { text: "  Phase 1: Validating environment...", color: "text-neutral-600", delay: 0.6 },
  { text: "  \u2713 Environment validated", color: "text-emerald-500", delay: 1.2 },
  { text: "", color: "", delay: 1.3 },
  { text: "  Phase 2: Analyzing project...", color: "text-neutral-600", delay: 1.5 },
  { text: "  \u2713 Analyzed: node api (express)", color: "text-emerald-500", delay: 2.2 },
  { text: "", color: "", delay: 2.3 },
  { text: "  Phase 3: Generating deployment plan...", color: "text-neutral-600", delay: 2.5 },
  { text: "  \u2713 Plan generated: $12.50/month", color: "text-emerald-500", delay: 3.2 },
  { text: "", color: "", delay: 3.3 },
  { text: "  Services: ECS Fargate, CloudWatch", color: "text-neutral-400", delay: 3.5 },
  { text: "  Estimated Cost: $12.50 /month", color: "text-neutral-400", delay: 3.7 },
  { text: "", color: "", delay: 3.8 },
  { text: "  ? Proceed with this deployment? Yes", color: "text-amber-500", delay: 4.0 },
  { text: "", color: "", delay: 4.1 },
  { text: "  Phase 5: Deploying to AWS...", color: "text-neutral-600", delay: 4.3 },
  { text: "  \u2713 Cluster created: my-app-cluster", color: "text-emerald-500", delay: 5.0 },
  { text: "  \u2713 Service deployed: my-app-service", color: "text-emerald-500", delay: 5.5 },
  { text: "", color: "", delay: 5.6 },
  { text: "  Deployment completed successfully!", color: "text-white", delay: 6.0 },
  { text: "  URL: http://3.91.45.122:3000", color: "text-neutral-400", delay: 6.3 },
];

export default function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-xl border border-white/8 bg-[#090909] overflow-hidden glow">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        </div>
        <span className="text-[11px] text-neutral-600 font-mono ml-2">
          terminal
        </span>
      </div>

      <div className="p-5 font-mono text-[13px] leading-relaxed h-[420px] overflow-hidden">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={`${line.color} ${line.text === "" ? "h-3" : ""}`}
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines < lines.length && (
          <span className="inline-block w-2 h-4 bg-white/60 cursor-blink" />
        )}
      </div>
    </div>
  );
}
