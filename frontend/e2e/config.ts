// Shared by the E2E backend script, playwright.config.ts and the tests.
export const E2E_API_PORT = 8001;
export const E2E_SITE_PORT = 3002;
export const E2E_API = `http://127.0.0.1:${E2E_API_PORT}/api/v1`;
export const E2E_SITE = `http://127.0.0.1:${E2E_SITE_PORT}`;

/** The administrator seeded into the test database (not the real shop admin). */
export const E2E_ADMIN = { email: "e2e.admin@bakhtstroy.test", password: "E2eAdmin2026x" };
