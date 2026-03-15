import crypto from "node:crypto"
import { RSA_PUBLIC_KEY, RSA_PRIVATE_KEY } from "../../../config/config.service.js"

export const rsaEncrypt = async (plaintext) => {
  const encrypted = crypto.publicEncrypt(
    RSA_PUBLIC_KEY,
    Buffer.from(plaintext)
  );

  return encrypted.toString("base64");
};

export const rsaDecrypt = async (cipherText) => {
  const decrypted = crypto.privateDecrypt(
    RSA_PRIVATE_KEY,
    Buffer.from(cipherText, "base64")
  );

  return decrypted.toString("utf-8");
};
