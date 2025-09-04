/**
 * Placeholder per README. Replace with your real agent implementation later.
 * Keep the same shape your app expects (agentSDK.* methods).
 */
export const agentSDK = {
  async runTool(params) {
    return { ok: true, params, result: "Mock agent result" };
  },
  async listAgents() {
    return [];
  }
};
