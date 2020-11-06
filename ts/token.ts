// Contains logic for parsing tokens
import { JWK, JWS } from "node-jose";
import { Key } from "./key";
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

  public async verify(key: string, alg: SigningAlgorithm): Promise<boolean | string> {
    // Check to see if raw secret 
    try {
      JSON.parse(key);
    } catch {
      if (alg?.startsWith("HS")) {
        key = `{"kty":"oct","k":"${key}"}`;
      } else {
        return false;
      }
    }

    const isPem = Utils.isPem(key);
    if (isPem) {
      key = Utils.parseKey(key, "\r\n");
    }

    try {
      const jwk = await (isPem ? JWK.asKey(key, "pem") : JWK.asKey(key));
      try {
        await JWS.createVerify(jwk).verify(this.raw)
        return true;
      } catch {
        return false;
      }
    } catch {
      return "Unable to verify - invalid key";
    }
  }

  public async searchAndVerify(keys: Key[], alg: SigningAlgorithm): Promise<Key> {
    const promises = keys.filter(key => !!key.publicKey).map(key => this.verify(key.publicKey, alg));

    const results = await Promise.all(promises);
    
    const index = results.indexOf(true);
    return index !== -1 ? keys[index] : null;
  }
}

