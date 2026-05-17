const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "12345";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_FILE = process.env.DB_FILE || path.join(__dirname, "data.db");
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT NOT NULL,
      ip TEXT
    )
  `);
});

function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Нужен пароль');
  }
  const [type, credentials] = authHeader.split(' ');
  if (type !== 'Basic') return res.status(401).send('Ошибка типа');
  
  const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':');
  
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Неверный логин или пароль');
}

app.post("/api/requests", (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ ok: false, error: "Заполните поля" });

  const date = new Date().toLocaleString("ru-RU");
  const ip = req.ip;

  const stmt = db.prepare("INSERT INTO requests (name, phone, created_at, ip) VALUES (?, ?, ?, ?)");
  stmt.run(name, phone, date, ip, function(err) {
    if (err) return res.status(500).json({ ok: false, error: "Ошибка БД" });
    res.json({ ok: true, id: this.lastID });
  });
  stmt.finalize();
});

app.get("/admin", checkAuth, (req, res) => {
  db.all("SELECT * FROM requests ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.send("Ошибка базы данных");
    
    let htmlRows = rows.map(r => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #333">${r.id}</td>
        <td style="padding:8px; border-bottom:1px solid #333">${r.created_at}</td>
        <td style="padding:8px; border-bottom:1px solid #333; font-weight:bold">${r.name}</td>
        <td style="padding:8px; border-bottom:1px solid #333; color:#4f8ff7">${r.phone}</td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Админка - Заявки</title>
        <style>
          body { background: #111; color: #fff; font-family: sans-serif; padding: 40px; }
          h1 { color: #4f8ff7; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #222; }
          th { text-align: left; padding: 10px; background: #333; color: #aaa; }
        </style>
      </head>
      <body>
        <h1>Заявки с сайта Konstrukt Mebel</h1>
        <table>
          <thead>
            <tr><th>ID</th><th>Дата</th><th>Имя</th><th>Телефон</th></tr>
          </thead>
          <tbody>${htmlRows || '<tr><td colspan="4">Заявок пока нет</td></tr>'}</tbody>
        </table>
      </body>
      </html>
    `);
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен! Сайт: http://localhost:${PORT}`);
  console.log(`Админка: http://localhost:${PORT}/admin`);
});