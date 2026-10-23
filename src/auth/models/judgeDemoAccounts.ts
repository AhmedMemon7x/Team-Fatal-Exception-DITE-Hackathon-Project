// Demo credentials are public when placed in a VITE_ variable and end up in the
// browser bundle. Only use disposable judge accounts when enabling production access.
import { liveMode } from '../../services/backendClient';

const demoAccessEnabled = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';

const configuredBackendAccounts = demoAccessEnabled ? [
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

export const judgeDemoAccounts = import.meta.env.DEV
  ? liveMode ? configuredBackendAccounts : mockAccounts
  : liveMode ? configuredBackendAccounts : [];
