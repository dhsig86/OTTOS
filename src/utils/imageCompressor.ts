export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    // Se não for imagem web (ex: PDF ou formatos exóticos), passa reto
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      return resolve(file);
    }
    
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Mantém a proporção da imagem
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converte para JPG (reduz muito o peso de PNGs transparentes ou fotos grandes de celular)
      canvas.toBlob((blob) => {
        if (blob) {
          // O blob final compactado
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(newFile);
        } else {
          resolve(file); // Fallback de emergência
        }
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback de emergência
    };
  });
}
