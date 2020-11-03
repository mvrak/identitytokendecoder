// Contains raw token string with metadata including title, 
class TokenModel {
    public id: string;
    public title: string;
    public added: Date;
    public rawToken: string;
    
    // References to keys
    public key?: Key;
  }