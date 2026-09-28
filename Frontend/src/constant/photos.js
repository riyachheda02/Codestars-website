// Dynamically import all event photos from 2025 and 2026 subdirectories
const imageModules = import.meta.glob('../assets/{2025,2026}/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

// Format filename into metadata
function formatMeta(path) {
  const parts = path.split('/');
  const filename = parts[parts.length - 1];
  const year = path.includes('2026') ? '2026' : '2025';
  const cleanName = filename
    .replace(/\.[^/.]+$/, '')
    .replace(/\(\d+\)/g, '')
    .replace(/_/g, ' ')
    .trim();

  const formattedName = cleanName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: formattedName,
    year,
    path,
  };
}

export const heroPhotos = Object.entries(imageModules).map(([path, url], index) => {
  const meta = formatMeta(path);
  return {
    id: `photo-${index}`,
    url,
    title: meta.title,
    year: meta.year,
  };
});

export const photos2026 = heroPhotos.filter((p) => p.year === '2026');
export const photos2025 = heroPhotos.filter((p) => p.year === '2025');

export const photosByYear = {
  '2026': photos2026,
  '2025': photos2025,
};

export default heroPhotos;
