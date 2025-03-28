const { Octokit } = require("@octokit/rest");
require('dotenv').config();

// Initialize Octokit with your GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Your GitHub username (appears to be jjovelc based on URLs)
const owner = "jjovelc";
// The repository name where you want to store the index
const indexRepo = "LabIndex";

async function generateIndex() {
  try {
    // Get all repositories
    const { data: repos } = await octokit.repos.listForUser({
      username: owner,
      per_page: 100
    });
    
    // Group repositories by PI
    const piRepos = {};
    const abbreviations = new Map();
    
    repos.forEach(repo => {
      // Skip the index repository itself
      if (repo.name === indexRepo) return;
      
      // Extract PI, researcher, and project abbreviation from repo name
      const match = repo.name.match(/^([A-Za-z]+[A-Z])_([A-Za-z]+[A-Z])_([A-Za-z]+)$/);
      if (!match) return; // Skip repos that don't follow the naming convention
      
      const [, piName, researcherName, projectAbbr] = match;
      
      // Extract project full name from description if available
      const descriptionMatch = repo.description ? repo.description.match(/\(([^)]+)\)/) : null;
      if (descriptionMatch && descriptionMatch[1]) {
        abbreviations.set(projectAbbr, descriptionMatch[1]);
      }
      
      if (!piRepos[piName]) {
        piRepos[piName] = [];
      }
      
      piRepos[piName].push({
        name: repo.name,
        url: repo.html_url,
        researcher: researcherName,
        projectAbbr,
        description: repo.description || "No description provided"
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
      // Format PI name for display
      const piDisplay = formatName(pi);
      content += `### ${piDisplay}\n\n`;
      content += `| Repository | Researcher | Description | URL |\n`;
      content += `|------------|------------|-------------|-----|\n`;
      
      // Sort repositories by name
      const sortedRepos = piRepos[pi].sort((a, b) => a.name.localeCompare(b.name));
      
      sortedRepos.forEach(repo => {
        // Format researcher name
        const researcherDisplay = formatName(repo.researcher);
        
        // Clean up description (remove project abbreviation if present)
        let cleanDescription = repo.description || "No description provided";
        cleanDescription = cleanDescription.replace(/\([^)]+\)\s*/, "").trim();
        
        content += `| ${repo.name} | ${researcherDisplay} | ${cleanDescription} | [Link](${repo.url}) |\n`;
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
    content += `3. Include the full project name in parentheses in the description, e.g. "PROJECT: Single cell mouse forelimb (scRNAseq Mouse Forelimb)"\n`;
    
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

// Helper function to format names from "SurnameI" to "Surname, I."
function formatName(name) {
  // Extract the last capital letter as the initial
  const match = name.match(/([A-Za-z]+)([A-Z])$/);
  if (match) {
    const [, surname, initial] = match;
    return `${surname}, ${initial}.`;
  }
  return name;
}

generateIndex();
