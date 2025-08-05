import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { twinData, personalityTemplate, originalProfile } = await req.json();

  if (!twinData || !personalityTemplate) {
    return NextResponse.json({ error: 'Missing required data for persona generation.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key is not configured on the server.' }, { status: 500 });
  }

  // Prepare the data for persona generation
  const twinMetadata = twinData._twin_metadata || {};
  const personaProfile = personalityTemplate.fullPersona || {};
  
  // Create a comprehensive prompt for persona generation
  const prompt = `
You are an expert in creating detailed, realistic digital personas based on survey data and personality profiles. 

I have an AI twin that was created from a real panelist with the following characteristics:

**Personality Template Applied**: ${personalityTemplate.label}
- Description: ${personalityTemplate.description}
- Psychology: ${personaProfile.psychology || 'Not specified'}
- Behavior: ${personaProfile.behavior || 'Not specified'}
- Decision Making: ${personaProfile.decisionMaking || 'Not specified'}
- Communication Style: ${personaProfile.communication || 'Not specified'}
- Lifestyle: ${personaProfile.lifestyle || 'Not specified'}

**Survey Response Modifications Applied**:
${twinMetadata.response_modifications || 'Standard personality-based modifications applied'}

**Sample Modified Responses** (showing how the AI twin differs from the original):
${JSON.stringify(twinData, null, 2).substring(0, 1500)}...

Based on this information, please create a comprehensive, engaging persona description that:

1. Synthesizes the personality template with the survey responses
2. Creates a vivid, relatable character description
3. Explains how this person would likely behave in different situations
4. Describes their motivations, preferences, and decision-making patterns
5. Makes them feel like a real, three-dimensional person

The description should be 2-3 paragraphs long, written in a narrative style that brings this digital persona to life. Focus on making them feel authentic and believable while clearly reflecting the ${personalityTemplate.label} personality traits.

Return your response as a JSON object with the following structure:
{
  "persona_description": "Your detailed persona description here",
  "key_traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "likely_behaviors": ["behavior1", "behavior2", "behavior3"],
  "decision_factors": ["factor1", "factor2", "factor3"]
}
`;

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert persona researcher and character developer. You create detailed, realistic digital personas that feel authentic and three-dimensional. You have deep understanding of personality psychology and how it manifests in real-world behavior and decision-making."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
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
      console.error('OpenAI API error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    const jsonResponse = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(jsonResponse, { status: 200 });

  } catch (error) {
    console.error("Error calling OpenAI API for persona generation:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
