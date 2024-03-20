import "dotenv/config";

const variables = {};
const varNames = ["SALT_ROUNDS", "MEM_USERNAME", "MEM_PASSWORD", "MEM_SERVER", "SESSION_SECRET"];

for (let varName of varNames) {
  variables[varName] = process.env[varName];
}

export default variables;
