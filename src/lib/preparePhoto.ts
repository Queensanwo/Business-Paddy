/** Reduce large JPEG photos in the browser before uploading. Other formats stay intact. */
export async function preparePhoto(file: File): Promise<File> {
  if (file.type !== 'image/jpeg' || file.size < 1024 * 1024) return file;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve(); image.onerror = () => reject(new Error('Image decode failed'));
      image.src = url;
    });
    // Avoid allocating an additional canvas for unusually large images.
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) return file;
    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    canvas.width = 0; canvas.height = 0;
    if (!compressed || compressed.size >= file.size) return file;
    return new File([compressed], file.name, { type: compressed.type, lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function uploadAttachment<T>(file: File, onProgress: (percent: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/uploads');
    request.timeout = 120000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    };
    request.onload = () => {
      let result;
      try { result = JSON.parse(request.responseText); }
      catch { reject(new Error('The server could not accept the upload. Try a smaller file.')); return; }
      if (request.status < 200 || request.status >= 300) reject(new Error(result.error || 'Upload failed.'));
      else resolve(result as T);
    };
    request.onerror = () => reject(new Error('Connection interrupted. Check your internet and try attaching the file again.'));
    request.ontimeout = () => reject(new Error('Upload timed out. Try a smaller file or a stronger connection.'));
    request.onabort = () => reject(new Error('Upload cancelled.'));
    const data = new FormData(); data.append('file', file); request.send(data);
  });
}
