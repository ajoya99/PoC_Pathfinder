const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;
const rootDir = __dirname;
app.use(express.static(rootDir, {
  extensions: ["html"],
  setHeaders(res, filePath) {
    if (filePath.endsWith(".csv")) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
    }
  }
}));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Pathfinder PoC listening on port ${port}`);
});