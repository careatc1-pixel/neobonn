// Reads a browser File into { name, mimeType, base64 }, ready to send
// to the Apps Script backend (which decodes it and saves to Drive).
// Throws a short, user-facing message string on failure/oversize.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB per photo
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30MB for the video

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result looks like "data:<mime>;base64,<data>"
      const base64 = String(reader.result).split(",")[1] || "";
      resolve({ name: file.name, mimeType: file.type || "application/octet-stream", base64 });
    };
    reader.onerror = () => reject(new Error(`Couldn't read "${file.name}". Please try a different file.`));
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file) {
  if (!file.type.startsWith("image/")) return `"${file.name}" isn't an image file.`;
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" is too large — please keep photos under 5MB.`;
  return null;
}

export function validateVideoFile(file) {
  if (!file.type.startsWith("video/")) return `"${file.name}" isn't a video file.`;
  if (file.size > MAX_VIDEO_BYTES) return `"${file.name}" is too large — please keep the video under 30MB.`;
  return null;
}
