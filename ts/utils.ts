export function formatJson(obj: object): string {
  return JSON.stringify(obj, null, '\t').replace(/\n/g, "<br>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
}

export function displayDate(date: Date): string {
  return !!date ? `Last saved ${date.toLocaleString()}` : "Unsaved";
}

export function displayDateMenu(date: Date): string {
  return !!date ? `${date.toLocaleString()}` : "Unsaved";
}