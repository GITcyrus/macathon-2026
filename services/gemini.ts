import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { SkillPlan, Milestone, Objective, QuizQuestion, QuizResult, ObjectiveQuizQuestion } from "../types";

// Initializing Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper to clean JSON string from markdown fences
const cleanAndParse = (text: string) => {
  try {
    // Robust cleaning of markdown code blocks
    let cleaned = text.trim();
    // Remove wrapping ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error on text:", text);
    throw new Error("Failed to parse AI response");
  }
};

// --- Throttling and Exponential Backoff Configuration ---
const REQUEST_LIMIT_PER_MINUTE = 10;
const MIN_DELAY_BETWEEN_REQUESTS_MS = 60000 / REQUEST_LIMIT_PER_MINUTE; // 6 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

interface QueuedRequest<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  callFunction: () => Promise<GenerateContentResponse>; // The actual API call
  processResponse: (response: GenerateContentResponse) => T; // How to process the raw response
  retries: number;
}

const requestQueue: QueuedRequest<any>[] = []; // Use any for flexibility
let isProcessingQueue = false;
let lastRequestCompletionTime = 0; // Tracks when the last request *finished* for accurate throttling

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastCompletion = now - lastRequestCompletionTime;

    // Calculate actual delay needed to adhere to RPM limit
    const delayNeeded = MIN_DELAY_BETWEEN_REQUESTS_MS - timeSinceLastCompletion;
    if (delayNeeded > 0) {
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    const nextRequest = requestQueue.shift()!;
    const { resolve, reject, callFunction, processResponse, retries } = nextRequest;

    try {
      const rawResponse = await callFunction();
      const processedResult = processResponse(rawResponse);
      resolve(processedResult);
    } catch (error: any) {
      // Check for 429 status code and retry if within MAX_RETRIES
      if (error.status === 429 && retries < MAX_RETRIES) {
        const backoffDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries);
        console.warn(`429 error, retrying in ${backoffDelay}ms. Attempt ${retries + 1}/${MAX_RETRIES}`);
        
        requestQueue.unshift({ // Add back to front of queue
          ...nextRequest,
          retries: retries + 1,
        });
        await new Promise(resolve => setTimeout(resolve, backoffDelay)); // Wait before next queue process iteration
      } else {
        reject(error);
      }
    } finally {
      lastRequestCompletionTime = Date.now(); // Update completion time after each request
    }
  }
  isProcessingQueue = false;
}

// Generic wrapper for Gemini API calls with throttling and exponential backoff
async function throttledGeminiCall<T>(
  model: string,
  contents: string | object,
  config: object,
  processResponseFn: (rawResponseText: string) => T // Custom processing for the text output
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const callFunction = async () => {
      // Direct call to ai.models.generateContent to get the full GenerateContentResponse
      return await ai.models.generateContent({
        model,
        contents,
        config,
      });
    };

    const processRawResponse = (response: GenerateContentResponse): T => {
      if (!response.text) throw new Error("No response from AI (text property)");
      return processResponseFn(response.text); // Pass just the text to the custom processor
    };

    requestQueue.push({ 
      resolve, 
      reject, 
      callFunction, 
      processResponse: processRawResponse, 
      retries: 0 
    });
    
    // Start processing the queue if it's not already running
    if (!isProcessingQueue) {
      processQueue();
    }
  });
}
// --- End Throttling and Exponential Backoff Configuration ---


// Schema for the new 3-layer structure
const planSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    skillName: { type: Type.STRING, description: "The formal, corrected title of the skill (e.g., 'Linear Algebra' instead of 'lin alg')." },
    experienceLevel: { type: Type.STRING, description: "The assessed level based on quiz results" },
    estimatedDuration: { type: Type.STRING },
    milestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Major phase name (e.g., 'Foundations')" },
          objectives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Specific learning objective" },
                description: { type: Type.STRING, description: "Detailed explanation (2-3 sentences) of why this is important and what exactly will be learned." },
                duration: { type: Type.STRING, description: "e.g., '2 hours'" },
                tasks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of exactly 1-3 specific actionable steps/tasks to achieve this objective. Keep it concise."
                },
                status: { type: Type.STRING, description: "Always 'not_started' for new plans" }
              },
              required: ["title", "tasks", "status", "description"]
            }
          }
        },
        required: ["title", "objectives"]
      }
    }
  },
  required: ["skillName", "experienceLevel", "estimatedDuration", "milestones"]
};

const processAIResponse = (text: string): Partial<SkillPlan> => {
  const data = cleanAndParse(text);
  
  const enrichedMilestones: Milestone[] = data.milestones.map((ms: any, index: number) => ({
    id: generateId(),
    title: ms.title,
    order: index + 1,
    objectives: ms.objectives.map((obj: any) => ({
      id: generateId(),
      title: obj.title,
      description: obj.description || "",
      status: obj.status || 'not_started',
      isFlagged: false,
      duration: obj.duration,
      tasks: obj.tasks || []
    }))
  }));

  return {
    skillName: data.skillName,
    experienceLevel: data.experienceLevel,
    estimatedDuration: data.estimatedDuration,
    milestones: enrichedMilestones,
    theme: 'violet' // Default, will be overridden by the creator
  };
};

export const generateSkillPlanAI = async (
  skillName: string,
  experienceLevel: string,
  timeConstraint?: string
): Promise<Partial<SkillPlan>> => {
  // Ultra-concise prompt for token efficiency
  const prompt = `Create a learning path for: "${skillName}" (${experienceLevel}). ${timeConstraint ? `Time: ${timeConstraint}.` : ''}`;

  try {
    const responseData = await throttledGeminiCall<Partial<SkillPlan>>(
      'gemini-3-pro-preview', // Model as per previous specific user request
      prompt,
      {
        // System instruction to enforce raw JSON and structure limits to save tokens
        systemInstruction: "You are an expert curriculum designer. Output strict raw JSON only. Do not use Markdown code blocks. 1. Correct the 'skillName' to its formal title (e.g. 'lin alg' -> 'Linear Algebra'). 2. Create a highly detailed roadmap. 3. Generate 6-10 milestones acting as objective topic groups. 4. Each milestone must have 4-8 specific learning objectives. 5. Each objective must have 1-3 actionable tasks.",
        responseMimeType: "application/json",
        responseSchema: planSchema,
      },
      processAIResponse // Use the existing processor for SkillPlan
    );
    return responseData;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const generateAssessmentQuiz = async (skillName: string): Promise<QuizQuestion[]> => {
  // Increased to 10 questions for initial assessment
  const prompt = `Generate 10 multiple-choice assessment questions for "${skillName}" (Beginner to Expert). 4 options each. Focus primarily on theoretical concepts, definitions, and understanding of principles. Avoid questions requiring complex calculations.`;

  const quizSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER }
        },
        required: ["question", "options", "correctAnswerIndex"]
    }
  };

  try {
    const responseData = await throttledGeminiCall<QuizQuestion[]>(
      'gemini-2.5-flash', // Model as per current user request
      prompt,
      {
        systemInstruction: "Output strictly raw JSON only. Do not use Markdown code blocks.",
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
      (text: string) => cleanAndParse(text) as QuizQuestion[] // Custom processor for quizzes
    );
    return responseData;

  } catch (error) {
    console.error("Quiz Generation Error:", error);
    throw error;
  }
};

export const generateObjectiveQuiz = async (skillName: string, objectiveTitle: string): Promise<ObjectiveQuizQuestion[]> => {
    // Increased to 10 questions with varied types
    const prompt = `Generate 10 multiple-choice quiz questions for "${objectiveTitle}" in "${skillName}". Difficulty must range from Easy to Hard. Include a mix of: 1. Instant Recall 2. Theoretical Concepts 3. Practical/Calculation based problems. Provide an explanation for the correct answer.`;
  
    const quizSchema: Schema = {
      type: Type.ARRAY,
      items: {
          type: Type.OBJECT,
          properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING, description: "Explanation of the solution" }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
      }
    };
  
    try {
      const responseData = await throttledGeminiCall<ObjectiveQuizQuestion[]>(
        'gemini-2.5-flash', // Model as per current user request
        prompt,
        {
          systemInstruction: "Output strictly raw JSON only. Do not use Markdown code blocks.",
          responseMimeType: "application/json",
          responseSchema: quizSchema,
        },
        (text: string) => cleanAndParse(text) as ObjectiveQuizQuestion[] // Custom processor for objective quizzes
      );
      return responseData;
  
    } catch (error) {
      console.error("Objective Quiz Generation Error:", error);
      throw error;
    }
  };

export const generatePlanFromAssessment = async (
    skillName: string,
    timeConstraint: string,
    quizResults: QuizResult[]
): Promise<Partial<SkillPlan>> => {
    
    // Condensed summary for tokens
    const resultsSummary = quizResults.map((r, i) => `Q${i+1}: ${r.isCorrect ? 'Correct' : 'Wrong'}`).join(', ');

    const prompt = `Create a detailed roadmap for "${skillName}". ${timeConstraint ? `Time: ${timeConstraint}.` : ''} Quiz Results: ${resultsSummary}. Level: Based on quiz.`;

    try {
        const responseData = await throttledGeminiCall<Partial<SkillPlan>>(
          'gemini-2.5-flash', // Model as per current user request
          prompt,
          {
            systemInstruction: "Output strictly raw JSON only. Do not use Markdown code blocks. 1. Correct the 'skillName' to its formal title. 2. Create a highly detailed roadmap. 3. Generate 6-10 milestones acting as objective topic groups. 4. Each milestone must have 4-8 specific learning objectives. 5. Each objective must have 1-3 actionable tasks.",
            responseMimeType: "application/json",
            responseSchema: planSchema,
          },
          processAIResponse // Use the existing processor for SkillPlan
        );
        return responseData;
    
      } catch (error) {
        console.error("Assessment Plan Generation Error:", error);
        throw error;
      }
};

export const adaptSkillPlanAI = async (
  currentPlan: SkillPlan,
  newExperienceLevel: string,
  newTimeConstraint: string
): Promise<Partial<SkillPlan>> => {
  const prompt = `Adapt roadmap for "${currentPlan.skillName}". New Level: ${newExperienceLevel}. New Time: ${newTimeConstraint}. Preserve completed items.`;

  try {
    const responseData = await throttledGeminiCall<Partial<SkillPlan>>(
      'gemini-2.5-flash', // Model as per current user request
      prompt,
      {
        systemInstruction: "Output strictly raw JSON only. Do not use Markdown code blocks. 1. Correct the 'skillName' to its formal title if needed. 2. Create a highly detailed roadmap. 3. Generate 6-10 milestones acting as objective topic groups. 4. Each milestone must have 4-8 specific learning objectives. 5. Each objective must have 1-3 actionable tasks.",
        responseMimeType: "application/json",
        responseSchema: planSchema,
      },
      processAIResponse // Use the existing processor for SkillPlan
    );
    return responseData;

  } catch (error) {
    console.error("AI Adaptation Error:", error);
    throw error;
  }
};

export interface TaskDetails {
  explanation: string;
  steps: string[];
  visualAid: string;
  searchQueries: string[];
}

export const getTaskDetailsAI = async (
  skillName: string,
  objectiveTitle: string
): Promise<TaskDetails> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      explanation: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      visualAid: { type: Type.STRING },
      searchQueries: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["explanation", "steps", "visualAid", "searchQueries"]
  };

  const prompt = `Explain "${objectiveTitle}" for "${skillName}". Provide steps, visual aid code/text, and search queries.`;

  try {
    const responseData = await throttledGeminiCall<TaskDetails>(
      'gemini-2.5-flash', // Model as per current user request
      prompt,
      {
        systemInstruction: "Output strictly raw JSON only. Do not use Markdown code blocks.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      (text: string) => cleanAndParse(text) as TaskDetails // Custom processor for task details
    );
    return responseData;

  } catch (error) {
    console.error("AI Details Error:", error);
    throw error;
  }
};