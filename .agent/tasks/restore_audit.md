# Audit Feature Restoration Plan

The goal is to restore the "Audit IA" functionality in the `copy-of-siam-visa-pro---audit-ai` application. The feature was failing due to an invalid/missing API key.

## Steps

- [ ] **Update Configuration**: Update `.env.local` with the valid Gemini API key provided by the user. <!-- id: 0 -->
- [ ] **Restart Server**: Restart the Vite development server to load the new environment variables. <!-- id: 1 -->
- [ ] **Verify Fix**: Use a browser agent to perform a complete test of the audit flow:
    1.  Load the application.
    2.  Check for initialization errors.
    3.  Select a Visa Type (e.g., "Tourisme").
    4.  Verify the chat agent responds correctly instead of throwing an error. <!-- id: 2 -->
