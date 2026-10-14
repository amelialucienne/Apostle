/* Apostle — construction de la version autonome en un seul fichier.
   node build.js
   Produit dist/apostle-standalone.html, ouvrable par double-clic. */
const fs = require("fs");
const path = require("path");
const R = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");

const html = R("index.html");
const css = R("styles/app.css");
const scripts = [
  "scripts/data-books.js",
  "scripts/data-bible.js",
  "scripts/bible-lsg.js",
  "scripts/bible-kjv.js",
  "scripts/data-strong.js",
  "scripts/ecoute.js",
  "scripts/parser.js",
  "scripts/app.js"
].map(R).join("\n\n");

const corps = html
  .split("<body>")[1]
  .split("</body>")[0]
  .replace(/<script src="[^"]+"><\/script>\s*/g, "")
  .trim();

const bloc = `<style>\n${css}\n</style>\n\n${corps}\n\n<script>\n${scripts}\n</script>\n`;

fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "dist/apostle-standalone.html"),
`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Apostle</title>
<meta name="description" content="Apostle, projection biblique pilotée à la voix pour les cultes.">
</head>
<body>
${bloc}</body>
</html>
`);
fs.writeFileSync(path.join(__dirname, "dist/artifact.html"), `<title>Apostle</title>\n${bloc}`);
console.log("dist/apostle-standalone.html et dist/artifact.html construits.");
