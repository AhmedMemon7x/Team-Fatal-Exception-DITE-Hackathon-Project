// Backend demo credentials are injected from an ignored, development-only env file.
// They are shown in the local judge panel and are not included in production builds.
import { liveMode } from '../../services/backendClient';

const configuredBackendAccounts = import.meta.env.DEV ? [
  { role: 'Student', email: import.meta.env.VITE_DEMO_STUDENT_EMAIL, password: import.meta.env.VITE_DEMO_STUDENT_PASSWORD },
  { role: 'Administrator', email: import.meta.env.VITE_DEMO_ADMIN_EMAIL, password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD },
  { role: 'IT Staff', email: import.meta.env.VITE_DEMO_IT_EMAIL, password: import.meta.env.VITE_DEMO_IT_PASSWORD },
  { role: 'Manager', email: import.meta.env.VITE_DEMO_MANAGER_EMAIL, password: import.meta.env.VITE_DEMO_MANAGER_PASSWORD },
].filter(account => account.email && account.password) : [];

// Mock mode keeps its existing public sample identities; backend mode only lists
// the real, seeded local accounts configured above.
const mockAccounts = [
  { role: 'Student', email: 'ahmed@muet.edu.pk', password: 'ahmed12345' },
  { role: 'Administrator', email: 'admin@verification.example', password: 'VerificationOnly123!' },
  { role: 'IT Staff', email: 'sayeel@muet.edu.pk', password: 'ahmed12345' },
  { role: 'Manager', email: 'ali@muet.edu.pk', password: 'ahmed12345' },
] as const;

export const judgeDemoAccounts = liveMode ? configuredBackendAccounts : mockAccounts;
