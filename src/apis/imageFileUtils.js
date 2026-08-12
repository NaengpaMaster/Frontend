const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;
const JPEG_QUALITY = 0.82;

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(file) {
  if (!file?.type?.startsWith('image/')) {
    return file;
  }

  const image = await loadImage(file);
  const { width, height } = getResizedDimensions(image.width, image.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
  });

  URL.revokeObjectURL(image.src);

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const compressedName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${compressedName}.jpg`, { type: 'image/jpeg' });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function getResizedDimensions(width, height) {
  const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}
