import { Router } from "express";
import { getOpenAIKeys, getOpenRouterKeys, getServerKeys } from "./ai-provider";

const router = Router();

const isConfigured = (...names: string[]) =>
  names.some((name) => Boolean(process.env[name]?.trim()));

const countUniqueConfigured = (...names: string[]) =>
  new Set(
    names
      .map((name) => process.env[name]?.trim())
      .filter((value): value is string => Boolean(value)),
  ).size;

router.get("/app-config", (_req, res) => {
  const multimediaGeminiNames = [
    "GEMINI_API_KEY",
    "AI_INTEGRATIONS_GEMINI_API_KEY",
    "GEMINI_API_KEY_CLOUDNARY",
    ...Array.from({ length: 5 }, (_, i) => "GEMINI_API_KEY_" + (i + 1)),
  ];

  res.json({
    chat: {
      geminiKeyCount: getServerKeys().length,
      openRouterKeyCount: getOpenRouterKeys().length,
      openAIKeyCount: getOpenAIKeys().length,
    },
    multimedia: {
      geminiKeyCount: countUniqueConfigured(...multimediaGeminiNames),
      openRouterConfigured: isConfigured("OPEN_ROTTER_API_KEY", "OPEN_ROUTER_API_KEY", "OPENROUTER_API_KEY"),
      cloudinaryConfigured:
        isConfigured("CLOUDNARY_USER_NAME", "CLOUDINARY_CLOUD_NAME") &&
        isConfigured("API_KEY", "CLOUDINARY_API_KEY") &&
        isConfigured("API_SECRET", "CLOUDINARY_API_SECRET"),
    },
    integrations: {
      githubConfigured: isConfigured("GITHUB_KEY"),
      huggingFaceConfigured: isConfigured("HUGGING_FACE_KEY"),
      groqConfigured: isConfigured("GROQ_KEY", "GROQ_API_KEY", "Groq_key", "groq_key"),
    },
  });
});

export default router;
