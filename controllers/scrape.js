import axios from 'axios';
import * as cheerio from 'cheerio';
import { SuzakuTeam } from "@suzakuteam/scraper-node";

// TikTok
async function fetchTikTokData(tiktokUrl) {
  if (!/^https:\/\/(vt|www)\.tiktok\.com/.test(tiktokUrl)) {
    // Melempar error agar bisa ditangkap di block catch
    throw new Error('❌ Link TikTok tidak valid!');
  }

  try {
    const res = await axios.post('https://snap-tok.com/api/download', {
      id: tiktokUrl,
      locale: 'id'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://snap-tok.com',
        'Referer': 'https://snap-tok.com/tiktok-downloader'
      }
    });

    const $ = cheerio.load(res.data);

    const videoUrl = $('a[href*="tikcdn.io"]').first().attr('href');
    const username = $('h2').first().text().trim() || 'Tidak diketahui';
    const caption = $('p.maintext, div.text-gray-500').first().text().trim() || 'Tanpa deskripsi';

    if (!videoUrl) {
      throw new Error('❌ Video tidak ditemukan, mungkin private atau SnapTok sedang error.');
    }

    return {
      status: true,
      data: {
        username,
        caption,
        videoUrl
      }
    };

  } catch (err) {
    console.error('Hmm, error senpai:(', err.message);
    // Melempar error lagi untuk ditangani oleh controller
    throw new Error('❌ Gagal mengambil data dari SnapTok.');
  }
}

// Ini adalah fungsi controller yang akan dipanggil oleh router
export const getTikTokVideo = async (req, res) => {
  const { url } = req.query; // Ambil URL dari query parameter

  if (!url) {
    return res.status(400).json({
      status: false,
      error: 'Tolong berikan parameter ?url='
    });
  }

  try {
    const result = await fetchTikTokData(url);
    return res.status(200).json(result);
  } catch (error) {
    // Menangkap semua error yang dilempar dari fetchTikTokData
    return res.status(500).json({
      status: false,
      error: error.message || 'Terjadi kesalahan pada server.'
    });
  }
};

// Facebook
async function fetchFacebookVideo(fbUrl) {
  try {
    const res = await axios.post(
      'https://kithubs.com/api/video/facebook/download',
      { url: fbUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'Accept': '*/*',
          'Referer': 'https://kithubs.com/facebook-video-downloader'
        }
      }
    );

    // Ambil data dari respons API Kithubs
    const { sd_url, hd_url, title } = res.data.data || {};

    if (!sd_url && !hd_url) {
      throw new Error('❌ Tidak ada link video yang ditemukan.');
    }

    // Kembalikan objek sukses
    return {
      status: true,
      data: {
        title: title || 'Tanpa Judul',
        sd_quality: sd_url || null,
        hd_quality: hd_url || null
      }
    };
  } catch (err) {
    console.error("Error saat menghubungi Kithubs:", err.message);
    const errorMessage = err.response?.data?.error || '❌ Gagal menghubungi server Kithubs.';
    // Lempar error agar bisa ditangkap oleh controller utama
    throw new Error(errorMessage);
  }
}

// Controller utama yang akan diekspor
export const getFacebookVideo = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: 'Tolong berikan parameter ?url='
    });
  }

  try {
    const result = await fetchFacebookVideo(url);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
};


// INSTAGRAM
async function getSecurityToken() {
  const { data: html } = await axios.get('https://evoig.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const $ = cheerio.load(html);
  const token =
    $('script:contains("ajax_var")')
      .html()
      ?.match(/"security"\s*:\s*"([a-z0-9]{10,})"/i)?.[1] ||
    html.match(/"security"\s*:\s*"([a-z0-9]{10,})"/i)?.[1] ||
    null;

  if (!token) throw new Error('Gagal mendapatkan token keamanan dari evoig.com');
  return token;
}

// Fungsi utama download IG
export async function getInstagramVideo(req, res) {
  const { url } = req.query;

  if (!url || !url.includes('instagram.com')) {
    return res.status(400).json({
      status: false,
      error: 'Masukkan URL Instagram yang valid di parameter ?url='
    });
  }

  try {
    const token = await getSecurityToken();

    const form = new URLSearchParams();
    form.append('action', 'ig_download');
    form.append('security', token);
    form.append('ig_url', url);

    const { data } = await axios.post(
      'https://evoig.com/wp-admin/admin-ajax.php',
      form,
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'origin': 'https://evoig.com',
          'referer': 'https://evoig.com/',
          'user-agent': 'Mozilla/5.0',
          'x-requested-with': 'XMLHttpRequest'
        }
      }
    );

    const result = data?.data?.data?.[0];
    if (!result || !result.link) {
      throw new Error('Video tidak ditemukan atau mungkin private.');
    }

    return res.status(200).json({
      status: true,
      type: result.type,
      thumb: result.thumb,
      url: result.link
    });
  } catch (error) {
    console.error('❌ Instagram Error:', error.message);
    return res.status(500).json({
      status: false,
      error: error.message || 'Terjadi kesalahan saat mengambil data Instagram.'
    });
  }
}

export async function getTwitter(req, res) {

  const { url } = req.query;

  if (!url || !url.includes('x.com')) {
    return res.status(400).json({
      status: false,
      error: 'Masukkan URL Twitter yang valid di parameter ?url='
    });
  }

  const data = await SuzakuTeam.downloader.twitter(url);
  console.log(data);
  return res.status(200).json({
    status: true,
    data,
  })
}