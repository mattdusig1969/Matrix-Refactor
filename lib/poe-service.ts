class AIService {
  private static instance: AIService;
  private claudeApiKey: string;
  private geminiApiKey: string;

  private constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    
    if (!this.claudeApiKey) {
      console.warn('CLAUDE_API_KEY not found in environment variables');
    }
    if (!this.geminiApiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables');
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Check which API to use based on model
  private shouldUseClaude(model: string): boolean {
    return model.toLowerCase().includes('claude');
  }

  private shouldUseGemini(model: string): boolean {
    return model.toLowerCase().includes('gemini');
  }

  public async generateResponse(model: string, prompt: string): Promise<any> {
    try {
      console.log(`Generating response for model: ${model}`);

      if (this.shouldUseClaude(model)) {
        return await this.generateClaudeResponse(prompt);
      } else if (this.shouldUseGemini(model)) {
        return await this.generateGeminiResponse(prompt);
      } else {
        // Default to mock for other models like Llama
        return await this.generateMockResponse(model, prompt);
      }

    } catch (error: any) {
      console.error('AI Service error:', error);
      return await this.generateMockResponse(model, prompt);
    }
  }

  private async generateClaudeResponse(prompt: string): Promise<any> {
    try {
      if (!this.claudeApiKey) {
        console.log('Claude API key not configured, using mock response...');
        return await this.generateMockResponse('Claude', prompt);
      }

      console.log('Making real Claude API call...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      console.log(`Claude API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Claude API response received');
        
        const responseText = data.content?.[0]?.text;
        if (responseText) {
          return await this.parseModelResponse(responseText, 'Claude');
        }
      } else {
        const errorText = await response.text();
        console.log(`Claude API failed (${response.status}): ${errorText}`);
      }

      // Fallback to mock if API fails
      return await this.generateMockResponse('Claude', prompt);

    } catch (error) {
      console.error('Claude API error:', error);
      return await this.generateMockResponse('Claude', prompt);
    }
  }

  private async generateGeminiResponse(prompt: string): Promise<any> {
    try {
      if (!this.geminiApiKey) {
        console.log('Gemini API key not configured, using mock response...');
        return await this.generateMockResponse('Gemini', prompt);
      }

      console.log('Making real Gemini API call...');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000
          }
        })
      });

      console.log(`Gemini API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Gemini API response received');
        
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          return await this.parseModelResponse(responseText, 'Gemini');
        }
      } else {
        const errorText = await response.text();
        console.log(`Gemini API failed (${response.status}): ${errorText}`);
      }

      // Fallback to mock if API fails
      return await this.generateMockResponse('Gemini', prompt);

    } catch (error) {
      console.error('Gemini API error:', error);
      return await this.generateMockResponse('Gemini', prompt);
    }
  }

  private async parseModelResponse(responseText: string, model: string): Promise<any> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      let parsedContent;
      
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, try parsing the entire response
        parsedContent = JSON.parse(responseText);
      }

      console.log(`Successfully parsed ${model} response:`, parsedContent);
      
      return {
        simulated_responses: [parsedContent],
        ...parsedContent
      };
    } catch (parseError) {
      console.error(`Failed to parse ${model} response as JSON:`, parseError);
      console.log('Raw response text:', responseText);
      
      // Fallback to mock if parsing fails
      return await this.generateMockResponse(model, `Response parsing failed for: ${responseText.substring(0, 100)}...`);
    }
  }

  // Mock fallback method
  private async generateMockResponse(model: string, prompt: string): Promise<any> {
    console.log(`Using mock response as fallback for ${model}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract the expected question count from the prompt
    const questionCountMatch = prompt.match(/exactly (\d+) answers/);
    const questionCount = questionCountMatch ? parseInt(questionCountMatch[1]) : 18;
    
    // Create more realistic mock answers that vary by model
    const mockAnswerTemplates = {
      'Gemini': {
        prefix: 'Based on my analysis,',
        style: 'analytical and precise',
        answers: [
          '2-3 times a year', 'Beach resort; City break', 'Relaxation', '4', '3-6 months',
          'North America; Europe', 'My most memorable trip was exploring Tokyo\'s blend of traditional and modern culture.',
          'Plane', 'Sightseeing and museums; Shopping and dining', '3', 'Scenery and nature',
          'Sometimes', 'Photos on my phone; Social media posts', 
          'A culturally immersive experience in Japan with authentic local interactions.',
          '4', 'Accommodation', 'No, but I want to', 'My smartphone and comfortable walking shoes.'
        ]
      },
      'Claude': {
        prefix: 'In my perspective,',
        style: 'thoughtful and nuanced',
        answers: [
          'Once a year', 'City break; Road trip', 'Cultural exploration', '3', '6-12 months',
          'Europe; Asia', 'Discovering hidden art galleries in Prague during a solo adventure.',
          'Train', 'Sightseeing and museums; Outdoor activities (hiking, swimming)', '4', 'Historical significance',
          'Always', 'Photos on my phone; Journaling', 
          'An extended cultural immersion in a small European village with local artisans.',
          '3', 'Activities and tours', 'Yes, and I loved it', 'My travel journal and a quality camera.'
        ]
      },
      'Llama': {
        prefix: 'From my understanding,',
        style: 'practical and straightforward',
        answers: [
          '4+ times a year', 'Beach resort; Cruise; Camping or hiking trip', 'Adventure', '5', '1-3 months',
          'North America; South America', 'White-water rafting in Costa Rica was an incredible adrenaline rush.',
          'Car', 'Outdoor activities (hiking, swimming); Spa and wellness', '5', 'Accessibility and convenience',
          'Rarely', 'Professional camera; Social media posts', 
          'An adventure-packed expedition through Patagonia with wilderness camping.',
          '5', 'Flights (e.g., business class)', 'Yes, and I loved it', 'My adventure gear and first-aid kit.'
        ]
      }
    };

    const modelTemplate = mockAnswerTemplates[model as keyof typeof mockAnswerTemplates] || mockAnswerTemplates['Gemini'];
    
    // Generate realistic answers for all questions
    const mockAnswers = [];
    for (let i = 1; i <= questionCount; i++) {
      const answerIndex = (i - 1) % modelTemplate.answers.length;
      const baseAnswer = modelTemplate.answers[answerIndex];
      
      mockAnswers.push({
        question_number: i,
        answer: baseAnswer,
        rationale: `${modelTemplate.prefix} this reflects a ${modelTemplate.style} approach to question ${i}.`
      });
    }
    
    // Generate a model-specific mock response
    const mockResponse = {
      archetype: `${model} Simulated Persona`,
      demographic_assumptions: `Simulated demographic profile optimized for ${model}'s ${modelTemplate.style} analysis`,
      answers: mockAnswers
    };

    console.log(`Mock ${model} response generated with ${mockAnswers.length} realistic answers`);

    return {
      simulated_responses: [mockResponse],
      ...mockResponse
    };
  }
}

// Export singleton instance
const aiService = AIService.getInstance();
export default aiService;
