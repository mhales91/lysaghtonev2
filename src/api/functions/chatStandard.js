/**
 * Placeholder per README. Replace with a real "standard chat" implementation later.
 * Keeps the API stable so the app can boot.
 */
export async function chatStandard({
  messages = [],
  model = "gpt-4o-mini",
  temperature = 0.2,
}) {
  const lastUser = [...messages].reverse().find(m => m?.role === "user");
  const userText = typeof lastUser?.content === "string"
    ? lastUser.content
    : (lastUser?.content?.[0]?.text ?? "Hello!");

  return {
    ok: true,
    data: {
      answer: `Mock chat reply (placeholder): ${userText}`,
      modelUsed: model,
      temperature,
    }
  };
}
