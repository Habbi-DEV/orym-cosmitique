/**
 * TRAITEMENT AUTOMATIQUE DES IMAGES — resize + compression
 * ----------------------------------------------------------
 * Fait 100% dans le navigateur (Canvas API), aucune dépendance ajoutée.
 * Redimensionne à `maxDimension` px sur le plus grand côté et réencode en
 * JPEG (ou PNG si transparence) à `quality`. Réduit le poids des photos
 * envoyées depuis un téléphone (souvent 4-8 Mo) à quelques centaines de Ko,
 * pour des pages produit plus rapides.
 */

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

export async function compressImage(
  file: File,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
  quality: number = DEFAULT_QUALITY,
): Promise<File> {
  // SVG (vectoriel) et fichiers non-image : on laisse tel quel
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // navigateur/format non supporté → on garde l'original
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, outputType, quality),
  );

  // Si la compression n'apporte rien (photo déjà petite), on garde l'original
  if (!blob || blob.size >= file.size) return file;

  const newName = file.name.replace(/\.\w+$/, outputType === 'image/png' ? '.png' : '.jpg');
  return new File([blob], newName, { type: outputType, lastModified: Date.now() });
}

export async function compressImages(
  files: File[],
  maxDimension?: number,
  quality?: number,
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, maxDimension, quality)));
}
