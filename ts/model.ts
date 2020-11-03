// Model model

class Model {
    private static readonly maxTokenMenuLength: number = 40;
  
    private static readonly tokenColors: string[] = [
      "w3-text-red",
      "w3-text-blue",
      "w3-text-green",
      "w3-text-orange",
      "w3-text-purple",
      "w3-text-teal",
      "w3-text-blue-gray",
      "w3-text-amber",
      "w3-text-indigo",
      "w3-text-lime"
    ];
  
    private static readonly LocalStorageKey: string = "decoderidentitytokens"; 
  
    private _tokens: TokenModel[];
    private _keys: Key[];
  
    constructor() {
      this._tokens = [
        {
          id: "token1",
          title: "Sample Token",
          added: new Date("1 November, 2020"),
          rawToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODZlZmY0OS00OWQ2LTQ4YjQtODM4NC0yYTA5NDYxODJmN2YiLCJ2YWxpZCI6IjEiLCJ1c2VyaWQiOiIxIiwibmFtZSI6ImJpbGFsIiwiZXhwIjoxNTcwNjMwMzMwLCJpc3MiOiJodHRwOi8vbXlzaXRlLmNvbSIsImF1ZCI6Imh0dHA6Ly9teXNpdGUuY29tIn0.06vzYfiSpj1X9s0-CL2nE7NH4LloASMikZCNfHIJ8tY"
        },
        {
          id: "token2",
          title: "Sample Token 2",
          added: new Date("1 November, 2020"),
          rawToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        }
      ];
      
      this._keys = [
        {
          id: "key1",
          title: "Sample Key",
          added: new Date("1 November, 2020"),
          decryptionKey: "IUzI1NiIsInR5cCI6IkpXVCJ9"
        }
      ];
  
      expandMenu("tokens");
      this._renderKeys();
      this._renderTokens();
  
      this.displayToken("token1")
    }
  
    public displayToken(tokenId: string) {
      let x = document.getElementsByClassName("menu");
      for (let i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" w3-light-grey", "");
      }
      document.getElementById(tokenId).className += " w3-light-grey";
      let token = this._tokens.filter((token) => token.id === tokenId)[0];
      
      let tokenDisplay = document.getElementById("tokenDisplay");
      tokenDisplay.innerHTML = `<br>
      <i class="fa fa-id-card-o w3-animate-top"></i>
      <h5 class="w3-opacity">${token.title}</h5>
      <h4><i class="fa fa-clock-o"></i>${token.added}</h4>
      <a class="w3-button w3-light-grey" href="#">Edit<i class="w3-margin-left fa fa-mail-reply"></i></a>
      <a class="w3-button w3-light-grey" href="#">Delete<i class="w3-margin-left fa fa-arrow-right"></i></a>
      <hr>
      <div style="width:100%" contenteditable="true" oninput="onTokenChange()" id="rawToken"></div>
      <div style="width:100%" contenteditable="false" id="tokenMessage"></div>
      <div style="width:100%" contenteditable="false" id="decodedToken"></div>
      <div style="width:100%" contenteditable="false" id="claimsTable"></div>`;
      document.getElementById("rawToken").innerHTML = this._displayColorCodedToken(token.rawToken);
      this._renderTokenDetails(token.rawToken);
    }
  
    public displayKey(keyId: string) {
      let x = document.getElementsByClassName("menu");
      for (let i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" w3-light-grey", "");
      }
      document.getElementById(keyId).className += " w3-light-grey";
    }
    
    public onTokenChange() {
      const tokenString =  document.getElementById("rawToken");
      tokenString.innerHTML = this._displayColorCodedToken(tokenString.textContent);
      this._renderTokenDetails(tokenString.textContent);
    }
  
    private _renderTokenDetails(rawToken: string) {
      const decodedToken = document.getElementById("decodedToken");
      const tokenMessage = document.getElementById("tokenMessage");
      const claimsTable = document.getElementById("claimsTable");
      try {
        const jwt = new JWT(rawToken);
        decodedToken.innerHTML = this._displayDecodedToken(jwt);
        claimsTable.innerHTML = this._displayClaimsTable(jwt);

        const issuer = getIssuerDetails(jwt.payload["iss"]);
        if (!!issuer) {
          tokenMessage.innerHTML = issuingProviderDescriptions[issuer];
        } else {
          tokenMessage.innerHTML = "<br>";
        }
      } catch (e) {
        tokenMessage.innerHTML = e.message;
      }
    }

    private _displayDecodedToken(token: JWT): string {
      const header = this.formatJson(token.header);
      const payload = this.formatJson(token.payload);
      return `<span class="w3-text-red">${header}</span>.<span class="w3-text-blue">${payload}</span>.<span class="w3-text-green">[Signature]</span>`;
    }

    private _displayClaimsTable(token: JWT): string {
      return `<table class="w3-table">
      <tr>
        <th>Claim type</th>
        <th>Value</th>
        <th>Notes</th>
      </tr>
      ${this._getTableContents(token.payload)}
      </table>`;
    }

    private _getTableContents(payload: object): string {
      let contents = "";
      for (const claimType in payload) {
        const value = payload[claimType];
        const notes = claimTypeDescriptions[claimType] ?? "";
        const displayValue = translateClaimsValue(claimType, value);
        contents += `<tr><td>${claimType}</td><td>${displayValue}</td><td>${notes}</td></tr>`
      }
      return contents;
    }

    private _truncate(item: string): string {
      if (item.length > Model.maxTokenMenuLength) {
        item = item.slice(0, Model.maxTokenMenuLength - 3) + "...";
      }
      return item;
    }
  
    private _renderTokens() {
      let tokensDiv = document.getElementById("tokens");
    
      this._tokens.forEach(token => {
        tokensDiv.innerHTML +=
        `<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom menu w3-hover-light-grey" onclick="displayToken('${token.id}');w3_close();" id="${token.id}">
        <div class="w3-container">
            <i class="w3-margin-right fa fa-id-card-o w3-animate-top"></i><span class="w3-opacity w3-large">${token.title}</span>
            <h6>${token.added}</h6>
            <p>${this._displayColorCodedToken(this._truncate(token.rawToken))}</p>
        </div>
        </a>`
      }); 
    }
    
    private _renderKeys() {
      let keysDiv = document.getElementById("keys");
      
      this._keys.forEach(key => {
          keysDiv.innerHTML +=
          `<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom menu w3-hover-light-grey" onclick="displayKey('${key.id}');w3_close();" id="${key.id}">
          <div class="w3-container">
              <i class="w3-margin-right fa fa-id-card-o w3-animate-top"></i><span class="w3-opacity w3-large">${key.title}</span>
              <h6>${key.added}</h6>
              <p>${key.decryptionKey}</p>
          </div>
          </a>`
      });
    }
  
    private _displayColorCodedToken(rawToken: string): string {
      const segments = rawToken.split(".");
      let coloredstring = "";
      for (let i = 0; i < segments.length; i++) {
        coloredstring += `<span class='${Model.tokenColors[i]}'>${segments[i]}</span>.`;
      }
      return coloredstring.slice(0, -1);
    }
    
    private formatJson(obj: object): string {
      return JSON.stringify(obj, null, 4).replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
    }
  
    private _purgeAll(){
      this._purgeDisplay();
      this._purgeLocalStorage();
    }
    
    private _purgeDisplay() {
      //tbd
    }
  
    private _purgeLocalStorage() {
      //tbd
      localStorage.removeItem(Model.LocalStorageKey);
    }
  }
  