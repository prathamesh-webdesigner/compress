"use client";

import { useEffect } from "react";
import { Tool } from "@/types/tool";
import { ImageCompressorTool } from "./ImageCompressorTool";
import { PdfCompressorTool } from "./PdfCompressorTool";
import { ImageConverterTool } from "./ImageConverterTool";
import { ImageResizerTool } from "./ImageResizerTool";
import { ImageToPdfTool } from "./ImageToPdfTool";
import { SmartImageCompressorTool } from "./SmartImageCompressorTool";
import { ImageUpscalerTool } from "./ImageUpscalerTool";
import { trackEvent } from "@/lib/analytics";

export function ToolRunner({ tool }: { tool: Tool }) {
  useEffect(() => {
    trackEvent("tool_opened", { tool_slug: tool.slug });
  }, [tool.slug]);

  switch (tool.engine) {
    case "image-target-size":
    case "image-custom-size":
      return <ImageCompressorTool tool={tool} />;
    case "pdf-target-size":
      return <PdfCompressorTool tool={tool} />;
    case "image-convert":
      return <ImageConverterTool tool={tool} />;
    case "image-resize":
      return <ImageResizerTool tool={tool} />;
    case "image-to-pdf":
      return <ImageToPdfTool tool={tool} />;
    case "image-smart-compress":
      return <SmartImageCompressorTool tool={tool} />;
    case "image-upscale":
      return <ImageUpscalerTool tool={tool} />;
    default:
      return null;
  }
}
