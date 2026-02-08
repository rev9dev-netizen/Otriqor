import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || "",
});

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const response = await client.embeddings.create({
      model: "mistral-embed",
      inputs: texts,
    });

    return response.data.map(item => item.embedding as number[]);
  } catch (error) {
    console.error("Mistral Embedding Error:", error);
    throw error;
  }
}
