export interface CompressImageOptions {
  maxDimension?: number;
  targetMaxBytes?: number;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    image.src = objectUrl;
  });
}

function toWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const maxDimension = options.maxDimension ?? 1600;
  const targetMaxBytes = options.targetMaxBytes ?? 900 * 1024;

  try {
    const image = await loadImageFromFile(file);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return file;

    const dimensions = [maxDimension, 1280, 1024, 800];
    const qualities = [0.82, 0.74, 0.66, 0.58, 0.5];

    let bestBlob: Blob | null = null;

    for (const dimension of dimensions) {
      const scale = Math.min(1, dimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await toWebpBlob(canvas, quality);
        if (!blob) continue;

        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
        }

        if (blob.size <= targetMaxBytes) {
          const webpName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          return new File([blob], webpName, {
            type: "image/webp",
            lastModified: Date.now(),
          });
        }
      }
    }

    if (!bestBlob || bestBlob.size >= file.size) {
      return file;
    }

    const webpName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([bestBlob], webpName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
