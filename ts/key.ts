class Key {
  public id: string;
  public title: string;
  public saved: Date;

  public encryptionKey?: string;
  public decryptionKey: string;

  public associatedTokens?: Token[];
}