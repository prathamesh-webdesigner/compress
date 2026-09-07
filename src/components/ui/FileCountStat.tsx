"use client";

import { useEffect, useState } from "react";
import { FILE_COUNT_UPDATED_EVENT, getFileCount } from "@/lib/fileCounter";

export function FileCountStat() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => setCount(getFileCount());
    updateCount();
    window.addEventListener(FILE_COUNT_UPDATED_EVENT, updateCount);
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener(FILE_COUNT_UPDATED_EVENT, updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  return <>{count} files</>;
}