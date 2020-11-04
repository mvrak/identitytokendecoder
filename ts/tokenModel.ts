// Contains raw token string with metadata including title, 
class TokenModel {
  public id: string;
  public title: string;
  public saved: Date;
  public rawToken: string;
  
  // References to keys
  public key?: Secret;
}