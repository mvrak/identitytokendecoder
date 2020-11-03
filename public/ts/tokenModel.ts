// Contains raw token string with metadata including title, 
class TokenModel {
    public id: number;
    public title: string;
    public added: Date;
    public rawToken: string;
    
    // References to secrets
    public secret: Secret;
  }