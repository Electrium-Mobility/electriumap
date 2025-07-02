// helper function to save user's first name from profile setup 
let globalFirstName: string = "";

export function setGlobalFirstName(name: string) {
  globalFirstName = name;
}

export function getGlobalFirstName() {
  return globalFirstName;
}