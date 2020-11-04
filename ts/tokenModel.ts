// Contains raw token string with metadata including title, 
class TokenModel {
  public id: string;
  public title: string;
  public saved?: Date;
  public rawToken: string;
  
  // References to keys
  public signingKey?: Secret;
  public encryptionKey?: Secret;

  // Original values
  private _originalToken: string;

  constructor(id: string, title: string, saved?: Date, rawToken?: string) {
    this.id = id;
    this.title = title;
    this.saved = saved;
    this.rawToken = rawToken ?? "";
    this._originalToken = rawToken ?? null;
  }

  public isDirty(): boolean {
    return this.rawToken !== this._originalToken;
  }

  public save() {
    this.saved = new Date();
    this._originalToken = this.rawToken;
  }

  public discard() {
    this.rawToken = this._originalToken ?? "";
  }

  public dirtyTitle(): string {
    return this.title + (this.isDirty() ? "*" : "");
  }
}