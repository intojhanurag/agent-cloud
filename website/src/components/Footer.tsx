"use client";

import { Terminal } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-white/10 border border-white/10 flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-semibold text-white">
                agent cloud
              </span>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              AI-powered cloud deployment CLI.<br />
              Deploy to AWS, GCP, or Azure.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-neutral-400 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {[
                { href: "#features", label: "Features" },
                { href: "#providers", label: "Cloud Providers" },
                { href: "#cli", label: "CLI Commands" },
                { href: "#get-started", label: "Get Started" },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-neutral-600 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-neutral-400 mb-4">Documentation</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/docs", label: "Introduction" },
                { href: "/docs/guides/quickstart", label: "Quick Start" },
                { href: "/docs/reference/deploy", label: "Deploy Reference" },
                { href: "/docs/advanced/architecture", label: "Architecture" },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-neutral-600 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-neutral-400 mb-4">Community</h4>
            <ul className="space-y-2.5">
              {[
                { href: "https://github.com/intojhanurag/agent-cloud", label: "GitHub", ext: true },
                { href: "https://github.com/intojhanurag/agent-cloud/issues", label: "Issues", ext: true },
                { href: "/docs/contributing", label: "Contributing", ext: false },
                { href: "https://www.npmjs.com/package/agent-cloud", label: "npm", ext: true },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    {...(l.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-sm text-neutral-600 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-neutral-700">
            &copy; {new Date().getFullYear()} Agent Cloud. MIT License.
          </p>
        </div>
      </div>
    </footer>
  );
}
