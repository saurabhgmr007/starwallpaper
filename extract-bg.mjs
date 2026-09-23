import fs from 'fs';
import path from 'path';

const files = [
  'Untitled blend.html',
  'Glassy mint.html',
  'Moonlit.html',
  'New York.html',
  'Night sky.html'
];

const outDir = './src/components/backgrounds';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

let exportsList = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  const html = fs.readFileSync(file, 'utf8');

  // Remove the FeralUI branding tags if any
  let cleanHtml = html.replace(/<g id="(Ethereal|NEW YORK|FeralUI)[^>]*>[\s\S]*?<\/g>/gi, '');

  const styleMatch = cleanHtml.match(/<style>([\s\S]*?)<\/style>/);
  const styleContent = styleMatch ? styleMatch[1] : '';

  const divMatch = cleanHtml.match(/<div class="gradient"[\s\S]*?<\/div>/);
  const divContent = divMatch ? divMatch[0] : '';

  const componentName = file.replace('.html', '').replace(/ /g, '');
  
  const reactComponent = "import React from 'react';\n\n" +
"export default function " + componentName + "() {\n" +
"  return (\n" +
"    <>\n" +
"      <style dangerouslySetInnerHTML={{ __html: `" + styleContent + "` }} />\n" +
"      <div dangerouslySetInnerHTML={{ __html: `" + divContent.replace(/`/g, '\\`') + "` }} />\n" +
"    </>\n" +
"  );\n" +
"}\n";

  fs.writeFileSync(path.join(outDir, componentName + '.tsx'), reactComponent);
  exportsList.push(componentName);
}

// Generate an index file
const indexContent = exportsList.map(name => "export { default as " + name + " } from './" + name + "';").join('\n');
fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent);

console.log('Background components generated!');
