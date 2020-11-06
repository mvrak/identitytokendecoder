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

  public verificationResult: boolean | string;

  constructor() {
    this.key = null;
    this.algorithm = SigningAlgorithm.HS256;

    this.autoSelect = true;

    this.addExpiry = false;
    this.validTime = null;
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

  // Encrypt settings
  public autoEncrypt: boolean;

  constructor() {
    this.key = null;
    this.algorithm = EncryptionAlgorithm.A128CBC;

    this.autoSelect = true;
    this.autoEncrypt = false;
  }
}
