"use client";

import Script from "next/script";

export default function LegacyScripts({ sources }) {
  return sources.map((source) => (
    <Script key={source} src={`/${source}`} strategy="afterInteractive" />
  ));
}
