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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTY2ODEyOTEsImV4cCI6MjA3MjI1NzI5MX0.M-3C2n285htKskqDHhGQMJx509mTAObsi3WRkpJv5iA"
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
   * Map Base44 field names to Supabase field names
   * @param {string} field - Field name to map
   * @returns {string} Mapped field name
   */
  mapFieldName(field) {
    const fieldMappings = {
      created_date: "created_at",
      updated_date: "updated_at",
      // Prompt table field mappings
      title: "title",
      prompt_text: "prompt_text", 
      is_public: "is_public",
      user_email: "user_email",
      // Add any other field mappings as needed
    };
    return fieldMappings[field] || field;
  }

  /**
   * Map data object fields from Base44 to Supabase format
   * @param {Object} data - Data object to map
   * @returns {Object} Mapped data object
   */
  mapDataFields(data) {
    if (!data || typeof data !== "object") return data;

    const mapped = {};
    Object.entries(data).forEach(([key, value]) => {
      const mappedKey = this.mapFieldName(key);
      mapped[mappedKey] = value;
    });
    return mapped;
  }

  /**
   * Map Supabase field names back to Base44 field names in results
   * @param {Array|Object} data - Data to map
   * @returns {Array|Object} Mapped data
   */
  mapResultFields(data) {
    if (!data) return data;

    const reverseFieldMappings = {
      created_at: "created_date",
      updated_at: "updated_date",
      // Prompt table reverse mappings
      title: "title",
      prompt_text: "prompt_text",
      is_public: "is_public", 
      user_email: "user_email",
    };

    const mapObject = (obj) => {
      const mapped = {};
      for (const [key, value] of Object.entries(obj)) {
        const mappedKey = reverseFieldMappings[key] || key;
        mapped[mappedKey] = value;
      }
      return mapped;
    };

    if (Array.isArray(data)) {
      return data.map(mapObject);
    } else {
      return mapObject(data);
    }
  }

  /**
   * List all records with optional ordering and limit
   * @param {string} orderBy - Field to order by (prefix with '-' for descending)
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of records
   */
  async list(orderBy = "created_at", limit = null) {
    let query = this.supabase.from(this.tableName).select("*");

    if (orderBy) {
      if (orderBy.startsWith("-")) {
        const field = this.mapFieldName(orderBy.substring(1));
        query = query.order(field, { ascending: false });
      } else {
        const field = this.mapFieldName(orderBy);
        query = query.order(field, { ascending: true });
      }
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      // Handle missing table gracefully for legacy entities
      if (
        error.code === "PGRST205" &&
        error.message.includes("Could not find the table")
      ) {
        console.warn(
          `Table ${this.tableName} does not exist, returning empty array`
        );
        return [];
      }
      throw error;
    }
    return this.mapResultFields(data) || [];
  }

  /**
   * Filter records based on conditions
   * @param {Object} conditions - Filter conditions
   * @param {string} orderBy - Field to order by (prefix with '-' for descending)
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of filtered records
   */
  async filter(conditions = {}, orderBy = "created_at", limit = null) {
    let query = this.supabase.from(this.tableName).select("*");

    // Apply filter conditions with field mapping
    Object.entries(conditions).forEach(([key, value]) => {
      const mappedKey = this.mapFieldName(key);
      
      if (Array.isArray(value)) {
        query = query.in(mappedKey, value);
      } else if (value && typeof value === 'object') {
        // Handle object-based operators
        if (value.in !== undefined) {
          // Handle { id: { in: [array] } }
          query = query.in(mappedKey, value.in);
        } else if (value.$gte !== undefined || value.$lte !== undefined || value.$gt !== undefined || value.$lt !== undefined || value.$ne !== undefined || value.$nin !== undefined) {
          // Handle range operators, not equal, and not in
          if (value.$gte !== undefined) {
            query = query.gte(mappedKey, value.$gte);
          }
          if (value.$lte !== undefined) {
            query = query.lte(mappedKey, value.$lte);
          }
          if (value.$gt !== undefined) {
            query = query.gt(mappedKey, value.$gt);
          }
          if (value.$lt !== undefined) {
            query = query.lt(mappedKey, value.$lt);
          }
          if (value.$ne !== undefined) {
            query = query.neq(mappedKey, value.$ne);
          }
          if (value.$nin !== undefined) {
            query = query.not(mappedKey, 'in', `(${value.$nin.join(',')})`);
          }
        } else {
          // Handle other object values as equality
          query = query.eq(mappedKey, value);
        }
      } else {
        query = query.eq(mappedKey, value);
      }
    });

    // Apply ordering
    if (orderBy) {
      if (orderBy.startsWith("-")) {
        const field = this.mapFieldName(orderBy.substring(1));
        query = query.order(field, { ascending: false });
      } else {
        const field = this.mapFieldName(orderBy);
        query = query.order(field, { ascending: true });
      }
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      // Handle missing table gracefully for legacy entities
      if (
        error.code === "PGRST205" &&
        error.message.includes("Could not find the table")
      ) {
        console.warn(
          `Table ${this.tableName} does not exist, returning empty array`
        );
        return [];
      }
      console.error(`Filter error for ${this.tableName}:`, error);
      throw error;
    }
    return this.mapResultFields(data) || [];
  }

  /**
   * Get a single record by ID
   * @param {string} id - Record ID
   * @returns {Promise<Object>} Single record
   */
  async get(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      // Handle missing table gracefully for legacy entities
      if (
        error.code === "PGRST205" &&
        error.message.includes("Could not find the table")
      ) {
        console.warn(`Table ${this.tableName} does not exist, returning null`);
        return null;
      }
      console.error(`Get error for ${this.tableName}:`, error);
      throw error;
    }

    return data ? this.mapResultFields(data) : null;
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    // Map field names from Base44 to Supabase format
    const mappedData = this.mapDataFields(data);

    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(mappedData)
      .select()
      .single();

    if (error) {
      // Handle missing table gracefully for legacy entities
      if (
        error.code === "PGRST205" &&
        error.message.includes("Could not find the table")
      ) {
        console.warn(
          `Table ${this.tableName} does not exist, cannot create record`
        );
        throw new Error(
          `Table ${this.tableName} is not available in this environment`
        );
      }
      console.error(`Create error for ${this.tableName}:`, error);
      throw error;
    }
    return this.mapResultFields(result);
  }

  /**
   * Update a record by ID
   * @param {string} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data) {
    // Map field names from Base44 to Supabase format
    const mappedData = this.mapDataFields(data);

    // Always add updated_at timestamp
    mappedData.updated_at = new Date().toISOString();

    // Update the record
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update(mappedData)
      .eq("id", id)
      .select();

    if (error) {
      // Handle missing table gracefully for legacy entities
      if (
        error.code === "PGRST205" &&
        error.message.includes("Could not find the table")
      ) {
        console.warn(
          `Table ${this.tableName} does not exist, cannot update record`
        );
        return null;
      }
      console.error(`Update error for ${this.tableName}:`, error);
      throw error;
    }

    // If no rows were updated, return null to match Base44 behavior
    if (!result || result.length === 0) {
      return null;
    }

    return this.mapResultFields(result[0]);
  }

  /**
   * Delete a record by ID
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      // Handle missing table gracefully for legacy entities
      if (
        error.code === "PGRST205" &&
        error.message.includes("Could not find the table")
      ) {
        console.warn(
          `Table ${this.tableName} does not exist, cannot delete record`
        );
        return;
      }
      throw error;
    }
  }
}

/**
 * User Entity with authentication methods
 */
export class UserEntity extends CustomEntity {
  constructor() {
    super("users", true); // Use service role client for admin operations (bypasses RLS)
  }

  /**
   * Get a user by ID using service role (bypasses RLS)
   * @param {string} id - User ID
   * @returns {Promise<Object>} User data
   */
  async get(id) {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }

    return data ? this.mapResultFields(data) : null;
  }

  /**
   * Get current authenticated user data
   * @returns {Promise<Object>} Current user data
   */
  async me() {
    try {
      // Use the regular supabase client for auth, but admin client for database operations
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("User.me() - Auth check:", { user: user?.id, email: user?.email, authError });

      if (authError) {
        // Handle specific auth errors more gracefully
        if (
          authError.message?.includes(
            "User from sub claim in JWT does not exist"
          )
        ) {
          // Clear the invalid session and throw not authenticated
          await supabase.auth.signOut();
          throw new Error("Not authenticated");
        }
        // Only log unexpected auth errors, not session missing errors
        if (!authError.message?.includes("Auth session missing")) {
          console.error("Auth error:", authError);
        }
        throw new Error("Not authenticated");
      }

      if (!user) throw new Error("Not authenticated");

      console.log("User.me() - Authenticated user found:", { id: user.id, email: user.email });

      // Use regular supabase client for database operations to maintain RLS context
      console.log("User.me() - Querying users table for user ID:", user.id);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      console.log("User.me() - Database query result:", { data, error });

      if (error) {
        // Handle missing table gracefully
        if (
          error.code === "PGRST205" &&
          error.message.includes("Could not find the table")
        ) {
          console.error("Users table not found. Please run the SQL setup script in your Supabase dashboard.");
          console.error("The setup script is available in: supabase-setup.sql or supabase-full-setup.sql");
          throw new Error("Database not properly configured. Please contact your administrator.");
        }
        console.error("Error fetching user:", error);
        throw error;
      }

      // If user doesn't exist in users table, create from auth user
      if (!data) {
        const newUser = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          user_role: user.email === "dev@localhost.com" ? "Admin" : "Staff", // Make dev user an admin
          approval_status: user.email === "dev@localhost.com" ? "approved" : "pending",
        };

        const { data: createdUser, error: createError } = await supabase
          .from("users")
          .insert(newUser)
          .select()
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          throw createError;
        }
        return this.mapResultFields(createdUser);
      }

      // Ensure dev user is always an admin
      if (user.email === "dev@localhost.com" && data.user_role !== "Admin") {
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({ user_role: "Admin", approval_status: "approved" })
          .eq("id", user.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating dev user to admin:", updateError);
        } else {
          console.log("Updated dev user to admin role");
          return this.mapResultFields(updatedUser);
        }
      }

      return this.mapResultFields(data);
    } catch (error) {
      // Handle various auth-related errors gracefully
      if (
        error.message?.includes("403") ||
        error.message?.includes("Forbidden") ||
        error.message?.includes("User from sub claim in JWT does not exist") ||
        error.message?.includes("AuthApiError")
      ) {
        // Clear any invalid session
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore sign out errors
        }
        throw new Error("Not authenticated");
      }
      throw error;
    }
  }

  /**
   * Update current user's data
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateMyUserData(userData) {
    // Use regular supabase client for auth, but admin client for database operations
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("users")
      .update({ ...userData, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .maybeSingle(); // Use maybeSingle to handle no rows gracefully

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    // If no rows were updated, return null
    if (!data) {
      return null;
    }

    return this.mapResultFields(data);
  }

  /**
   * Sign in with OAuth provider or development mode
   * @param {string} provider - OAuth provider (google, github, etc.) or 'dev' for development
   * @returns {Promise<void>}
   */
  async login(provider = "dev") {
    // For local development, use a simple email/password flow
    if (provider === "dev") {
      // Try to use the working credentials from Vercel deployment
      const devEmail = "mitchell@lysaght.net.nz";
      const devPassword = "dev123456"; // You'll need to provide the correct password

      try {
        // Try to sign in first using regular supabase client
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: devEmail,
            password: devPassword,
          });

        if (signInError) {
          console.log(
            "Sign in failed:",
            signInError.message
          );
          throw new Error("Dev user sign in failed. Please ensure the dev user exists in the database with the correct credentials.");
        } else {
          console.log("Successfully signed in:", signInData);
        }

        // Refresh the page to ensure authentication state is properly loaded
        window.location.reload();
      } catch (error) {
        console.error("Development login failed:", error);
        throw error;
      }
      return;
    }

    // For production, use OAuth with regular supabase client
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  /**
   * Drop-in for Base44: redirect-style login.
   * We map it to a Supabase magic-link so the app code stays unchanged.
   * @param {{ email?: string, emailRedirectTo?: string }} options
   */
  async loginWithRedirect(options = {}) {
    let email = options.email;
    if (!email) {
      // For development, use the dev login instead of prompting
      console.log("No email provided, using development login...");
      return await this.login("dev");
    }

    const emailRedirectTo = options.emailRedirectTo || window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    if (error) throw error;

    // Base44's redirect pattern doesn't return a user immediately.
    return { ok: true };
  }
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        // Clear invalid session if needed
        if (
          authError.message?.includes(
            "User from sub claim in JWT does not exist"
          )
        ) {
          await supabase.auth.signOut();
        }
        return false;
      }

      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Get current user data if authenticated, null if not
   * @returns {Promise<Object|null>} Current user data or null
   */
  async getCurrentUser() {
    try {
      return await this.me();
    } catch (error) {
      if (error.message === "Not authenticated") {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all users (admin function using service role)
   * @param {string} orderBy - Field to order by
   * @param {number} limit - Maximum number of records
   * @returns {Promise<Array>} Array of users
   */
  async list(orderBy = "created_at", limit = null) {
    return super.list(orderBy, limit);
  }

  /**
   * Filter users (admin function using service role)
   * @param {Object} conditions - Filter conditions
   * @param {string} orderBy - Field to order by
   * @param {number} limit - Maximum number of records
   * @returns {Promise<Array>} Array of filtered users
   */
  async filter(conditions = {}, orderBy = "created_at", limit = null) {
    return super.filter(conditions, orderBy, limit);
  }
}

/**
 * Convert PascalCase entity name to snake_case table name
 * @param {string} entityName - Entity name in PascalCase
 * @returns {string} Table name in snake_case
 */
function entityNameToTableName(entityName) {
  // Map Base44 entity names to proper table names (singular form)
  const specialMappings = {
    'User': 'users',
    'CompanySettings': 'company_settings',
    'Client': 'client',
    'TOE': 'toe',
    'Project': 'project',
    'Task': 'task',
    'TimeEntry': 'time_entry',
    'Invoice': 'invoice',
    'TaskTemplate': 'task_template',
    'AnalyticsSetting': 'analytics_setting',
    'DashboardSettings': 'dashboard_settings',
    'LeadOpportunity': 'lead_opportunity',
    'AIAssistant': 'ai_assistant',
    'ChatConversation': 'chat_conversation',
    'Prompt': 'prompt',
    'TimerSession': 'timer_session',
    'WeeklySubmission': 'weekly_submission',
    'StaffRate': 'staff_rate',
    'TaskRate': 'task_rate',
    'BillingSettings': 'billing_settings',
    'TOEFolder': 'toe_folder',
    'CostTracker': 'cost_tracker',
    'TOELibraryItem': 'toe_library_item',
    'ImportJob': 'import_job',
    'ImportJobRow': 'import_job_row',
    'JobStatusMap': 'job_status_map',
    'UserCrosswalk': 'user_crosswalk',
    'ClientCrosswalk': 'client_crosswalk',
    'TOEReview': 'toe_review',
    'TagLibrary': 'tag_library',
    'TOESignature': 'toe_signature',
    'WriteOff': 'write_off'
  };
  
  if (specialMappings[entityName]) {
    return specialMappings[entityName];
  }
  
  // Fallback: convert PascalCase to snake_case
  return entityName
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

/**
 * Determine if an entity should use service role based on common patterns
 * @param {string} entityName - Entity name
 * @returns {boolean} Whether to use service role
 */
function shouldUseServiceRole(entityName) {
  const serviceRoleEntities = [
    "user",
    "client",
    "project",
    "task",
    "tasktemplate",
    "toelibraryitem",
    "toe",
    "toereview",
    "toesignature",
    "transaction",
    "usermembership",
    "payment",
    "order",
    "subscription",
    "admin",
    "audit",
    "log",
    "prompt",
  ];

  return serviceRoleEntities.some((pattern) =>
    entityName.toLowerCase().includes(pattern)
  );
}

/**
 * Create a dynamic entities proxy that creates entities on-demand
 */
function createEntitiesProxy() {
  const entityCache = new Map();

  return new Proxy(
    {},
    {
      get(_, entityName) {
        if (typeof entityName !== "string") return undefined;

        // Return cached entity if it exists
        if (entityCache.has(entityName)) {
          return entityCache.get(entityName);
        }

        // Create new entity on-demand
        const tableName = entityNameToTableName(entityName);
        const useServiceRole = shouldUseServiceRole(entityName);
        
        // Use UserEntity for User entity, CustomEntity for others
        const entity = entityName === 'User' ? new UserEntity() : new CustomEntity(tableName, useServiceRole);

        // Cache the entity for future use
        entityCache.set(entityName, entity);

        console.log(
          `Created entity: ${entityName} -> ${tableName} (service role: ${useServiceRole})`
        );

        return entity;
      },

      has(_, entityName) {
        return typeof entityName === "string";
      },

      ownKeys() {
        return Array.from(entityCache.keys());
      },
    }
  );
}

/**
 * Create custom client that mimics Base44 SDK structure
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

          // TODO: Replace with actual OpenAI API call
          // Example implementation:
          // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          // const response = await openai.chat.completions.create({
          //   model: "gpt-4",
          //   messages: [{ role: "user", content: prompt }],
          //   response_format: response_json_schema ? { type: "json_object" } : undefined
          // });

          if (response_json_schema) {
            return {
              data: {
                message:
                  "This would be structured data matching the provided schema",
                note: "LLM integration not yet implemented",
              },
            };
          } else {
            return {
              response:
                "This would be the LLM response text. LLM integration not yet implemented.",
            };
          }
        },

        SendEmail: async ({
          to,
          subject,
          body,
          from_name = "Peace Adventures",
        }) => {
          console.warn("SendEmail called with:", {
            to,
            subject,
            body,
            from_name,
          });

          // TODO: Replace with actual email service (Resend, SendGrid, etc.)
          // Example with Resend:
          // const resend = new Resend(process.env.RESEND_API_KEY);
          // const result = await resend.emails.send({
          //   from: `${from_name} <noreply@yourdomain.com>`,
          //   to: [to],
          //   subject: subject,
          //   html: body
          // });

          return {
            status: "sent",
            message_id: `mock_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 11)}`,
            note: "Email integration not yet implemented - email would have been sent",
          };
        },

        UploadFile: async ({ file }) => {
          console.warn(
            "UploadFile called with file:",
            file?.name,
            file?.size,
            file?.type
          );

          // TODO: Replace with Supabase Storage upload
          // Example implementation:
          // const fileName = `${Date.now()}_${file.name}`;
          // const { data, error } = await supabase.storage
          //   .from('uploads')
          //   .upload(fileName, file);
          //
          // if (error) throw error;
          //
          // const { data: { publicUrl } } = supabase.storage
          //   .from('uploads')
          //   .getPublicUrl(fileName);
          //
          // return { file_url: publicUrl };

          // Mock response for now
          const mockUrl = `https://mock-storage.supabase.co/uploads/${Date.now()}_${
            file?.name || "file"
          }`;
          return {
            file_url: mockUrl,
            note: "File upload integration not yet implemented - this is a mock URL",
          };
        },

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
