/**
 * Keap OAuth 2.0 Routes
 * 
 * Handles OAuth authorization flow for Keap API integration
 */

import { Router } from 'express';
import { exchangeCodeForToken, getAuthorizationUrl, isKeapConfigured } from './keap';

const router = Router();

/**
 * GET /api/keap/auth
 * Redirects user to Keap authorization page
 */
router.get('/auth', (req, res) => {
  try {
    // Debug logging
    console.log('[Keap OAuth Debug] ENV loaded:', {
      hasClientId: !!process.env.KEAP_CLIENT_ID,
      hasClientSecret: !!process.env.KEAP_CLIENT_SECRET,
      hasAppId: !!process.env.KEAP_APP_ID,
    });
    // Use the current host for redirect URI
    const protocol = req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/api/keap/callback`;
    
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    
    // Store state in session (or could use cookie)
    // For simplicity, we'll skip state validation in this MVP
    
    const authUrl = getAuthorizationUrl(redirectUri, state);
    
    console.log('[Keap OAuth] Redirecting to authorization URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Keap OAuth] Error generating auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authorization URL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/keap/callback
 * Handles OAuth callback from Keap with authorization code
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('[Keap OAuth] Authorization error:', error, error_description);
      return res.status(400).send(`
        <html>
          <head><title>Keap Authorization Failed</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Authorization Failed</h1>
            <p><strong>Error:</strong> ${error}</p>
            <p>${error_description || ''}</p>
            <a href="/api/keap/auth">Try Again</a>
          </body>
        </html>
      `);
    }

    // Validate code parameter
    if (!code || typeof code !== 'string') {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Callback</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Invalid Callback</h1>
            <p>No authorization code received from Keap.</p>
            <a href="/api/keap/auth">Try Again</a>
          </body>
        </html>
      `);
    }

    // Exchange code for tokens
    const protocol = req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/api/keap/callback`;

    console.log('[Keap OAuth] Exchanging code for tokens...');
    await exchangeCodeForToken(code, redirectUri);

    // Success! Redirect to dashboard
    res.send(`
      <html>
        <head><title>Keap Connected</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>✅ Keap Connected Successfully!</h1>
          <p>Your Keap account has been authorized.</p>
          <p>You can now close this window and return to the dashboard.</p>
          <script>
            // Auto-close after 3 seconds
            setTimeout(() => {
              window.close();
              // If window.close() doesn't work (popup blockers), redirect to dashboard
              window.location.href = '/overview';
            }, 3000);
          </script>
          <a href="/overview">Return to Dashboard</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[Keap OAuth] Callback error:', error);
    res.status(500).send(`
      <html>
        <head><title>Keap Authorization Error</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Authorization Error</h1>
          <p>Failed to complete Keap authorization.</p>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/api/keap/auth">Try Again</a>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/keap/status
 * Check if Keap integration is configured and authenticated
 */
router.get('/status', (req, res) => {
  const configured = isKeapConfigured();
  res.json({
    configured,
    message: configured 
      ? 'Keap integration is active' 
      : 'Keap integration not configured. Please authorize at /api/keap/auth'
  });
});

export default router;
