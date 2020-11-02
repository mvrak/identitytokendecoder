export class Token {

    public raw: string;
    
    constructor(token: string) {
        this.raw = token;
    }
}

// Pure JWTs
export class JWT extends Token {
    public header: string;
    public payload: string;
    public signature: string;

    constructor(token: string) {
        super(token);

        const parts = token.split(".");

        if (parts.length != 3) {
            throw new Error("Invalid token - JWTs have 3 parts separated by '.'");
        }

        this.header = atob(parts[0]);
        this.payload = atob(parts[1]);
        this.signature = atob(parts[2]);
    }
}