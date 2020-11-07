export function formatJson(obj: object): string {
  return JSON.stringify(obj, null, '\t').replace(/\n/g, "<br>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
}

export function displayDate(date: Date): string {
  return !!date ? `Last saved ${date.toLocaleString()}` : "Unsaved";
}

export function displayDateMenu(date: Date): string {
  return !!date ? `${date.toLocaleString()}` : "Unsaved";
}

export function isPem(key: string) {
  return !!key.match(/^-----BEGIN (PUBLIC|RSA PRIVATE) KEY-----.*-----END (PUBLIC|RSA PRIVATE) KEY-----$/);
}

export function parseKey(key: string, lineSep: string): string {
  const pem = key.match(/^-----BEGIN (PUBLIC|RSA PRIVATE) KEY-----(.*)-----END (PUBLIC|RSA PRIVATE) KEY-----$/);
  if (!!pem) {
    return `-----BEGIN ${pem[1]} KEY-----${lineSep}${pem[2].match(/.{1,64}/g).join(lineSep)}${lineSep}-----END ${pem[3]} KEY-----${lineSep}`;
  } else {
    try {
      // See if result is a json object
      return formatJson(JSON.parse(key));
    } catch {
      return key;
    }
  }
}