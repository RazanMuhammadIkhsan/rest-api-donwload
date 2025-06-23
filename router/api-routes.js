import express from 'express';
import { getTikTokVideo, getFacebookVideo, getInstagramVideo, getTwitter } from '../controllers/scrape.js';

const router = express.Router();

router.get('/tiktok', getTikTokVideo);
router.get('/facebook', getFacebookVideo);
router.get('/instagram', getInstagramVideo);
router.get('/twitter', getTwitter);

export default router;