// Model model

class Model {
  private static readonly maxTokenMenuLength: number = 35;

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

  private _tokens: TokenModel[];
  private _secrets: Secret[];

  private _current: TokenModel | Secret;

  private _settingsTab: string;

  private _storage: StorageHelper;

  constructor() {
    this._storage = new StorageHelper();

    // TODO: Do token retrieval from local storage
    // const storedValues = this._storage.retrieveAll();
    // [this._tokens, this._secrets] = storedValues[0];

    this._tokens = [
      new TokenModel("token1", "Sample Token", new Date("1 November, 2020"), "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODZlZmY0OS00OWQ2LTQ4YjQtODM4NC0yYTA5NDYxODJmN2YiLCJ2YWxpZCI6IjEiLCJ1c2VyaWQiOiIxIiwibmFtZSI6ImJpbGFsIiwiZXhwIjoxNTcwNjMwMzMwLCJpc3MiOiJodHRwOi8vbXlzaXRlLmNvbSIsImF1ZCI6Imh0dHA6Ly9teXNpdGUuY29tIn0.06vzYfiSpj1X9s0-CL2nE7NH4LloASMikZCNfHIJ8tY"),
      new TokenModel("token2", "Sample Token 2", new Date("1 November, 2020"), "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
    ];
    
    this._secrets = [
      new Secret("secret1", "Sample Key", new Date("1 November, 2020"), "IUzI1NiIsInR5cCI6IkpXVCJ9")
    ];

    this._settingsTab = "verify";

    expandMenu("tokens");
    this._renderTokens();
    this._renderSecrets();

    this.displayToken("token1");
  }

  public displayToken(tokenId: string) {
    this._highlightMenuItem(tokenId);
    let token = this._tokens.filter((token) => token.id === tokenId)[0];
    this._current = token;
    
    document.getElementById("tokensDisplay").style.display = "block";
    document.getElementById("secretsDisplay").style.display = "none";
    
    document.getElementById("tokenTitle").innerHTML = token.dirtyTitle();
    document.getElementById("tokenLastSaved").innerHTML = displayDate(token.saved);
    document.getElementById("rawToken").innerHTML = this._displayColorCodedToken(token.rawToken);
    this._renderTokenDetails(token?.rawToken);
    
    this.openTab(this._settingsTab);

    this._enableTokenButtons(token);
  }
  
  public displaySecret(secretId: string) {
    this._highlightMenuItem(secretId);
    let secret = this._secrets.filter((secret) => secret.id === secretId)[0];
    this._current = secret;
    
    document.getElementById("tokensDisplay").style.display = "none";
    document.getElementById("secretsDisplay").style.display = "block";

    document.getElementById("secretTitle").innerHTML = secret.dirtyTitle();
    document.getElementById("secretLastSaved").innerHTML = displayDate(secret.saved);
    document.getElementById("publicKey").innerHTML = secret.publicKey ?? "";
    document.getElementById("privateKey").innerHTML = secret.privateKey ?? "";

    // Enable/disable buttons
    this._enableSecretButtons(secret);
  }
  
  public newToken() {
    const id = this._getNewTokenId();
    const newToken = new TokenModel(id, "New Token");
    this._tokens.push(newToken);
    this._renderNewToken(newToken);
    this.displayToken(id);
  }

  public newSecret() {
    const id = this._getNewSecretId();
    const newSecret = new Secret(id, "New Secret");
    this._secrets.push(newSecret);
    this._renderNewSecret(newSecret);
    this.displaySecret(id);
  }

  public onTokenChange() {
    const rawTokenDiv = document.getElementById("rawToken");
    const tokenString = rawTokenDiv.textContent;

    const currentToken = this._current as TokenModel;
    currentToken.rawToken = tokenString;

    document.getElementById("tokenTitle").innerHTML = currentToken.dirtyTitle();
    rawTokenDiv.innerHTML = this._displayColorCodedToken(tokenString);
    this._renderTokenDetails(tokenString);
    this._reRenderToken(currentToken);
    
    // Enable/disable buttons
    this._enableTokenButtons(currentToken);
  }

  public onSecretChange() {
    const publicKeyDiv = document.getElementById("publicKey");
    const privateKeyDiv = document.getElementById("privateKey");
    
    const publicKey = publicKeyDiv.textContent;
    const privateKey = privateKeyDiv.textContent;

    const currentSecret = this._current as Secret;
    currentSecret.publicKey = publicKey;
    currentSecret.privateKey = privateKey;

    document.getElementById("secretTitle").innerHTML = currentSecret.dirtyTitle();
    this._reRenderSecret(currentSecret);

    // Enable/disable buttons
    this._enableSecretButtons(currentSecret);
  }

  public onTokenSave() {
    const currentToken = this._current as TokenModel;
    currentToken.save();

    this._storage.saveToken(currentToken);

    this._onSaveDiscardToken(currentToken);
    this._enableTokenButtons(currentToken);
  }
  
  public onTokenDiscard() {
    const currentToken = this._current as TokenModel;
    currentToken.discard();
    
    this._onSaveDiscardToken(currentToken);
    this._enableTokenButtons(currentToken);
  }
  
  public onTokenDelete() {
    const currentToken = this._current as TokenModel;
    
    let index = this._tokens.indexOf(currentToken);
    this._tokens.splice(index, 1);
    
    this._renderTokens();
    if (this._tokens.length > 0) {
      if (index >= this._tokens.length) {
        index = this._tokens.length - 1;
      }
      this.displayToken(this._tokens[index].id);
    } else {
      this.newToken();
    }
  }

  public onSecretSave() {
    const currentSecret = this._current as Secret;
    currentSecret.save();

    this._storage.saveSecret(currentSecret);

    this._onSaveDiscardSecret(currentSecret);
    this._enableSecretButtons(currentSecret);
  }
  
  public onSecretDiscard() {
    const currentSecret = this._current as Secret;
    currentSecret.discard();

    this._onSaveDiscardSecret(currentSecret);
    this._enableSecretButtons(currentSecret);
  }
  
  public onSecretDelete() {
    const currentSecret = this._current as Secret;
    
    let index = this._secrets.indexOf(currentSecret);
    this._secrets.splice(index, 1);
    
    this._renderSecrets();
    if (this._secrets.length > 0) {
      if (index >= this._secrets.length) {
        index = this._secrets.length - 1;
      }
      this.displaySecret(this._secrets[index].id);
    } else {
      this.newSecret();
    }
  }

  public purgeAll() {
    this._tokens = [];
    this._secrets = [];
    this._settingsTab = "Verify";
    this._storage.purgeLocalStorage();
    this._renderTokens();
    this._renderSecrets();
    this.newToken();
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
    const header = formatJson(token.header);
    const payload = formatJson(token.payload);
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

  private _renderToken(token: TokenModel): string {
    return `<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom menu w3-hover-light-grey" onclick="displayToken('${token.id}');w3_close();" id="${token.id}">
    ${this._renderTokenInner(token)}
    </a>`; 
  }
  
  private _renderSecret(secret: Secret): string {
    return `<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom menu w3-hover-light-grey" onclick="displaySecret('${secret.id}');w3_close();" id="${secret.id}">
    ${this._renderSecretInner(secret)}
    </a>`;
  }

  private _renderTokenInner(token: TokenModel): string {
    return `<div class="w3-container">
      <i class="w3-margin-right fa fa-id-card-o"></i><span class="w3-opacity w3-large">${token.dirtyTitle()}</span>
      <h6 class="w3-opacity">${displayDateMenu(token.saved)}</h6>
      <p>${this._displayColorCodedToken(this._truncate(token.rawToken))}</p>
    </div>`; 
  }
  
  private _renderSecretInner(secret: Secret): string {
    return `<div class="w3-container">
      <i class="w3-margin-right fa fa-id-card-o"></i><span class="w3-opacity w3-large">${secret.dirtyTitle()}</span>
      <h6 class="w3-opacity">${displayDateMenu(secret.saved)}</h6>
      <p>${secret.publicKey}</p>
    </div>`;
  }

  private _renderTokens() {
    const tokensDiv = document.getElementById("tokens");
    tokensDiv.innerHTML = "";

    this._tokens.forEach(token => {
      tokensDiv.innerHTML += this._renderToken(token);
    }); 
  }
  
  private _renderSecrets() {
    const secretsDiv = document.getElementById("secrets");
    secretsDiv.innerHTML = "";

    this._secrets.forEach(secret => {
      secretsDiv.innerHTML += this._renderSecret(secret);
    });
  }

  private _renderNewToken(token: TokenModel) {
    const tokensDiv = document.getElementById("tokens");
    tokensDiv.innerHTML += this._renderToken(token);
  }
  
  private _renderNewSecret(secret: Secret) {
    const secretsDiv = document.getElementById("secrets");
    secretsDiv.innerHTML += this._renderSecret(secret);
  }

  private _reRenderToken(token: TokenModel) {
    document.getElementById(token.id).innerHTML = this._renderTokenInner(token);
  }

  private _reRenderSecret(secret: Secret) {
    document.getElementById(secret.id).innerHTML = this._renderSecretInner(secret);
  }

  private _onSaveDiscardToken(token: TokenModel) {
    document.getElementById("tokenTitle").innerHTML = token.dirtyTitle();
    document.getElementById("tokenLastSaved").innerHTML = displayDate(token.saved);
    document.getElementById("rawToken").innerHTML = this._displayColorCodedToken(token.rawToken);
    this._reRenderToken(token);
    this._renderTokenDetails(token.rawToken);
  }

  private _onSaveDiscardSecret(secret: Secret) {
    document.getElementById("secretTitle").innerHTML = secret.dirtyTitle();
    document.getElementById("tokenLastSaved").innerHTML = displayDate(secret.saved);
    document.getElementById("publicKey").innerHTML = secret.publicKey ?? "";
    document.getElementById("privateKey").innerHTML = secret.privateKey ?? "";
    this._reRenderSecret(secret);
  }

  private _displayColorCodedToken(rawToken: string): string {
    const segments = rawToken.split(".");
    let coloredstring = "";
    for (let i = 0; i < segments.length; i++) {
      coloredstring += `<span class='${Model.tokenColors[i]}'>${segments[i]}</span>.`;
    }
    return coloredstring.slice(0, -1);
  }

  private _getNewTokenId(): string {
    let i = 1;
    while (true) {
      const id = `token${i}`;
      if (!!!this._tokens.find(token => token.id === id)) {
        return id;
      }
      i++;
    }
  }

  private _getNewSecretId(): string {
    let i = 1;
    while (true) {
      const id = `secret${i}`;
      if (!!!this._secrets.find(secret => secret.id === id)) {
        return id;
      }
      i++;
    }
  }

  private _enableTokenButtons(token: TokenModel) {
    const dirty = token.isDirty();
    const notEmpty = !!token.saved || token.rawToken.length > 0;
    this._enableButton("tokenSave", dirty);
    this._enableButton("tokenDiscard", dirty && notEmpty);
    this._enableButton("tokenDelete", notEmpty || this._tokens.length > 1);
  }

  private _enableSecretButtons(secret: Secret) {
    const dirty = secret.isDirty();
    const notEmpty = !!secret.saved || secret.publicKey.length > 0 || secret.privateKey.length > 0;
    this._enableButton("secretSave", dirty);
    this._enableButton("secretDiscard", dirty && notEmpty);
    this._enableButton("secretDelete", notEmpty || this._secrets.length > 1);
  }

  private _enableButton(id: string, enable: boolean) {
    let x = document.getElementById(id);
    if (enable) {
      // Remove w3-disabled
      x.className = x.className.replace(" w3-disabled", "");
    } else if (x.className.indexOf("w3-disabled") === -1) { 
      x.className += " w3-disabled";
    }
  }
}
