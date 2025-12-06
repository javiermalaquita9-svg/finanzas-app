import { GoogleGenerativeAI } from "@google/generative-ai";

// Accede a tu clave de API como una variable de entorno
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("La variable de entorno VITE_GEMINI_API_KEY no está configurada en tu archivo .env");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });