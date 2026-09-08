"use client";

import { useEffect, useState } from "react";
import { FILE_COUNT_UPDATED_EVENT, getFileCount } from "@/lib/fileCounter";

export function FileCountStat() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      void getFileCount().then(setCount);
    };
    updateCount();
    window.addEventListener(FILE_COUNT_UPDATED_EVENT, updateCount);

    return () => {
      window.removeEventListener(FILE_COUNT_UPDATED_EVENT, updateCount);
    };
  }, []);

  return <>{count} files</>;
}