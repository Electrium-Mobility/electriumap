// helper function to save user's first name from profile setup 
let globalFirstName: string = "";
export function setGlobalFirstName(name: string) {
  globalFirstName = name;
}

export function getGlobalFirstName() {
  return globalFirstName;
}

// status flag to check if user is authenticated via Firebase 
let isAuthenticated: boolean = false; 
export function setIsAuthenticated(status: boolean){ 
  return isAuthenticated = status 
}

export function getIsAuthenticated() { 
  return isAuthenticated
}