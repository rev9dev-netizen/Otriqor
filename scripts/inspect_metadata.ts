/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";

async function checkMistral() {
    const key = process.env.MISTRAL_API_KEY;
    if (!key) { console.log("Skipping Mistral (No Key)"); return; }
    
    console.log("Checking Mistral API...");
    try {
        const res = await fetch("https://api.mistral.ai/v1/models", {
            headers: { "Authorization": `Bearer ${key}` }
        });
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            console.log("Mistral Model [0]:", JSON.stringify(data.data[0], null, 2));
        }
    } catch (e) { console.error("Mistral Error:", e); }
}

async function checkOpenAI() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) { console.log("Skipping OpenAI (No Key)"); return; }

    console.log("Checking OpenAI API...");
    try {
        const res = await fetch("https://api.openai.com/v1/models", {
            headers: { "Authorization": `Bearer ${key}` }
        });
        const data = await res.json();
        const model = data.data.find((m: any) => m.id.includes("gpt-4"));
        console.log("OpenAI Model (GPT-4 sample):", JSON.stringify(model || data.data[0], null, 2));
    } catch (e) { console.error("OpenAI Error:", e); }
}

async function run() {
    await checkMistral();
    await checkOpenAI();
}

run();
