class Key {
  public id: string;
  public title: string;
  public added: Date;

  public encryptionKey?: string;
  public decryptionKey: string;

  public associatedTokens?: Token[];
}