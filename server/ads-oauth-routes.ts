import { Router, Request, Response } from "express";
import { exchangeMetaCode, exchangeGoogleCode, getMetaAdAccount, saveOAuthToken } from "./ads-oauth";

const router = Router();

/**
 * Meta (Facebook) OAuth callback
 * Receives authorization code, exchanges for token, saves to database
 */
router.get("/oauth/facebook/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Meta OAuth] Error:", error);
      return res.redirect("/api-connections?error=meta_auth_failed");
    }

    if (!code) {
      return res.redirect("/api-connections?error=missing_code");
    }

    // Exchange code for access token
    const { accessToken, expiresIn } = await exchangeMetaCode(code);

    // Get ad account info
    const { adAccountId, accountName } = await getMetaAdAccount(accessToken);

    // Save to database
    await saveOAuthToken("meta", {
      accessToken,
      expiresIn,
      adAccountId,
      accountName,
    });

    console.log("[Meta OAuth] Successfully connected:", accountName);

    // Redirect back to API Connections page with success
    res.redirect("/api-connections?success=meta_connected");
  } catch (error: any) {
    console.error("[Meta OAuth] Callback error:", error);
    res.redirect(`/api-connections?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Google Ads OAuth callback
 * Receives authorization code, exchanges for token, saves to database
 */
router.get("/oauth/google/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Google OAuth] Error:", error);
      return res.redirect("/api-connections?error=google_auth_failed");
    }

    if (!code) {
      return res.redirect("/api-connections?error=missing_code");
    }

    // Exchange code for access token
    const { accessToken, refreshToken, expiresIn } = await exchangeGoogleCode(code);

    // Save to database
    await saveOAuthToken("google", {
      accessToken,
      refreshToken,
      expiresIn,
    });

    console.log("[Google OAuth] Successfully connected");

    // Redirect back to API Connections page with success
    res.redirect("/api-connections?success=google_connected");
  } catch (error: any) {
    console.error("[Google OAuth] Callback error:", error);
    res.redirect(`/api-connections?error=${encodeURIComponent(error.message)}`);
  }
});

export default router;
