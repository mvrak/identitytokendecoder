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
  private _secrets: Secret[];

  private _settingsTab: string;

  constructor() {
    this._tokens = [
      {
        id: "token1",
        title: "Sample Token",
        saved: new Date("1 November, 2020"),
        rawToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODZlZmY0OS00OWQ2LTQ4YjQtODM4NC0yYTA5NDYxODJmN2YiLCJ2YWxpZCI6IjEiLCJ1c2VyaWQiOiIxIiwibmFtZSI6ImJpbGFsIiwiZXhwIjoxNTcwNjMwMzMwLCJpc3MiOiJodHRwOi8vbXlzaXRlLmNvbSIsImF1ZCI6Imh0dHA6Ly9teXNpdGUuY29tIn0.06vzYfiSpj1X9s0-CL2nE7NH4LloASMikZCNfHIJ8tY"
      },
      {
        id: "token2",
        title: "Sample Token 2",
        saved: new Date("1 November, 2020"),
        rawToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
      }
    ];
    
    this._secrets = [
      {
        id: "secret1",
        title: "Sample Key",
        saved: new Date("1 November, 2020"),
        publicKey: "IUzI1NiIsInR5cCI6IkpXVCJ9"
      }
    ];

    this._settingsTab = "verify";

    expandMenu("tokens");
    this._renderTokens();
    this._renderSecrets();

    this.displayToken("token1")
  }

  public displayToken(tokenId: string) {
    this._highlightMenuItem(tokenId);
    let token = this._tokens.filter((token) => token.id === tokenId)[0];

    document.getElementById("tokensDisplay").style.display = "block";
    document.getElementById("secretsDisplay").style.display = "none";

    if (!!token) {
      document.getElementById("tokenTitle").innerHTML = token.title;
      document.getElementById("tokenLastSaved").innerHTML = `Last saved ${token.saved.toLocaleString()}`;
      document.getElementById("rawToken").innerHTML = this._displayColorCodedToken(token.rawToken);
      this._renderTokenDetails(token.rawToken);
    } else {
      document.getElementById("tokenTitle").innerHTML = "New Token";
      document.getElementById("tokenLastSaved").innerHTML = "Unsaved"
      document.getElementById("rawToken").innerHTML = "";
      this._renderTokenDetails("");
    }

    this.openTab(this._settingsTab);
  }

  public displaySecret(secretId: string) {
    this._highlightMenuItem(secretId);
    let secret = this._secrets.filter((secret) => secret.id === secretId)[0];

    document.getElementById("tokensDisplay").style.display = "none";
    document.getElementById("secretsDisplay").style.display = "block";

    document.getElementById("secretTitle").innerHTML = secret.title;
    document.getElementById("secretLastSaved").innerHTML = `Last saved ${secret.saved.toLocaleString()}`;
  }
  
  public onTokenChange() {
    const tokenString =  document.getElementById("rawToken");
    if (tokenString.textContent.length > 0) {
      tokenString.innerHTML = this._displayColorCodedToken(tokenString.textContent);
      this._renderTokenDetails(tokenString.textContent);
    }
  }

  public openTab(tabName: string) {
    // Get all elements with class="tabcontent" and hide them
    let tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
      (tabcontent[i] as HTMLElement).style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName + "-btn").className += " active";

    this._settingsTab = tabName;
  }

  private _highlightMenuItem(id: string) {
    let x = document.getElementsByClassName("menu");
    for (let i = 0; i < x.length; i++) {
      x[i].className = x[i].className.replace(" w3-light-grey", "");
    }
    let y = document.getElementById(id);
    if (!!y) {
      y.className += " w3-light-grey";
    }
  }

  private _renderTokenDetails(rawToken: string) {
    const decodedToken = document.getElementById("decodedToken");
    const tokenMessage = document.getElementById("tokenMessage");
    const claimsTable = document.getElementById("claimsTable");
    if (!!rawToken) {
      try {
        const jwt = new JWT(rawToken);
        decodedToken.innerHTML = this._displayDecodedToken(jwt);
        claimsTable.innerHTML = this._displayClaimsTable(jwt);
  
        const issuer = getIssuerDetails(jwt.payload["iss"]);
        if (!!issuer) {
          tokenMessage.innerHTML = issuingProviderDescriptions[issuer];
        } else {
          tokenMessage.innerHTML = "This token is valid";
        }
      } catch (e) {
        tokenMessage.innerHTML = `<span class="w3-text-red">${e.message}</span>`;
      }
    } else {
      decodedToken.innerHTML = "";
      claimsTable.innerHTML = `<table class="w3-table-all">
      <tr>
        <th width="20%">Claim type</th>
        <th width="30%">Value</th>
        <th width="50%">Notes</th>
      </tr>
      </table>`;
      tokenMessage.innerHTML = "";
    }
  }

  private _displayDecodedToken(token: JWT): string {
    const header = this.formatJson(token.header);
    const payload = this.formatJson(token.payload);
    return `<span class="w3-text-red">${header}</span>.<span class="w3-text-blue">${payload}</span>.<span class="w3-text-green">[Signature]</span>`;
  }

  private _displayClaimsTable(token: JWT): string {
    return `<table class="w3-table-all">
    <tr>
      <th width="20%">Claim type</th>
      <th width="30%">Value</th>
      <th width="50%">Notes</th>
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
        <h6 class="w3-opacity">${token.saved.toLocaleString()}</h6>
        <p>${this._displayColorCodedToken(this._truncate(token.rawToken))}</p>
      </div>
      </a>`
    }); 
  }
  
  private _renderSecrets() {
    let secretsDiv = document.getElementById("secrets");
    
    this._secrets.forEach(secret => {
      secretsDiv.innerHTML +=
      `<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom menu w3-hover-light-grey" onclick="displaySecret('${secret.id}');w3_close();" id="${secret.id}">
      <div class="w3-container">
        <i class="w3-margin-right fa fa-id-card-o w3-animate-top"></i><span class="w3-opacity w3-large">${secret.title}</span>
        <h6 class="w3-opacity">${secret.saved.toLocaleString()}</h6>
        <p>${secret.publicKey}</p>
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
    return JSON.stringify(obj, null, '\t').replace(/\n/g, "<br>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
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
