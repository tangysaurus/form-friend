import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_ACCESS_TOKEN);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { healthStats, goals } = req.body;

  if (!healthStats || !goals) {
    return res.status(400).json({ message: 'Missing healthStats or goals' });
  }

  // Construct a detailed prompt for the AI model
  let prompt = `Generate a personalized workout plan for a user with the following details:
  Age: ${healthStats.age || 'unknown'}
  Gender: ${healthStats.gender || 'unknown'}
  Weight: ${healthStats.weight || 'unknown'} kg
  Height: ${healthStats.height || 'unknown'} cm
  Fitness Level: ${goals.fitnessLevel || 'beginner'}
  Primary Goal: ${goals.primaryGoal || 'general fitness'}
  Available Equipment: ${goals.availableEquipment || 'any'}
  Workout Frequency: ${goals.workoutFrequency || '3 times a week'}
  Timeframe: ${goals.timeframe || 'flexible'}
  Medical Conditions/Injuries: ${healthStats.medicalConditions || 'none'}

  The workout plan should be structured for 3 days a week, focusing on different muscle groups or types of training. For each day, provide:
  - Day name (e.g., "Day 1", "Day 2")
  - Focus (e.g., "Upper Body", "Lower Body", "Full Body", "Cardio & Core")
  - A list of 4-6 exercises (e.g., "Push-ups", "Squats", "Plank")
  - Estimated duration (e.g., "45 min", "60 min")
  - Suggested difficulty (e.g., "Beginner", "Intermediate", "Advanced")

  Format the output as a JSON array of objects, where each object represents a day in the workout plan. Example format:
  [
    {
      "day": "Day 1",
      "focus": "Upper Body",
      "exercises": ["Push-ups", "Dumbbell Rows", "Overhead Press", "Bicep Curls"],
      "duration": "45 min",
      "difficulty": "Intermediate"
    },
    // ... more days
  ]

  Please ensure the JSON is valid and only output the JSON.`;

  try {
    const response = await hf.textGeneration({
      model: 'Lukamac/PlayPart-AI-Personal-Trainer',
      inputs: prompt,
      parameters: {
        max_new_tokens: 500, // Adjust as needed
        temperature: 0.7,    // Controls randomness, higher means more creative
        top_p: 0.9,          // Controls diversity
        return_full_text: false, // Only return the generated text
      },
    });

    let generatedText = response.generated_text.trim();

    // The model might include some conversational text before or after the JSON.
    // Try to extract only the JSON part.
    const jsonStartIndex = generatedText.indexOf('[');
    const jsonEndIndex = generatedText.lastIndexOf(']');

    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      generatedText = generatedText.substring(jsonStartIndex, jsonEndIndex + 1);
    } else {
      // If JSON extraction fails, log the raw output for debugging
      console.warn("Could not extract valid JSON from model output:", generatedText);
      return res.status(500).json({ message: 'Failed to parse workout plan from AI. Raw output: ' + generatedText });
    }

    let workoutPlanData;
    try {
      workoutPlanData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return res.status(500).json({ message: 'Failed to parse workout plan from AI response. Check AI output format.' });
    }

    res.status(200).json(workoutPlanData);

  } catch (error: any) {
    console.error('Error generating workout plan:', error.message);
    res.status(500).json({ message: 'Error generating workout plan', error: error.message });
  }
}