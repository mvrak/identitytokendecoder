class Token {
  public raw: string;
  
  constructor(token: string) {
    this.raw = token;
  }
}

// Pure JWTs
class JWT extends Token {
  public header: object;
  public payload: object;
  public signature: string;

  constructor(token: string) {
    super(token);

    const parts = token.split(".");

    if (parts.length != 3) {
      throw new Error("Invalid token - JWTs have 3 parts separated by '.'");
    }

    this.header = JSON.parse(atob(parts[0]));
    this.payload = JSON.parse(atob(parts[1]));
    this.signature = parts[2];
  }
}