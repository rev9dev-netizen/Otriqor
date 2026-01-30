// import { pdfToText } from "pdf-ts"; 
// For now, let's implement basic text/code parsing and placeholders for PDF.
// Using a naive implementation for MVP to avoid heavy deps if possible.

export async function parseFile(file: File): Promise<string> {
  const type = file.type;

  if (type === "application/pdf") {
    // Ideally use pdf-parse or similar on server
    // For MVP/Environment safety, we might just return a warning or try basic extraction if supported
    // Let's assume we can't easily parse PDF binary on Edge/Serverless without specific libs composed.
    // We will throw specifically or return empty for now.
    throw new Error("PDF parsing requires specific libraries. Upload text/md/code for now.");
  }

  // Text-based files
  if (
    type.startsWith("text/") || 
    type.includes("javascript") || 
    type.includes("typescript") || 
    type.includes("json") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".ts") ||
    file.name.endsWith(".tsx")
  ) {
    return await file.text();
  }

  throw new Error(`Unsupported file type: ${type}`);
}
