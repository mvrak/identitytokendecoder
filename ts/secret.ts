class Secret {
  public id: string;
  public title: string;
  public saved: Date;

  public publicKey?: string;
  public privateKey?: string;

  public associatedTokens?: Token[];
}