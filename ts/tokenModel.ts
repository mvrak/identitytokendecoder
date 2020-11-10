import { JWEToken, JWT, Token } from "./token";
import { VerifySettings, DecryptSettings } from "./settings";

// Contains raw token string with metadata including title, 
export class TokenModel {
  public id: string;
  public title: string;
  public saved: Date;

  public token: Token;
  public tokenParseError: string;
  
  public encrypted: boolean;
  
  // References to keys
  public verifySettings: VerifySettings;
  public decryptSettings: DecryptSettings;

  // Original values
  private _originalToken: string;
  private _originalTitle: string;

  constructor(id: string, title: string, saved?: Date, rawToken?: string) {
    this.id = id;
    this.title = title;
    this.saved = saved;
    
    this.setToken(rawToken ?? "");
    
    this.verifySettings = new VerifySettings();
    this.decryptSettings = new DecryptSettings();
    
    this._originalToken = rawToken;
    this._originalTitle = title ?? "";
  }

  public setToken(rawToken: string) {
    if (!!rawToken) {
      const numParts = rawToken.split(".").length;

      if (numParts === 3) {
        this.encrypted = false;
        try {
          const jwt = new JWT(rawToken);
          this.token = jwt;
          this.tokenParseError = null;
        } catch (e) {
          this.token = new Token(rawToken);
          this.tokenParseError = e.message;
        }
      } else if (numParts === 5) {
        this.encrypted = true;
        try {
          const jwe = new JWEToken(rawToken);
          this.token = jwe;
          this.tokenParseError = null;
        } catch (e) {
          this.token = new Token(rawToken);
          this.tokenParseError = e.message;
        }
      } else {
        this.token = new Token(rawToken);
        this.encrypted = null;
        this.tokenParseError = "Invalid token - JWTs have 3 or 5 parts separated by '.'";
      }
    } else {
      this.token = new Token("");
      this.tokenParseError = null;
    }
  }

  public setJWE(jwe: JWEToken) {
    this.token = jwe;
    this.tokenParseError = null;
    this.encrypted = !!jwe.decrypted;
  }

  public isValid(): boolean {
    return !!!this.tokenParseError && this.token.raw.length > 0;
  }

  public isDirty(): boolean {
    return !!!this.saved || this.title !== this._originalTitle || this.token.raw !== this._originalToken || this.verifySettings.isDirty() || this.decryptSettings.isDirty();
  }

  public canRead(): boolean {
    return !this.encrypted || this.decryptSettings.decryptionResult === true;
  }

  public save() {
    this.saved = new Date();
    this._originalToken = this.token.raw;
    this._originalTitle = this.title;
    this.verifySettings.save();
    this.decryptSettings.save();
  }

  public discard() {
    this.setToken(this._originalToken ?? "");
    this.title = this._originalTitle;
    this.verifySettings.discard();
    this.decryptSettings.discard();
  }

  public dirtyTitle(): string {
    return this.title + (this.isDirty() ? "*" : "");
  }

  public getJWT(): JWT {
    if (!this.encrypted) {
      return this.token as JWT;
    } else {
      if (this.decryptSettings.decryptionResult === true) {
        return (this.token as JWEToken).decrypted;
      } else {
        return null;
      }
    }
  }
}