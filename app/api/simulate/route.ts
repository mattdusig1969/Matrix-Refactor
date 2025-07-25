import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Ensure this is a POST request
  if (req.method !== 'POST') {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: 'POST' },
    });
  }

  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is missing in the request body.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key is not configured on the server.' }, { status: 500 });
  }

  const payload = {
    model: "gpt-4o", // A powerful model suitable for this task
    messages: [
      {
        role: "system",
        content: "You are an AI expert in creating realistic user personas and simulating survey responses. Your goal is to generate diverse and believable answers based on a defined target audience. You must respond in the valid JSON format requested by the user."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }, // Enforce JSON output
    temperature: 0.8, // Add some creativity to the responses
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Forward the error from OpenAI's API
      return NextResponse.json(data, { status: response.status });
    }

    // The actual response content is a JSON string inside the 'content' field
    const jsonResponse = JSON.parse(data.choices[0].message.content);

    // Send the parsed JSON object back to the front-end
    return NextResponse.json(jsonResponse, { status: 200 });

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}