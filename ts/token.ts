// Contains logic for parsing tokens
import * as Jose from "node-jose";

export enum SigningAlgorithm {
  HS256 = "HS256",
  RS256 = "RS256"
}

export enum EncryptionAlgorithm {
  A128CBC = "A128CBC-HS256"
}

export class Token {
  public raw: string;
  
  constructor(token: string) {
    this.raw = token;
  }

  public verify(_key: string) {
    return false;
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

  public verify(key: string): boolean {
    return false;
  }
}

