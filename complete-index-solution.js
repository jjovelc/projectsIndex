const fs = require('fs');
const path = require('path');

// Simple script to update your existing repository
async function main() {
  try {
    console.log("Starting GitHub Lab Index Generator...");
    
    // Read your repository data
    console.log("Reading repository list from file...");
    const inputFile = process.argv[2] || 'new_names_repos_250327.md';
    
    // Check if file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`ERROR: Input file '${inputFile}' not found`);
      return;
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(inputFile, 'utf8');
    const repos = parseRepoList(fileContent);
    console.log(`Found ${repos.length} repositories in the input file`);
    
    // Generate README content based on parsed repositories
    console.log("Generating index content...");
    const content = generateIndexContent(repos);
    
    // Save README.md file directly in your current repository
    fs.writeFileSync('README.md', content);
    console.log("README.md has been created successfully!");
    console.log("You can now commit and push this file to your projectsIndex repository.");
    console.log("Use the following commands:");
    console.log("git add README.md");
    console.log("git commit -m \"Update lab project index\"");
    console.log("git push origin main");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Parse repository list from the provided file
function parseRepoList(content) {
  const repositories = [];
  const sections = content.split(/----------/);
  
  sections.forEach(section => {
    section = section.trim();
    if (!section) return;
    
    const lines = section.split('\n').map(line => line.trim());
    
    // Extract repository number and name
    const repoMatch = lines[0].match(/^\d+\.\s+(.+)$/);
    if (!repoMatch) return;
    
    const repoName = repoMatch[1].trim();
    let project = '';
    let pi = '';
    let researcher = '';
    let url = '';
    
    // Extract other information
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

// Generate README content from parsed repositories
function generateIndexContent(repos) {
  // Group repositories by PI
  const piRepos = {};
  const abbreviations = new Map();
  
  repos.forEach(repo => {
    // Extract project abbreviation from the repository name
    const abbrMatch = repo.name.match(/_([A-Za-z]+)$/);
    if (abbrMatch && abbrMatch[1]) {
      const projectAbbr = abbrMatch[1];
      if (repo.project) {
        // Also check for abbreviation in parentheses
        const parenMatch = repo.name.match(/\((.+)\)/);
        const fullName = parenMatch ? parenMatch[1] : repo.project;
        abbreviations.set(projectAbbr, fullName);
      }
    }
    
    if (!piRepos[repo.pi]) {
      piRepos[repo.pi] = [];
    }
    
    piRepos[repo.pi].push(repo);
  });
  
  // Generate README content
  ![Lab Projects Index Banner](bioinfo_banner.jpg)
  let content = `# Projects Index\n\n`;
  content += `## About This Repository\n`;
  content += `This index provides links to all lab projects organized by Principal Investigator. Each repository follows our naming convention:\n`;
  content += `\`SURNAME+Initial of PI_SURNAME+Initial of researcher_project abbreviation\`\n\n`;
  content += `## Projects by Principal Investigator\n\n`;
  
  // Sort PIs alphabetically
  const sortedPIs = Object.keys(piRepos).sort();
  
  sortedPIs.forEach(pi => {
    content += `### ${pi}\n\n`;
    content += `| Repository | Researcher | Project | URL |\n`;
    content += `|------------|------------|---------|-----|\n`;
    
    // Sort repositories by name
    const sortedRepos = piRepos[pi].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedRepos.forEach(repo => {
      const projectDescription = repo.project || "No description provided";
      content += `| ${repo.name} | ${repo.researcher} | ${projectDescription} | ${repo.url ? `[Link](${repo.url})` : 'N/A'} |\n`;
    });
    
    content += `\n`;
  });
  
  // Add abbreviation key
  content += `## Project Abbreviation Key\n\n`;
  content += `| Abbreviation | Full Project Name |\n`;
  content += `|--------------|-------------------|\n`;
  
  // Sort abbreviations alphabetically
  const sortedAbbreviations = Array.from(abbreviations.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  sortedAbbreviations.forEach(([abbr, fullName]) => {
    content += `| ${abbr} | ${fullName} |\n`;
  });
  
  // Add update instructions
  content += `\n## How to Update This Index\n\n`;
  content += `This index is automatically generated. To ensure your project appears correctly:\n`;
  content += `1. Follow the naming convention for your repository: \`SURNAME+Initial of PI_SURNAME+Initial of researcher_project abbreviation\`\n`;
  content += `2. Add a clear description to your repository\n`;
  content += `3. Run this index generator script when new repositories are added\n`;
  
  return content;
}

// Run the main function
main();
