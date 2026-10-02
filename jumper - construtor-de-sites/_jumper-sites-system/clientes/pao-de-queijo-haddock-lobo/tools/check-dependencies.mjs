import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
let output;
try {output=execFileSync('npm',['audit','--omit=dev','--json'],{encoding:'utf8'});}
catch(error){output=error.stdout;}
if(!output)throw new Error('npm audit não produziu relatório');
const report=JSON.parse(output);
await fs.writeFile(new URL('../data/visual-review/dependency-audit.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report.metadata,null,2));
if(report.metadata?.vulnerabilities?.total!==0)process.exitCode=1;
