// Contains logic for parsing tokens
import { JWK, JWS } from "node-jose";
import { Key } from "./key";
import { KeyFetch } from "./keyFetch";
import * as Utils from "./utils";

export enum SigningAlgorithm {
  HS256 = "HS256",
  HS384 = "HS384",
  HS512 = "HS512",
  RS256 = "RS256",
  RS384 = "RS384",
  RS512 = "RS512"
}

export enum EncryptionAlgorithm {
  A128CBC = "A128CBC-HS256"
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

  constructor(token: string) {
    super(token);

    const parts = token.split(".");

    if (parts.length != 3) {
      throw new Error("Invalid token - JWTs have 3 parts separated by '.'");
    }

    try {
      this.header = JSON.parse(atob(parts[0]));
    } catch {
      throw new Error("Invalid token - header could not be parsed");
    }

    try {
      this.payload = JSON.parse(atob(parts[1]));
    } catch {
      throw new Error("Invalid token - payload could not be parsed");
    }

    this.signature = parts[2];
  }

  private async _getKey(key: string, alg: SigningAlgorithm): Promise<JWK.Key> {
    // Check to see if raw secret
    let isPem = false;
    try {
      JSON.parse(key);
    } catch {
      if (alg?.startsWith("HS")) {
        key = `{"kty":"oct","k":"${key}"}`;
      } else {
        isPem = Utils.isPem(key);
        if (isPem) {
          key = Utils.parseKey(key, "\r\n");
        } else {
          return null;
        }
      }
    }

    try {
      return await (isPem ? JWK.asKey(key, "pem") : JWK.asKey(key));
    } catch {
      return null;
    }
  }

  private _toCompact(): string {
    return `${btoa(JSON.stringify(this.header))}.${btoa(JSON.stringify(this.payload))}.${this.signature}`.replace(/=/g, "");
  }

  public setAlg(alg: string) {
    this.header["alg"] = alg;
    this.raw = this._toCompact();
  }

  public setPayload(payload: object) {
    this.payload = payload;
    this.raw = this._toCompact();
  }

  public async verify(key: string, alg: SigningAlgorithm): Promise<boolean | string> {
    // Try and get key
    const jwk = await this._getKey(key, alg);
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

  public async searchAndVerify(keys: Key[], alg: SigningAlgorithm, keyFetch: KeyFetch): Promise<[boolean | string, Key]> {
    // Check if there is a token with a matching kid
    const keyPromises = keys.filter(key => !!key.publicKey).map(key => this._getKey(key.publicKey, alg).then(jwk => {
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

  public async generate(key: string, alg: SigningAlgorithm, validFor?: number) {
    const jwk = await this._getKey(key, alg);

    if (!!!jwk) {
      throw new Error("Could not generate token: Invalid Key");
    }

    const headers = this.header;
    headers["alg"] = alg;
    
    const payload = this.payload;
    if (!!validFor) {
      const iat = Math.round(new Date().getTime() / 1000);
      payload["iat"] = iat;
      payload["nbf"] = iat;
      payload["exp"] = iat + validFor;
    }

    try {
      const compact = await JWS.createSign({format: "compact", fields: headers}, jwk).final(JSON.stringify(payload));
      this.raw = compact;

      const parts = compact.split(".");

      this.header = JSON.parse(atob(parts[0]));
      this.payload = JSON.parse(atob(parts[1]));
      this.signature = parts[2];
    } catch (e) {
      throw new Error(`Count not generate token: ${e.message}`);
    }
  }
}

