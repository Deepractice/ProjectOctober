import { useState, useEffect } from 'react';

/**
 * Hook for loading project information from backend
 */
export function useProjectInfo() {
  const [project, setProject] = useState({
    name: 'Current Project',
    displayName: 'Current Project',
    path: '/',
    fullPath: '/'
  });

  useEffect(() => {
    const loadProjectInfo = async () => {
      try {
        const response = await fetch('/api/project');
        if (response.ok) {
          const projectData = await response.json();
          setProject({
            name: projectData.name,
            displayName: projectData.name,
            path: projectData.path,
            fullPath: projectData.fullPath
          });
        }
      } catch (error) {
        console.error('Failed to load project info:', error);
      }
    };
    loadProjectInfo();
  }, []);

  return { project };
}
