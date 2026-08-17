export interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
}

/**
 * Default initial seed users - Stored strictly with PBKDF2-HMAC-SHA512 (100.000 iterações + Salt)
 * Zero plaintext credentials in source code.
 */
export const DEFAULT_USERS_DATA: Record<string, UserProfile> = {
  faf: {
    pass: "pbkdf2:100000:f993c2388804608afbca5ef5ac930a4f:f491489449d5bc89911c1fb7cd4adf30fbda83db994c9864b69114bc07b64bb3",
    fullName: "FAF Coffees",
    role: "admin",
  },
  admin: {
    pass: "pbkdf2:100000:aa717f7ef81cf4e862301cd59a4c5436:0a235a73554dec3eb4e1246bc871442da0ff3c952f0fbc5f84dab270156e417c",
    fullName: "Administrador FAF",
    role: "admin",
  },
  joao: {
    pass: "pbkdf2:100000:60dbbcde306dae2a4783c889f18a07f1:d77a1ed6b9d4cb351005102f572d0730d5dfdc37922e7c6a68070a412f2ec2a3",
    fullName: "João Silva",
    role: "user",
  },
  joaomatos: {
    pass: "pbkdf2:100000:55c3fe8597c9daa7967b61c88c3f88e3:53b0b7d89229f277a34fd2fe4387b913959dd92e79272ecf6d057c3e143aa592",
    fullName: "João Matos",
    role: "admin",
  },
  cliente: {
    pass: "pbkdf2:100000:d2be7ee722945230e02a9a94fb9f2fbc:c32aa4c359586239741a4c522c226f1ac451dafa3ba79a05c9693316bbcf31a1",
    fullName: "Cliente Demo",
    role: "client",
    clientName: "BELCO",
  },
};
