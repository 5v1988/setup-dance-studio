#!/usr/bin/env node
import { promisify } from "util";
import cp from "child_process";
import path from "path";
import fs from "fs";
// cli spinners
import ora from "ora";

// convert libs to promises
const exec = promisify(cp.exec);
const rm = promisify(fs.rm);

if (process.argv.length < 3) {
  console.log("You have to provide a name to your project.");
  console.log("For example :");
  console.log("    npx setup-dance-studio dancing-project");
  process.exit(1);
}

const projectName = process.argv[2];
const currentPath = process.cwd();
const projectPath = path.join(currentPath, projectName);
const gitRepo = "https://github.com/5v1988/demo-dancing-yaml.git";

// create project directory
if (fs.existsSync(projectPath)) {
  console.log(`The file ${projectName} already exist in the current directory, please give it another name.`);
  process.exit(1);
}
else {
  fs.mkdirSync(projectPath);
}

try {
  const gitSpinner = ora("Downloading files...").start();
  // clone the repo into the project folder -> creates the new boilerplate
  await exec(`git clone --depth 1 ${gitRepo} ${projectPath} --quiet`);
  gitSpinner.succeed();

  const cleanSpinner = ora("Removing unwanted files").start();
  // remove my git history
  const rmGit = rm(path.join(projectPath, ".git"), { recursive: true, force: true });
  // remove the installation file
  const rmBin = rm(path.join(projectPath, "bin"), { recursive: true, force: true });
  await Promise.all([rmGit, rmBin]);

  process.chdir(projectPath);
  // remove the packages needed for cli
  await exec("npm uninstall ora cli-spinners");
  cleanSpinner.succeed();

  const npmSpinner = ora("Installing dependencies...").start();
  await exec("npm install");
  npmSpinner.succeed();

  await exec("npm update");
  npmSpinner.succeed();

  await exec("npx playwright install");
  npmSpinner.succeed();

  console.log('The project setup is completed!');
  console.log('Next steps: 1. Run example tests using the below command:');
  console.log(`                cd ${projectName} && npm run test`);
  console.log('            2. Build your own tests, by following the steps mentioned here:');
  console.log('                https://github.com/5v1988/demo-dancing-yaml');

} catch (error) {
  // clean up in case of error, so the user does not have to do it manually
  fs.rmSync(projectPath, { recursive: true, force: true });
  console.log(error);
}