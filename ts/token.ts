// Contains logic for parsing tokens
import { JWK, JWS } from "node-jose";
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

  public verify(key: string, alg: SigningAlgorithm): Promise<boolean | string> {
    // Check to see if raw secret entered
    if (!key.includes("{")) {
      if (alg.startsWith("HS")) {
        key = `{"kty":"oct","k":"${key}"}`;
      } else {
        return new Promise(resolve => resolve(false));
      }
    }

    const isPem = Utils.isPem(key);
    if (isPem) {
      key = Utils.parseKey(key, "\r\n");
    }

    return new Promise((resolve, _reject) => {
      try {
        (isPem ? JWK.asKey(key, "pem") : JWK.asKey(key)).then((jwk) => {
          try {
            JWS.createVerify(jwk)
              .verify(this.raw)
              .then(() => {
                resolve(true);
              });
          } catch {
            resolve(false);
          }
        });
      } catch {
        resolve("Unable to verify - invalid key");
      }
    });
  }
}

