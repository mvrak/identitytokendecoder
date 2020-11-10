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

  // Original values
  private _originalKey: Key;
  private _originalAutoSelect: boolean;
  private _originalAddExpiry: boolean;
  private _originalValidTime: number;
  private _originalValidTimeUnit: TimeUnit;

  // Result
  public verificationResult: boolean | string;

  constructor(key?: Key, autoSelect?: boolean, addExpiry?: boolean, validTime?: number, validTimeUnit?: TimeUnit) {
    this.key = key ?? null;
    this.algorithm = SigningAlgorithm.HS256;

    this.autoSelect = autoSelect ?? true;

    this.addExpiry = addExpiry ?? false;
    this.validTime = validTime ?? 300;
    this.validTimeUnit = validTimeUnit ?? TimeUnit.Second;

    this.verificationResult = null;

    this.save();
  }

  public isDirty(): boolean {
    return (this.autoSelect !== this._originalAutoSelect) ||
      (!this.autoSelect && !this._originalAutoSelect && this.key !== this._originalKey) ||
      (this.addExpiry !== this._originalAddExpiry) || (this.validTime !== this._originalValidTime) ||
      (this.validTimeUnit !== this._originalValidTimeUnit);
  }

  public save() {
    this._originalKey = this.key;
    this._originalAutoSelect = this.autoSelect;
    this._originalAddExpiry = this.addExpiry;
    this._originalValidTime = this.validTime;
    this._originalValidTimeUnit = this.validTimeUnit;
  }

  public discard() {
    this.key = this._originalKey;
    this.autoSelect = this._originalAutoSelect;
    this.addExpiry = this._originalAddExpiry;
    this.validTime = this._originalValidTime;
    this.validTimeUnit = this._originalValidTimeUnit;
  }

  public setAlg(algorithm: SigningAlgorithm) {
    this.algorithm = algorithm;
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

  // Original values
  private _originalKey: Key;
  private _originalAutoSelect: boolean;

  constructor(key?: Key, autoSelect?: boolean) {
    this.key = key ?? null;
    this.algorithm = EncryptionAlgorithm.A128CBCN;

    this.autoSelect = autoSelect ?? true;

    this.decryptionResult = null;

    this.save();
  }

  public isDirty(): boolean {
    return (this.autoSelect !== this._originalAutoSelect) ||
      (!this.autoSelect && !this._originalAutoSelect && this.key !== this._originalKey);
  }

  public save() {
    this._originalKey = this.key;
    this._originalAutoSelect = this.autoSelect;
  }

  public discard() {
    this.key = this._originalKey;
    this.autoSelect = this._originalAutoSelect;
  }

  public setAlg(algorithm: EncryptionAlgorithm) {
    this.algorithm = algorithm;
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
