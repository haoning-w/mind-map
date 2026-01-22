"use client";

import dynamic from "next/dynamic";

const MindMap = dynamic(
  () => import("@/components/MindMap").then((mod) => mod.MindMap),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="h-screen w-screen bg-gray-100">
      <MindMap />
    </main>
  );
}
