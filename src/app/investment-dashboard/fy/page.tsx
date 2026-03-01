"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FYPerformancePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/investment-dashboard");
  }, [router]);
  return null;
}
