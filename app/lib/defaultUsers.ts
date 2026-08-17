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
    pass: "pbkdf2:100000:4f92ae70a5fa009e5fb24b3b92f96842:646a70655cf6634cd87d0d54193d5ab708f48c50322eb5aab7d1ab0bdc3d262a",
    fullName: "FAF Coffees",
    role: "admin",
  },
  admin: {
    pass: "pbkdf2:100000:dbb253f7f4c8130c6559dfb97e8013f5:09df696fd1d2a26d3eeeb62525a940b16489cab67005fab2efd6aea802737a62",
    fullName: "Administrador FAF",
    role: "admin",
  },
  joao: {
    pass: "pbkdf2:100000:2de2b239f8083dcca27b518bd54b7043:d33dddddedc1139899e4ef7af3e35d70596f7d3df3174468d7763e8eb1de299f",
    fullName: "João Silva",
    role: "user",
  },
  joaomatos: {
    pass: "pbkdf2:100000:1042ec3fe336cc1b2a422cf382b85669:1b2d6e34f00dd14e3b5996f606a0e2177a58ceaf5919ad1abb90a0fd0454e5ef",
    fullName: "João Matos",
    role: "admin",
  },
  cliente: {
    pass: "pbkdf2:100000:17b497e2fd6e34501391532a22e95743:3601c557d74715739725260ee2d66f7feb8dc383175426ebdc2042c497b60637",
    fullName: "Cliente Demo",
    role: "client",
    clientName: "BELCO",
  },
};
