const model = new Model();

function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
  document.getElementById("myOverlay").style.display = "block";
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("myOverlay").style.display = "none";
}

function expandMenu(id: string) {
  let x = document.getElementById(id);
  if (x.className.indexOf("w3-show") == -1) {
    x.className += " w3-show"; 
    x.previousElementSibling.className += " w3-red";
  } else { 
    x.className = x.className.replace(" w3-show", "");
    x.previousElementSibling.className = 
    x.previousElementSibling.className.replace(" w3-red", "");
  }
}

function onTokenChange() {
  model.onTokenChange();
}

function displayToken(tokenId: string) {
  model.displayToken(tokenId);
}

function displaySecret(keyId: string) {
  model.displaySecret(keyId);
}

function openTab(tabName: string) {
  model.openTab(tabName);
}
