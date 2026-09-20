/** Client-only: shrink a photo to a JPEG data URL that fits in Postgres. */
export function fileToListingImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Pick a photo (JPEG, PNG, or WebP)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process that photo."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const data = canvas.toDataURL("image/jpeg", 0.82);
        if (data.length > 280000) {
          const smaller = canvas.toDataURL("image/jpeg", 0.62);
          if (smaller.length > 280000) {
            reject(new Error("That photo is still too large. Try a tighter crop."));
            return;
          }
          resolve(smaller);
          return;
        }
        resolve(data);
      };
      img.onerror = () => reject(new Error("Could not open that photo."));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
