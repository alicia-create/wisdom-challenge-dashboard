import { Router } from 'express';

const router = Router();

router.get('/test-env', (req, res) => {
  res.json({
    KEAP_CLIENT_ID: process.env.KEAP_CLIENT_ID ? `${process.env.KEAP_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
    KEAP_CLIENT_SECRET: process.env.KEAP_CLIENT_SECRET ? '***' + process.env.KEAP_CLIENT_SECRET.slice(-4) : 'NOT SET',
    KEAP_APP_ID: process.env.KEAP_APP_ID || 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('KEAP')),
  });
});

export default router;
