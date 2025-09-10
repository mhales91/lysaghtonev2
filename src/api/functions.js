// Use dynamic imports to avoid bundling issues on Vercel
let base44Client;

const getBase44Client = async () => {
  if (!base44Client) {
    const { base44 } = await import('./base44Client');
    base44Client = base44;
  }
  return base44Client;
};

export const xeroIntegration = async (...args) => {
  const client = await getBase44Client();
  return client.functions.xeroIntegration(...args);
};

export const openaiChat = async (...args) => {
  const client = await getBase44Client();
  return client.functions.openaiChat(...args);
};

export const openaiAdvanced = async (...args) => {
  const client = await getBase44Client();
  return client.functions.openaiAdvanced(...args);
};

export const timesheetManagement = async (...args) => {
  const client = await getBase44Client();
  return client.functions.timesheetManagement(...args);
};

export const generateTOEPDF = async (...args) => {
  const client = await getBase44Client();
  return client.functions.generateTOEPDF(...args);
};

export const generateSignedDocument = async (...args) => {
  const client = await getBase44Client();
  return client.functions.generateSignedDocument(...args);
};

export const openaiChat_g5 = async (...args) => {
  const client = await getBase44Client();
  return client.functions.openaiChat_g5(...args);
};

export const jobsImport = async (...args) => {
  const client = await getBase44Client();
  return client.functions.jobsImport(...args);
};

export const importCleanedProjects = async (...args) => {
  const client = await getBase44Client();
  return client.functions.importCleanedProjects(...args);
};

