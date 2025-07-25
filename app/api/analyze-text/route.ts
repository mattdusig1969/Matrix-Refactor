import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
  }

  const { answers } = await req.json();

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Answers are missing or not in the correct format.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
  }

  const prompt = `
    Analyze the following list of open-ended survey responses.
    
    Responses:
    ---
    ${answers.map((ans, i) => `${i + 1}. "${ans}"`).join('\n')}
    ---

    Based on all the responses, perform two tasks:
    1.  Identify the top 20-30 most relevant and frequent single keywords. Exclude common stop words.
    2.  For EACH of the ${answers.length} responses, suggest 2-4 relevant "codes" or "tags" that categorize the main themes of that specific answer.

    Your response MUST be a single, valid JSON object with two keys: "keywords" and "codes".
    - "keywords" must be an array of objects, where each object has a "text" (string) and "value" (number) key, like [{"text": "travel", "value": 15}].
    - "codes" must be an array of arrays, where each inner array contains the string codes for the corresponding original response. The order must be preserved. For example: [["travel", "family"], ["budget", "food"], ...].
  `;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert data analyst specializing in qualitative survey data. Your job is to extract keywords and thematically code responses accurately."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    const jsonResponse = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(jsonResponse, { status: 200 });

  } catch (error) {
    console.error("Error in /api/analyze-text:", error);
    return NextResponse.json({ error: "An internal server error occurred during analysis." }, { status: 500 });
  }
}