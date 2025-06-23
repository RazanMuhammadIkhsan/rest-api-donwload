import express from 'express';
import cors from 'cors';
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path'
import apiRouter from './router/api-routes.js';

// Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Mengaktifkan CORS untuk semua route
app.use(express.json()); // Mem-parsing body request JSON

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.use('/api', apiRouter);

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});