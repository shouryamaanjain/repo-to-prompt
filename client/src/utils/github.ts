/**
 * Validates a GitHub repository URL
 * 
 * @param url - The URL to validate
 * @returns boolean indicating if the URL is a valid GitHub repository URL
 */
export function isValidGithubUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Check if the hostname is github.com
    if (urlObj.hostname !== 'github.com') {
      return false;
    }
    
    // Check if the path has at least a username and repository name
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extracts owner and repository name from a GitHub URL
 * 
 * @param url - The GitHub repository URL
 * @returns An object containing owner and repo, or null if invalid
 */
export function extractRepoInfo(url: string): { owner: string; repo: string } | null {
  try {
    if (!isValidGithubUrl(url)) {
      return null;
    }
    
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    return {
      owner: pathParts[0],
      repo: pathParts[1],
    };
  } catch (error) {
    return null;
  }
}
