export function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
  if (!text) return [];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;

    // If we are not at the end of the text, try to find a natural break point (newline or space)
    if (endIndex < text.length) {
      // Look for the last newline within the last 20% of the chunk to respect paragraphs
      const lookback = Math.floor(maxChunkSize * 0.2);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      
      if (lastNewline > endIndex - lookback) {
        endIndex = lastNewline;
      } else {
         // Fallback to space
         const lastSpace = text.lastIndexOf(' ', endIndex);
         if (lastSpace > endIndex - lookback) {
           endIndex = lastSpace;
         }
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start index for next chunk, subtract overlap
    startIndex = endIndex - overlap;
    
    // Safety check to prevent infinite loop if overlap >= distinct chunk size
    if (startIndex >= endIndex) {
        startIndex = endIndex;
    }
  }

  return chunks;
}
