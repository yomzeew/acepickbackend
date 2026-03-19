import crypto from "crypto"
import config from "../config/configSetup"

const SECRET_KEY = Buffer.from(config.CRYPTO_SECRET_KEY || 'thisisaverysecurekey123456789012', "utf8").subarray(0, 32);
const IV = Buffer.from(config.CRYPTO_IV || '1234567890123456', "utf8").subarray(0, 16);


export const encryptMessage = (message: string) => {
    const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
};


export const decryptMessage = (encryptedData: string): string => {
    try {
        const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
        let decrypted = decipher.update(encryptedData, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch {
        // Message was stored as plain text or encrypted with a different key
        return encryptedData;
    }
};

