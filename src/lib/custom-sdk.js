import { supabase } from "./supabase-client.js";
import { createClient } from "@supabase/supabase-js";

// Handle both Vite (import.meta.env) and Node.js (process.env) environments
const getEnvVar = (key, defaultValue) => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return process.env[key] || defaultValue;
};

// Create service role client for admin operations (bypasses RLS)
const supabaseUrl = getEnvVar("VITE_SUPABASE_URL", "https://lysaghtone.com/");
const supabaseServiceKey = getEnvVar(
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
});

// Test service role access on initialization (silent)
supabaseAdmin
  .from("users")
  .select("id")
  .limit(1)
  .then(({ error }) => {
    if (error) {
      console.warn("Service role client initialization warning:", error.message);
      console.warn("This is expected if the users table hasn't been created yet.");
      console.warn("Please run the SQL setup script in your Supabase dashboard.");
    } else {
      console.log("Service role client initialized successfully");
    }
  });

/**
 * Base Entity class that provides CRUD operations compatible with Base44 SDK
 */
export class CustomEntity {
  constructor(tableName, useServiceRole = false) {
    this.tableName = tableName;
    this.supabase = useServiceRole ? supabaseAdmin : supabase;
    this.useServiceRole = useServiceRole;
  }

  /**
   * Get all records from the table
   */
  async list(filters = {}) {
    try {
      let query = this.supabase.from(this.tableName).select("*");

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error listing ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get a single record by ID
   */
  async get(id) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error getting ${this.tableName} with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(record) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(id, updates) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating ${this.tableName} with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Error deleting ${this.tableName} with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Count records with optional filters
   */
  async count(filters = {}) {
    try {
      let query = this.supabase.from(this.tableName).select("*", { count: "exact", head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Search records with text search
   */
  async search(searchTerm, searchColumns = []) {
    try {
      let query = this.supabase.from(this.tableName).select("*");

      if (searchColumns.length > 0 && searchTerm) {
        // Use text search on specified columns
        const searchConditions = searchColumns
          .map((column) => `${column}.ilike.%${searchTerm}%`)
          .join(",");
        query = query.or(searchConditions);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error searching ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get records with pagination
   */
  async paginate(page = 1, pageSize = 10, filters = {}) {
    try {
      const offset = (page - 1) * pageSize;
      let query = this.supabase
        .from(this.tableName)
        .select("*", { count: "exact" })
        .range(offset, offset + pageSize - 1);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error(`Error paginating ${this.tableName}:`, error);
      throw error;
    }
  }
}

/**
 * User Entity class with user-specific methods
 */
export class UserEntity extends CustomEntity {
  constructor(useServiceRole = false) {
    super("users", useServiceRole);
  }

  /**
   * Get current authenticated user
   */
  async me() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      if (!user) return null;

      // Get user profile from users table
      const { data: profile, error: profileError } = await this.supabase
        .from("users")
        .select("*")
        .eq("uuid", user.id)
        .single();

      if (profileError) {
        console.warn("User profile not found in users table:", profileError.message);
        return {
          id: user.id,
          email: user.email,
          user_role: null,
          full_name: user.user_metadata?.full_name || null,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          department: null,
        };
      }

      return profile;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Create a new user with profile
   */
  async createUser(userData) {
    try {
      const { email, password, user_role, full_name, first_name, last_name, department } = userData;

      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Create user profile
      const newUser = {
        uuid: authData.user.id,
        email: authData.user.email,
        user_role: user_role || null,
        full_name: full_name || null,
        first_name: first_name || null,
        last_name: last_name || null,
        department: department || null,
      };

      const { data: createdUser, error: createError } = await this.supabase
        .from("users")
        .insert(newUser)
        .select()
        .single();

      if (createError) throw createError;

      return createdUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      const { data: updatedUser, error: updateError } = await this.supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedUser;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getByRole(role) {
    try {
      return await this.list({ user_role: role });
    } catch (error) {
      console.error(`Error getting users by role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Get pending users (users without roles)
   */
  async getPendingUsers() {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .or("user_role.is.null,user_role.eq.");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting pending users:", error);
      throw error;
    }
  }

  /**
   * Get approved users (users with roles)
   */
  async getApprovedUsers() {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .not("user_role", "is", null)
        .neq("user_role", "");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting approved users:", error);
      throw error;
    }
  }
}

/**
 * Create entities proxy for dynamic entity access
 */
function createEntitiesProxy() {
  return new Proxy({}, {
    get(target, entityName) {
      if (typeof entityName !== 'string') return undefined;
      
      // Convert entity name to table name (e.g., 'User' -> 'users')
      const tableName = entityName.toLowerCase() + 's';
      
      // Return appropriate entity instance (default to regular client, not service role)
      const entity = entityName === 'User' ? new UserEntity() : new CustomEntity(tableName, false);
      return entity;
    }
  });
}

/**
 * Create the custom client instance
 */
export function createCustomClient() {
  return {
    entities: createEntitiesProxy(),
    auth: new UserEntity(),
    functions: {
      // Placeholder functions that can be implemented later
      verifyHcaptcha: async () => {
        // TODO: Implement hCaptcha verification
        console.warn("verifyHcaptcha not yet implemented");
        return { success: true };
      },
    },
    integrations: {
      Core: {
        InvokeLLM: async ({
          prompt,
          add_context_from_internet = false,
          response_json_schema = null,
          file_urls = null,
        }) => {
          console.warn("InvokeLLM called with:", {
            prompt,
            add_context_from_internet,
            response_json_schema,
            file_urls,
          });

          // TODO: Replace with actual LLM integration (OpenAI, Anthropic, etc.)
          // Example with OpenAI:
          // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          // const response = await openai.chat.completions.create({
          //   model: "gpt-4",
          //   messages: [{ role: "user", content: prompt }],
          //   response_format: response_json_schema ? { type: "json_object" } : undefined,
          // });

          // Mock response for now
          return {
            success: true,
            response: `Mock LLM response to: "${prompt}"`,
            usage: {
              prompt_tokens: 10,
              completion_tokens: 20,
              total_tokens: 30,
            },
            note: "LLM integration not yet implemented - this is a mock response",
          };
        },

        InvokeLLMWithContext: async ({
          prompt,
          context,
          response_json_schema = null,
        }) => {
          console.warn("InvokeLLMWithContext called with:", {
            prompt,
            context,
            response_json_schema,
          });

          // TODO: Implement LLM with context
          return {
            success: true,
            response: `Mock LLM response with context to: "${prompt}"`,
            usage: {
              prompt_tokens: 15,
              completion_tokens: 25,
              total_tokens: 40,
            },
            note: "LLM with context integration not yet implemented - this is a mock response",
          };
        },

        InvokeLLMWithRetrieval: async ({
          prompt,
          retrieval_config,
          response_json_schema = null,
        }) => {
          console.warn("InvokeLLMWithRetrieval called with:", {
            prompt,
            retrieval_config,
            response_json_schema,
          });

          // TODO: Implement LLM with retrieval
          return {
            success: true,
            response: `Mock LLM response with retrieval to: "${prompt}"`,
            usage: {
              prompt_tokens: 20,
              completion_tokens: 30,
              total_tokens: 50,
            },
            note: "LLM with retrieval integration not yet implemented - this is a mock response",
          };
        },
      },
      AI: {
        GenerateImage: async ({ prompt }) => {
          console.warn("GenerateImage called with prompt:", prompt);

          // TODO: Replace with actual AI image generation (DALL-E, Stability AI, etc.)
          // Example with OpenAI DALL-E:
          // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          // const response = await openai.images.generate({
          //   model: "dall-e-3",
          //   prompt: prompt,
          //   size: "1024x1024",
          //   quality: "standard",
          //   n: 1,
          // });
          //
          // return { url: response.data[0].url };

          // Mock response for now
          const mockUrl = `https://mock-ai-images.com/generated/${Date.now()}.png`;
          return {
            url: mockUrl,
            note: "Image generation integration not yet implemented - this is a mock URL",
          };
        },

        ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
          console.warn("ExtractDataFromUploadedFile called with:", {
            file_url,
            json_schema,
          });

          // TODO: Replace with actual OCR/document processing service
          // Example with AWS Textract or custom OCR solution:
          // const textract = new AWS.Textract();
          // const result = await textract.analyzeDocument({
          //   Document: { S3Object: { Bucket: bucket, Name: key } },
          //   FeatureTypes: ['TABLES', 'FORMS']
          // }).promise();
          //
          // Process and structure the result according to json_schema

          // Mock response for now
          return {
            status: "success",
            details: null,
            output: json_schema?.type === "array" ? [] : {},
            note: "File data extraction integration not yet implemented - this is a mock response",
          };
        },
      },
    },
  };
}

// Export the default client instance
export const customClient = createCustomClient();

// Export User entity for convenience
export const User = new UserEntity();