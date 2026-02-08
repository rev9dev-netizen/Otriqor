import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const logosDir = path.join(process.cwd(), "public", "model-logo");
    
    if (!fs.existsSync(logosDir)) {
      return NextResponse.json({ logos: [] });
    }

    const files = fs.readdirSync(logosDir);
    
    // valid image extensions
    const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
    
    const logos = files
      .filter(file => validExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => ({
        filename: file,
        path: `/model-logo/${file}`,
        // Extract key for matching (e.g. "deepseek-color" -> "deepseek")
        key: file.split("-")[0].split(".")[0].toLowerCase()
      }));

    return NextResponse.json({ logos });
  } catch (error) {
    console.error("Error reading logo directory:", error);
    return NextResponse.json({ error: "Failed to load logos" }, { status: 500 });
  }
}
