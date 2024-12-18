import fs from "fs/promises";
import path from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import remarkFrontmatter from "remark-frontmatter";

const baseTemplate = await fs.readFile("templates/article-temp.html", "utf-8");

async function convertMarkdownToHtml(markdown) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkHtml)
    .process(markdown);

  return result.toString();
}

async function generateIndex(distPath) {
  const files = await fs.readdir(distPath);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));

  const links = htmlFiles
    .map((file) => {
      const name = path.basename(file, ".html");
      return `<li><a href="./${file}">${name}</a></li>`;
    })
    .join("\n");

  const indexHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Индекс сайта</title>
    <style>
        body {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            margin: 10px 0;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>Список страниц</h1>
    <ul>
        ${links}
    </ul>
</body>
</html>`;

  await fs.writeFile(path.join(distPath, "_index.html"), indexHtml);
  console.log("Индексный файл создан");
}

async function generateSite() {
  try {
    await fs.mkdir("dist", { recursive: true });

    const files = await fs.readdir("content");
    const markdownFiles = files.filter((file) => file.endsWith(".md"));

    for (const file of markdownFiles) {
      const content = await fs.readFile(path.join("content", file), "utf-8");

      const htmlContent = await convertMarkdownToHtml(content);

      const title = path.basename(file, ".md");
      const finalHtml = baseTemplate
        .replace("{{title}}", title)
        .replace("{{content}}", htmlContent);

      const outputPath = path.join("dist", `${title}.html`);
      await fs.writeFile(outputPath, finalHtml);

      console.log(`Сгенерирован файл: ${outputPath}`);
    }

    generateIndex("dist");

    console.log("Генерация сайта завершена успешно!");
  } catch (error) {
    console.error("Ошибка при генерации сайта:", error);
  }
}

generateSite();
