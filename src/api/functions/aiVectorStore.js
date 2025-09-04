/**
 * Placeholder per README. Replace with your real implementation later.
 * API-compatible surface so existing code works.
 */
export const aiVectorStore = {
  async listVectorStores() {
    return { data: [], error: null };
  },
  async createVectorStore({ name }) {
    // return a mock vector store object
    return { data: { id: "vs_mock_1", name, created_at: new Date().toISOString() }, error: null };
  },
  async deleteVectorStore(id) {
    return { data: { id }, error: null };
  },
  async uploadFile({ vectorStoreId, file }) {
    return { data: { id: "file_mock_1", vector_store_id: vectorStoreId, name: file?.name ?? "mock.txt" }, error: null };
  },
  async listFiles({ vectorStoreId }) {
    return { data: [], error: null };
  }
};
