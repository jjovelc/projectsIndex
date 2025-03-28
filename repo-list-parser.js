const fs = require('fs');
const { Octokit } = require("@octokit/rest");
require('dotenv').config();

// Initialize Octokit with your GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Your GitHub username
const owner = "jjovelc";
// The repository name where you want to store the index
const indexRepo = "LabIndex";

async function generateIndexFromList(filePath = 'new_names_repos_250327.md') {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the file content to extract repository information
    const repos = parseRepoList(fileContent);
    
    // Group repositories by PI
    const piRepos = {};
    const abbreviations = new Map();
    
    repos.forEach(repo => {
      const { name, pi, researcher, projectAbbr, projectFullName, description, url } = repo;
      
      if (projectAbbr && projectFullName) {
        abbreviations.set(projectAbbr, projectFullName);
      }
      
      if (!piRepos[pi]) {
        piRepos[pi] = [];
      }
      
      piRepos[pi].push({
        name,
        url,
        researcher,
        projectAbbr,
        description: description || projectFullName || "No description provided"
      });
    });
    
    // Generate README content
    let content = `# Lab Project Index\n\n`;
    content += `## About This Repository\n`;
    content += `This index provides links to all lab projects organized by Principal Investigator. Each repository follows our naming convention:\n`;
    content += `\`SURNAME+Initial of PI_SURNAME+Initial of researcher_project abbreviation\`\n\n`;
    content += `## Projects by Principal Investigator\n\n`;
    
    // Sort PIs alphabetically
    const sortedPIs = Object.keys(piRepos).sort();
    
    sortedPIs.forEach(pi => {
      // Extract last name and first initial from PI info
      const piParts = pi.split(' ');
      const piDisplay = piParts.length >= 2 ? piParts[0] : pi;
      
      content += `### ${piDisplay}\n\n`;
      content += `| Repository | Researcher | Description | URL |\n`;
      content += `|------------|------------|-------------|-----|\n`;
      
      // Sort repositories by name
      const sortedRepos = piRepos[pi].sort((a, b) => a.name.localeCompare(b.name));
      
      sortedRepos.forEach(repo => {
        // Format researcher name for display
        const researcherParts = repo.researcher.split(' ');
        const researcherDisplay = researcherParts.length >= 2 ? researcherParts[0] : repo.researcher;
        
        content += `| ${repo.name} | ${researcherDisplay} | ${repo.description} | [Link](${repo.url}) |\n`;
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
    content += `3. Include the full project name in parentheses in the description if possible\n`;
    
    console.log(content);
    
    // Uncomment to update the README in the LabIndex repository
    /*
    // First, check if README.md already exists and get its SHA if it does
    let fileSha;
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo: indexRepo,
        path: "README.md"
      });
      fileSha = fileData.sha;
    } catch (error) {
      // File doesn't exist yet, that's fine
    }
    
    // Now create or update the file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: indexRepo,
      path: "README.md",
      message: "Update lab project index",
      content: Buffer.from(content).toString('base64'),
      sha: fileSha // Will be undefined if the file doesn't exist yet, which is fine
    });
    
    console.log("Index updated successfully!");
    */
  } catch (error) {
    console.error("Error generating index:", error);
  }
}

// Parse the repository list from the provided file
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
    let projectAbbr = '';
    let projectFullName = '';
    
    // Extract abbreviation and full name from repository name if present
    const abbrMatch = repoName.match(/^.*_.*_([A-Za-z]+)\s*\((.+)\)$/);
    if (abbrMatch) {
      projectAbbr = abbrMatch[1];
      projectFullName = abbrMatch[2];
    } else {
      // If no parentheses, just extract the abbreviation
      const simpleAbbrMatch = repoName.match(/^.*_.*_([A-Za-z]+)$/);
      if (simpleAbbrMatch) {
        projectAbbr = simpleAbbrMatch[1];
      }
    }
    
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
      url,
      projectAbbr,
      projectFullName
    });
  });
  
  return repositories;
}

// Run the function if this script is executed directly
if (require.main === module) {
  generateIndexFromList();
}

module.exports = { generateIndexFromList };
