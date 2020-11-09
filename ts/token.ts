// Contains logic for parsing tokens
import { JWK, JWS, JWE } from "node-jose";
import { Key } from "./key";
import { KeyFetch } from "./keyFetch";
import * as Utils from "./utils";

export enum SigningAlgorithm {
  HS256 = "HS256",
  HS384 = "HS384",
  HS512 = "HS512",
  RS256 = "RS256",
  RS384 = "RS384",
  RS512 = "RS512",
  PS256 = "PS256",
  PS384 = "PS384",
  PS512 = "PS512"
}

export enum EncryptionAlgorithm {
  A256GCM = "A256GCM",
  A128CBCN = "A128CBC-HS256",
  A128CBCP = "A128CBC+HS256"
}

export class Token {
  public raw: string;
  
  constructor(token: string) {
    this.raw = token;
  }
}

// Pure JWTs
export class JWT extends Token {
  public header: object;
  public payload: object;
  public signature: string;

  constructor(raw: string) {
    super(raw);

    const parts = raw.split(".");

    if (parts.length != 3) {
      throw new Error("Invalid token - JWTs have 3 parts separated by '.'");
    }

    try {
      this.header = JSON.parse(atob(parts[0]));
    } catch {
      throw new Error("Invalid token - Header could not be parsed");
    }

    try {
      this.payload = JSON.parse(atob(parts[1]));
    } catch {
      throw new Error("Invalid token - Payload could not be parsed");
    }

    this.signature = parts[2];
  }

  private _toCompact(): string {
    return `${btoa(JSON.stringify(this.header))}.${btoa(JSON.stringify(this.payload))}.${this.signature}`.replace(/=/g, "");
  }

  public setAlg(alg: string) {
    this.header["alg"] = alg;
    this.raw = this._toCompact();
  }

  public setHeader(header: object) {
    this.header = header;
    this.raw = this._toCompact();
  }

  public setPayload(payload: object) {
    this.payload = payload;
    this.raw = this._toCompact();
  }

  public async verify(key: string): Promise<boolean | string> {
    // Try and get key
    const jwk = await getKey(key);
    if (!!!jwk) {
      return "Unable to verify - invalid key";
    }

    try {
      await JWS.createVerify(jwk).verify(this.raw)
      return true;
    } catch {
      return false;
    }
  }

  public async searchAndVerify(keys: Key[], keyFetch: KeyFetch): Promise<[boolean | string, Key]> {
    // Check if there is a token with a matching kid
    const keyPromises = keys.filter(key => !!key.publicKey).map(key => getKey(key.publicKey).then(jwk => {
      return { jwk: jwk, key: key };
    }));

    const jwks = (await Promise.all(keyPromises)).filter((jwk) => !!jwk.jwk);

    const kid = this.header["kid"];
    if (!!kid) {
      // Get key with matching kid
      const kidMatch = jwks.find((jwk) => jwk.jwk.kid === kid);
      if (!!kidMatch) {
        try {
          await JWS.createVerify(kidMatch.jwk).verify(this.raw);
          return [true, kidMatch.key];
        } catch {
          return [false, kidMatch.key];
        }
      }
    }

    // No key with matching kid
    // Try verification with all
    const verifyPromises = jwks.map(async (jwk) => {
      try {
        await JWS.createVerify(jwk.jwk).verify(this.raw);
        return jwk.key;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(verifyPromises);

    const found = results.find(r => !!r);
    if (!!found) {
      return [true, found];
    }

    const iss = this.payload["iss"];
    if (!!kid && !!iss) {
      // Check keyFetch
      const fetchedKey = await keyFetch.fetch(iss, kid);
      if (!!fetchedKey) {
        try {
          await JWS.createVerify(fetchedKey.jwk).verify(this.raw);
          return [true, fetchedKey.key];
        } catch {
          return [false, fetchedKey.key];
        }
      }
    }

    return ["Unable to verify - no key", null];
  }

  public async generate(key: string, validFor?: number) {
    const jwk = await getKey(key);

    if (!!!jwk) {
      throw new Error("Could not generate token: Invalid Key");
    }

    const header = this.header;
    const payload = this.payload;
    if (!!validFor) {
      const iat = Math.round(new Date().getTime() / 1000);
      payload["iat"] = iat;
      payload["nbf"] = iat;
      payload["exp"] = iat + validFor;
    }

    try {
      const compact = await JWS.createSign({format: "compact", fields: header}, jwk).final(JSON.stringify(payload));
      this.raw = compact;

      const parts = compact.split(".");

      this.header = JSON.parse(atob(parts[0]));
      this.payload = JSON.parse(atob(parts[1]));
      this.signature = parts[2];
    } catch (e) {
      throw new Error(`Count not generate token: ${e.message}`);
    }
  }

  public async encrypt(key: string, alg: EncryptionAlgorithm): Promise<JWE> {
    const jwk = await getKey(key);

    if (!!!jwk) {
      throw new Error("Could not encrypt token: Invalid Key");
    }
    
    try {
      const jweString = await JWE.createEncrypt({format: "compact", fields: { typ: "JWT", enc: alg }}, jwk).final(this.raw);
      return new JWEToken(jweString, this);
    } catch (e) {
      throw new Error(`Could not encrypt token: ${e.message}`);
    }
  }
}

export class JWEToken extends Token {
  public decrypted: JWT;

  public header: object;

  constructor(raw: string, decrypted?: JWT) {
    super(raw);

    const parts = raw.split(".");

    if (parts.length != 5) {
      throw new Error("Invalid token - JWEs have 5 parts separated by '.'");
    }

    try {
      this.header = JSON.parse(atob(parts[0]));
    } catch {
      throw new Error("Invalid token - Header could not be parsed");
    }

    this.decrypted = decrypted;
  }

  public async decrypt(key: string): Promise<true | string> {
    const jwk = await getKey(key);

    if (!!!jwk) {
      return "Could not decrypt token - Invalid Key";
    }

    const ks = JWK.createKeyStore();
    await ks.add(jwk);

    try {
      const result = await JWE.createDecrypt(ks).decrypt(this.raw);
      this.decrypted = new JWT(result.payload.toString());
      return true;
    } catch {
      return "Could not decrypt token - Decryption Failure";
    }
  }

  public async searchAndDecrypt(keys: Key[]): Promise<[true | string, Key]> {
    const keyPromises = keys.filter(key => !!key.privateKey).map(key => getKey(key.privateKey).then(jwk => {
      return { jwk: jwk, key: key };
    }));

    const jwks = (await Promise.all(keyPromises)).filter((jwk) => !!jwk.jwk);

    const kid = this.header["kid"];
    if (!!kid) {
      // Get key with matching kid
      const kidMatch = jwks.find((jwk) => jwk.jwk.kid === kid);
      if (!!kidMatch) {
        try {
          const ks = JWK.createKeyStore();
          await ks.add(kidMatch.jwk);
          const result = await JWE.createDecrypt(ks).decrypt(this.raw);
          this.decrypted = new JWT(result.payload.toString());
          return [true, kidMatch.key];
        } catch {
          return ["Could not decrypt token - Decryption Failure", kidMatch.key];
        }
      }
    }

    // No key with matching kid
    // Try decryption with all
    const decryptPromises = jwks.map(async (jwk) => {
      try {
        const ks = JWK.createKeyStore();
        await ks.add(jwk.jwk);
        const result =await JWE.createDecrypt(ks).decrypt(this.raw);
        this.decrypted = new JWT(result.payload.toString());
        return jwk.key;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(decryptPromises);

    const found = results.find(r => !!r);
    if (!!found) {
      return [true, found];
    } else {
      return ["Could not decrypt token - No Key Found", null];
    }
  }
}

async function getKey(key: string): Promise<JWK.Key> {
  // Check to see if raw secret
  let isPem = false;
  try {
    JSON.parse(key);
  } catch {
    isPem = Utils.isPem(key);
    if (isPem) {
      key = Utils.parseKey(key, "\r\n");
    } else {
      key = `{"kty":"oct","k":"${key}"}`;
    }
  }

  try {
    return await (isPem ? JWK.asKey(key, "pem") : JWK.asKey(key));
  } catch {
    return null;
  }
}