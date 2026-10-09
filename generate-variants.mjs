import fs from 'fs';
import path from 'path';

// Read the original Pixel matcha component
const original = fs.readFileSync('./src/components/backgrounds/Pixelmatcha.tsx', 'utf8');

// Variants to generate:
// 1. "Pixel Obsidian" - premium dark aesthetic (deep blacks, subtle dark blues/purples)
// 2. "Pixel Lavender" - soft pastel purple/pink tones
// 3. "Pixel Ember" - warm amber/orange sunset tones

const variants = [
  {
    name: 'Pixelobsidian',
    label: 'Pixel obsidian',
    bgColor: '#0a0a12',
    // Shift greens to deep dark blues/purples
    transform: (r, g, b) => {
      const intensity = (r + g + b) / (3 * 255);
      // Map to very dark blues and purples
      const newR = Math.round(10 + intensity * 35);
      const newG = Math.round(10 + intensity * 25);
      const newB = Math.round(20 + intensity * 55);
      return [newR, newG, newB];
    }
  },
  {
    name: 'Pixellavender',
    label: 'Pixel lavender',
    bgColor: '#2a1a3e',
    // Shift greens to soft purple/lavender tones
    transform: (r, g, b) => {
      const intensity = (r + g + b) / (3 * 255);
      const newR = Math.round(80 + intensity * 140);
      const newG = Math.round(60 + intensity * 100);
      const newB = Math.round(120 + intensity * 135);
      return [newR, newG, newB];
    }
  },
  {
    name: 'Pixelember',
    label: 'Pixel ember',
    bgColor: '#1a0a05',
    // Shift greens to warm amber/orange tones
    transform: (r, g, b) => {
      const intensity = (r + g + b) / (3 * 255);
      const newR = Math.round(40 + intensity * 215);
      const newG = Math.round(15 + intensity * 120);
      const newB = Math.round(5 + intensity * 40);
      return [newR, newG, newB];
    }
  }
];

const outDir = './src/components/backgrounds';

for (const variant of variants) {
  let content = original;
  
  // Replace the component name
  content = content.replace(/function Pixelmatcha\(\)/, `function ${variant.name}()`);
  
  // Replace the background color
  content = content.replace(/background: #12A06C/, `background: ${variant.bgColor}`);
  
  // Replace the aria-label
  content = content.replace(/aria-label="Pixel matcha"/, `aria-label="${variant.label}"`);
  
  // Replace all rgb(r,g,b) fill colors
  content = content.replace(/rgb\((\d+),(\d+),(\d+)\)/g, (match, r, g, b) => {
    const [newR, newG, newB] = variant.transform(parseInt(r), parseInt(g), parseInt(b));
    return `rgb(${newR},${newG},${newB})`;
  });

  // Also handle fill="#XXXXXX" hex colors for the seam lines — keep them as-is or adjust opacity
  // For obsidian, make seams even more subtle
  if (variant.name === 'Pixelobsidian') {
    content = content.replace(/fill-opacity="0.12"/g, 'fill-opacity="0.06"');
  }

  fs.writeFileSync(path.join(outDir, variant.name + '.tsx'), content);
  console.log(`Generated ${variant.name}.tsx`);
}

// Update the index.ts to include new exports
const indexPath = path.join(outDir, 'index.ts');
const currentIndex = fs.readFileSync(indexPath, 'utf8');
let newIndex = currentIndex;
for (const variant of variants) {
  const exportLine = `export { default as ${variant.name} } from './${variant.name}';`;
  if (!newIndex.includes(exportLine)) {
    newIndex += '\n' + exportLine;
  }
}
fs.writeFileSync(indexPath, newIndex);
console.log('Updated index.ts');
console.log('Done!');
