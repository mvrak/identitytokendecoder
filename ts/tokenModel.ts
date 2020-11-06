import { JWT, Token } from "./token";
import { Key } from "./key";
import { VerifySettings, DecryptSettings } from "./settings";

// Contains raw token string with metadata including title, 
export class TokenModel {
  public id: string;
  public title: string;
  public saved: Date;

  public token: Token;
  public tokenParseError: string;
  public lastValid: Token;
  
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
    this._originalTitle = title;
  }

  public setToken(rawToken: string) {
    if (!!rawToken) {
      try {
        const jwt = new JWT(rawToken);
        this.token = jwt;
        this.lastValid = jwt;
        this.tokenParseError = null;
      } catch (e) {
        this.token = new Token(rawToken);
        this.tokenParseError = e.message;
      }
    } else {
      this.token = new Token("");
      this.tokenParseError = null;
    }
  }

  public isValid(): boolean {
    return !!!this.tokenParseError && this.token.raw.length > 0;
  }

  public isDirty(): boolean {
    return !!!this.saved || this.title !== this._originalTitle || this.token.raw !== this._originalToken;
  }

  public save() {
    this.saved = new Date();
    this._originalToken = this.token.raw;
    this._originalTitle = this.title;
  }

  public discard() {
    this.setToken(this._originalToken ?? "");
    this.title = this._originalTitle;
  }

  public dirtyTitle(): string {
    return this.title + (this.isDirty() ? "*" : "");
  }
}