// Direct entities import to avoid bundling issues on Vercel
import { createCustomClient } from '../lib/custom-sdk.js';

// Create the client directly without going through base44Client
const client = createCustomClient();

// Export the entities directly
export const CompanySettings = client.entities.CompanySettings;
export const Client = client.entities.Client;
export const TOE = client.entities.TOE;
export const Project = client.entities.Project;
export const Task = client.entities.Task;
export const TimeEntry = client.entities.TimeEntry;
export const Invoice = client.entities.Invoice;
export const TagLibrary = client.entities.TagLibrary;
export const TOESignature = client.entities.TOESignature;
export const WriteOff = client.entities.WriteOff;
export const LeadOpportunity = client.entities.LeadOpportunity;
export const TaskTemplate = client.entities.TaskTemplate;
export const AIAssistant = client.entities.AIAssistant;
export const ChatConversation = client.entities.ChatConversation;
export const Prompt = client.entities.Prompt;
export const TimerSession = client.entities.TimerSession;
export const WeeklySubmission = client.entities.WeeklySubmission;
export const StaffRate = client.entities.StaffRate;
export const User = client.entities.User;
