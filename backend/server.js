// server.js
// This file sets up a Node.js backend server using Express to interact with the Google Gemini API for generating personalized workout plans.
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Import the Google Generative AI SDK
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Your Google Gemini API Key (replace OPENAI_API_KEY)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable not set. Please update your .env file.");
    process.exit(1);
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Define the system instruction (AI's persona and rules)
const SYSTEM_INSTRUCTION = "You are a highly experienced, knowledgeable, and motivating personal fitness trainer. Your primary goal is to create safe, effective, and personalized workout plans. You should provide clear instructions, emphasize proper form, and consider the user's goals, current fitness level, available equipment, time commitment, and any preferences or limitations (like injuries). Always respond with the workout plan strictly in JSON format as requested by the user, and nothing else. Ensure the JSON is valid and matches the specified structure.";

// --- Gemini API Call Utility Function ---
async function callGeminiChat(userPromptContent, model = "gemini-1.5-flash", temperature = 0.7, max_tokens = 1200) {
    try {
        const geminiModel = genAI.getGenerativeModel({
            model: model,
            // Pass the system instruction directly here for models that support it (like 1.5-flash)
            systemInstruction: SYSTEM_INSTRUCTION
        });

        // For single-turn requests, you can use generateContent.
        // For multi-turn conversations, you would use model.startChat and pass history.
        // For this use case (generating a plan based on a single comprehensive prompt), generateContent is fine.
        const result = await geminiModel.generateContent({
            contents: [{ role: "user", parts: [{ text: userPromptContent }] }],
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: max_tokens,
                responseMimeType: "application/json" // Request JSON output explicitly
            }
        });

        const response = result.response;
        const text = response.text(); // This should be your JSON string
        return text;

    } catch (error) {
        console.error("Failed to call Google Gemini API:", error);
        if (error.response && error.response.status === 429) {
            throw new Error("Gemini API Rate Limit Exceeded. Please wait and try again.");
        }
        throw error;
    }
}

// --- Helper to build the prompt for Gemini (largely same as before) ---
function buildWorkoutPlanPrompt(healthStats, goals) {
    const { age, gender, weight, height, medicalConditions } = healthStats;
    const { primaryGoal, workoutFrequency, timeframe, fitnessLevel, availableEquipment } = goals;

    let prompt = `Generate a personalized workout plan in JSON format.
    The plan should be an array of objects, where each object represents a day.
    Each day object MUST have the following properties: 'day' (e.g., "Day 1"), 'focus' (e.g., "Upper Body Strength"), 'exercises' (an array of strings, e.g., ["Bench Press 3x8", "Overhead Press 3x10"]), 'duration' (e.g., "60 min"), and 'difficulty' (e.g., "Intermediate").
    Ensure the 'exercises' array contains specific exercises with suggested sets and reps.
    Include a warm-up and cool-down for each day within the exercise list, clearly labeled.
    
    Here are the user's details:
    - Age: ${age || 'N/A'}
    - Gender: ${gender || 'N/A'}
    - Weight: ${weight ? `${weight} kg` : 'N/A'}
    - Height: ${height ? `${height} cm` : 'N/A'}
    - Medical Conditions: ${medicalConditions || 'None'}
    
    User's Goals:
    - Primary Goal: ${primaryGoal || 'General Fitness'}
    - Workout Frequency: ${workoutFrequency || 'N/A'}
    - Timeframe (for goal): ${timeframe || 'N/A'}
    - Current Fitness Level: ${fitnessLevel || 'N/A'}
    - Available Equipment: ${availableEquipment || 'N/A'}
    
    Based on these details, create a plan for the specified workout frequency.
    Example JSON structure:
    [
      {
        "day": "Day 1",
        "focus": "Full Body Strength",
        "exercises": ["Warm-up: 5 min light cardio", "Squats 3x10", "Push-ups 3xAMRAP", "Bent-over Rows 3x10", "Plank 3x30s", "Cool-down: 5 min stretching"],
        "duration": "60 min",
        "difficulty": "Beginner"
      }
    ]
    `;

    return prompt;
}

// --- API Endpoints ---

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', message: 'Node.js backend with Gemini API is running.' });
});

app.post('/generate-workout', async (req, res) => {
    const { healthStats, goals } = req.body;

    if (!healthStats || !goals) {
        return res.status(400).json({ message: "Missing healthStats or goals in request body." });
    }

    const userPrompt = buildWorkoutPlanPrompt(healthStats, goals);
    // Note: With Gemini, the system instruction is passed to the model initialization,
    // not directly in the messages array for single-turn content generation.

    try {
        const geminiResponse = await callGeminiChat(userPrompt);
        console.log("Raw Gemini Response:", geminiResponse);

        let workoutPlan;
        try {
            workoutPlan = JSON.parse(geminiResponse);
            // Basic validation for the expected array structure
            if (!Array.isArray(workoutPlan) || workoutPlan.some(item => !item.day || !item.focus || !Array.isArray(item.exercises))) {
                throw new Error("Parsed JSON does not match expected WorkoutPlanItem[] structure.");
            }
        } catch (jsonError) {
            console.error("Failed to parse Gemini response as JSON:", jsonError);
            return res.status(500).json({ message: "AI response was not in the expected format. Please try again.", rawResponse: geminiResponse });
        }

        res.json(workoutPlan); // Send the parsed JSON back to the frontend
    } catch (error) {
        console.error("Error generating workout plan:", error);
        res.status(500).json({ message: error.message || "Failed to generate workout plan due to an internal server error." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Node.js backend server listening on http://localhost:${PORT}`);
});