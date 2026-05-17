const SECRET_KEY = "blank_page_stealth_key_2026";

export const obfuscate = (text: string): string => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(encodeURIComponent(result));
};

export const deobfuscate = (encoded: string): string => {
  try {
    const decoded = decodeURIComponent(atob(encoded));
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    console.error("De-obfuscation failed:", e);
    return "";
  }
};
