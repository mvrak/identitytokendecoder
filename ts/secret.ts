import { Token } from "./token";

export class Secret {
  public id: string;
  public title: string;
  public saved?: Date;

  public publicKey?: string;
  public privateKey?: string;

  public associatedTokens?: Token[];

  private _originalPublicKey: string;
  private _originalPrivateKey: string;

  constructor(id: string, title: string, saved?: Date, publicKey?: string, privateKey?: string) {
    this.id = id;
    this.title = title;
    this.saved = saved;
    this.publicKey = publicKey ?? "";
    this.privateKey = privateKey ?? "";
    this._originalPublicKey = publicKey ?? "";
    this._originalPrivateKey = privateKey ?? "";
  }

  public isDirty(): boolean {
    return this.publicKey !== this._originalPublicKey || this.privateKey !== this._originalPrivateKey;
  }

  public save() {
    this.saved = new Date();
    this._originalPublicKey = this.publicKey;
    this._originalPrivateKey = this.privateKey;
  }

  public discard() {
    this.publicKey = this._originalPublicKey ?? "";
    this.privateKey = this._originalPrivateKey ?? "";
  }

  public dirtyTitle(): string {
    return this.title + (this.isDirty() ? "*" : "");
  }
}