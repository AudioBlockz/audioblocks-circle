export function replaceSpecialCharacters(str: string): string {
  return str.replace(/[^a-zA-Z0-9_]/g, "_");
}

export function generateRandomSongTitle(length = 10) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let title = '';

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      title += characters[randomIndex];
  }

  return title;
}


export function generateRandomFileName(originalName: string, length = 10): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomName = '';

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomName += characters[randomIndex];
  }

  const filename = replaceSpecialCharacters(originalName)

  // Preserve the file extension from the original name if it exists
  const extension = originalName.split('.').pop(); // Get the file extension
  return `${filename}_${randomName}${extension ? '.' + extension : ''}`; // Append extension if it exists
}
