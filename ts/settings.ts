import { Key } from "./key";
import { SigningAlgorithm, EncryptionAlgorithm } from "./token";

export enum SettingsTab {
  Verify = "verify",
  Generate = "generate",
  Decrypt = "decrypt",
  Encrypt = "encrypt"
}

export enum TimeUnit {
  Second = "sec",
  Minute = "min",
  Hour = "hrs"
}

export class VerifySettings {
  // Common settings
  public key: Key;
  public algorithm: SigningAlgorithm;

  // Verify settings
  public autoSelect: boolean;

  // Generate settings
  public addExpiry: boolean;
  public validTime: number;
  public validTimeUnit: TimeUnit;

  // Result
  public verificationResult: boolean | string;

  constructor() {
    this.key = null;
    this.algorithm = SigningAlgorithm.HS256;

    this.autoSelect = true;

    this.addExpiry = false;
    this.validTime = 300;
    this.validTimeUnit = TimeUnit.Second;

    this.verificationResult = null;
  }
}

export class DecryptSettings {
  // Common settings
  public key: Key;
  public algorithm: EncryptionAlgorithm;

  // Decrypt settings
  public autoSelect: boolean;

  // Result
  public decryptionResult: boolean | string;

  constructor() {
    this.key = null;
    this.algorithm = EncryptionAlgorithm.A128CBCN;

    this.autoSelect = true;

    this.decryptionResult = null;
  }
}

export function secondsIn(unit: TimeUnit): number {
  switch (unit) {
    case TimeUnit.Second:
      return 1;
    case TimeUnit.Minute:
      return 60;
    case TimeUnit.Hour:
      return 3600;
    default:
      return 1;
  }
}
