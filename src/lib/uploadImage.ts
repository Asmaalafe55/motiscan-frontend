import { getApiBaseUrl } from '@/lib/getApiBaseUrl';

const API_URL = getApiBaseUrl();

/**
 * Upload one or more image files to the backend.
 * Returns the array of public URLs assigned by the server.
 *
 * Usage:
 *   const [url] = await uploadImages([file]);
 */
export async function uploadImages(files: File[]): Promise<string[]> {
  const form = new FormData();
  for (const file of files) {
    form.append('images', file);
  }

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Image upload failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { urls: string[] };
  return data.urls;
}
