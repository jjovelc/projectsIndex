// Modified version: preserves full functionality and adds abbreviation table
const fs = require('fs');

async function main() {
  try {
    console.log("Starting GitHub Lab Index Generator...");

    const inputFile = process.argv[2] || 'new_names_repos_250327.md';
    if (!fs.existsSync(inputFile)) {
      console.error(`ERROR: Input file '${inputFile}' not found`);
      return;
    }

    const fileContent = fs.readFileSync(inputFile, 'utf8');
    const repos = parseRepoList(fileContent);
    console.log(`Found ${repos.length} repositories in the input file`);

    const content = generateIndexContent(repos);
    fs.writeFileSync('README.md', content);
    console.log("README.md has been created successfully!");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

function parseRepoList(content) {
  const repositories = [];
  const sections = content.split(/----------/);

  sections.forEach(section => {
    section = section.trim();
    if (!section) return;

    const lines = section.split('\n').map(line => line.trim());
    const repoMatch = lines[0].match(/^(\d+\.\s+)?(.+)$/);
    if (!repoMatch) return;

    const repoName = repoMatch[2].trim();
    let project = '';
    let pi = '';
    let researcher = '';
    let url = '';

    lines.forEach(line => {
      if (line.startsWith('PROJECT:')) {
        project = line.replace('PROJECT:', '').trim();
      } else if (line.startsWith('PI:')) {
        pi = line.replace('PI:', '').trim();
      } else if (line.startsWith('RES:')) {
        researcher = line.replace('RES:', '').trim();
      } else if (line.startsWith('URL:')) {
        url = line.replace('URL:', '').trim();
      }
    });

    repositories.push({
      name: repoName,
      project,
      pi,
      researcher,
      url
    });
  });

  return repositories;
}

function generateIndexContent(repos) {
  const piRepos = {};
  const abbreviations = new Map();

  repos.forEach(repo => {
    const parts = repo.name.split('_');
    if (parts.length >= 3) {
      const abbreviation = parts[parts.length - 1];
      if (!abbreviations.has(abbreviation)) {
        abbreviations.set(abbreviation, "");
      }
    }

    if (!piRepos[repo.pi]) {
      piRepos[repo.pi] = [];
    }

    piRepos[repo.pi].push(repo);
  });

  let content = `![Lab Projects Index Banner](bio-banner-3.jpg)\n\n`;
  content += `# Projects Index\n\n`;
  content += `## About This Repository\n`;
  content += `This index provides links to all lab projects organized by Principal Investigator. Each repository follows our naming convention:\n`;
  content += '`SURNAME+Initial of PI_SURNAME+Initial of researcher_project abbreviation`\n\n';
  content += `## Projects by Principal Investigator\n\n`;

  const sortedPIs = Object.keys(piRepos).sort();
  sortedPIs.forEach(pi => {
    content += `### ${pi}\n\n`;
    content += `| Repository | Researcher | Project | URL |\n`;
    content += `|------------|------------|---------|-----|\n`;

    const sortedRepos = piRepos[pi].sort((a, b) => a.name.localeCompare(b.name));

    sortedRepos.forEach(repo => {
      const projectDescription = repo.project || "No description provided";
      content += `| ${repo.name} | ${repo.researcher} | ${projectDescription} | ${repo.url ? `[Link](${repo.url})` : 'N/A'} |\n`;
    });

    content += `\n`;
  });

  content += `## Project Abbreviation Key\n\n`;
  content += `| Abbreviation | Full Project Name |\n`;
  content += `|--------------|-------------------|\n`;

  const sortedAbbreviations = Array.from(abbreviations.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  sortedAbbreviations.forEach(([abbr, fullName]) => {
    content += `| ${abbr} | ${fullName} |\n`;
  });

  content += `\n## How to Update This Index\n\n`;
  content += `This index is automatically generated. To ensure your project appears correctly:\n`;
  content += `1. Follow the naming convention for your repository: \`SURNAME+Initial of PI_SURNAME+Initial of researcher_project abbreviation\`\n`;
  content += `2. Add a clear description to your repository\n`;
  content += `3. Run this index generator script when new repositories are added\n`;

  return content;
}

main();

