import type { StackClientApp } from '@stackframe/react';

// Use relative URL in dev (Vite proxy) or absolute URL from env
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

// Helper function to get access token from cookies
// Stack Auth stores tokens in cookies when tokenStore is 'cookie'
function getAccessTokenFromCookie(): string | null {
  try {
    const cookies = document.cookie.split(';');
    const projectId = import.meta.env.VITE_STACK_PROJECT_ID;
    
    // Log all cookies for debugging in dev mode
    if (import.meta.env.DEV) {
      console.log('All cookies:', document.cookie);
      console.log('Looking for cookies with projectId:', projectId);
    }
    
    // Stack Auth stores tokens in the 'stack-access' cookie
    // Format: [refreshTokenId, accessTokenJWT]
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (!trimmed) continue;
      
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;
      
      const name = trimmed.substring(0, equalIndex);
      const value = trimmed.substring(equalIndex + 1);
      
      if (!name || !value) continue;
      
      // Check for stack-access cookie
      if (name === 'stack-access') {
        if (import.meta.env.DEV) {
          console.log('Found stack-access cookie');
        }
        
        try {
          const decoded = decodeURIComponent(value);
          // Parse the JSON array [refreshTokenId, accessToken]
          const parsed = JSON.parse(decoded);
          
          if (Array.isArray(parsed) && parsed.length >= 2) {
            const accessToken = parsed[1]; // Second element is the JWT access token
            if (accessToken && typeof accessToken === 'string' && accessToken.startsWith('eyJ')) {
              if (import.meta.env.DEV) {
                console.log('Extracted access token from stack-access cookie');
              }
              return accessToken;
            }
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to parse stack-access cookie:', error);
          }
        }
      }
    }
    
    // If no token found, log all cookie names for debugging
    if (import.meta.env.DEV) {
      const cookieNames = cookies
        .map(c => c.trim().split('=')[0])
        .filter(Boolean);
      console.log('Available cookie names:', cookieNames);
    }
    
    return null;
  } catch (error) {
    console.error('Error reading access token from cookie:', error);
    return null;
  }
}

// Helper function to make authenticated API requests
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  _app?: StackClientApp
): Promise<T> {
  const headers = new Headers(options?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Get access token from cookies (Stack Auth stores it in stack-access cookie)
  const accessToken = getAccessTokenFromCookie();
  
  if (accessToken) {
    // Use Authorization Bearer header
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  } else if (import.meta.env.DEV) {
    console.warn('No access token found for API request to', endpoint);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Check content type before parsing
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Failed to parse JSON, use default message
      }
    } else {
      // Response is HTML or other non-JSON format
      const text = await response.text();
      if (import.meta.env.DEV) {
        console.error('API returned non-JSON response:', text.substring(0, 200));
      }
      errorMessage = `API error: ${response.status} ${response.statusText} (received ${contentType})`;
    }
    
    throw new Error(errorMessage);
  }

  if (!isJson) {
    const text = await response.text();
    throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`);
  }

  return response.json();
}

// Auth endpoints
export async function getCurrentUser(app: StackClientApp) {
  return apiRequest<{
    id: string;
    stackAuthId: string;
    email?: string;
    name?: string;
    username?: string;
    roles: string[];
  }>('/api/auth/me', undefined, app);
}

// Folder endpoints
export async function fetchFolders() {
  return apiRequest('/api/folders');
}

// Page endpoints
export async function fetchPages() {
  return apiRequest('/api/pages');
}

// Canon endpoints (folders)
export async function getCanonFolders() {
  return apiRequest<{ folders: any[] }>(
    '/api/canon/folders'
  );
}

export async function createCanonFolder(input: {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string;
  sortOrder?: number;
  isFeatured?: boolean;
}) {
  return apiRequest<{ folder: any }>(
    '/api/canon/folders',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

export async function updateCanonFolder(id: string, input: Partial<{
  name: string;
  slug: string;
  parentId: string | null;
  description: string;
  sortOrder: number;
  isFeatured: boolean;
}>) {
  return apiRequest<{ folder: any }>(
    `/api/canon/folders/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    }
  );
}

export async function deleteCanonFolder(id: string) {
  return apiRequest<{ success: boolean }>(
    `/api/canon/folders/${id}`,
    { method: 'DELETE' }
  );
}

// Canon endpoints (pages)
export async function getCanonPage(id: string) {
  return apiRequest<{ page: any }>(
    `/api/canon/pages/${id}`
  );
}

export async function createCanonPage(input: {
  title: string;
  slug?: string;
  folderId: string;
  markdown: string;
}) {
  return apiRequest<{ page: any }>(
    '/api/canon/pages',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

export async function createCanonRevision(pageId: string, input: {
  markdown: string;
  summary?: string;
}) {
  return apiRequest<{ revision: any }>(
    `/api/canon/pages/${pageId}/revisions`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

export async function listCanonFolderPages(folderId: string) {
  return apiRequest<{ pages: any[] }>(`/api/canon/folders/${folderId}/pages`);
}

// Theory endpoints
export async function createTheory(content: string) {
  return apiRequest<{ theory: any }>('/api/theories', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getUnmoderatedTheories() {
  return apiRequest<{ theories: any[] }>('/api/theories/unmoderated');
}

export async function getApprovedTheories(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<{ theories: any[] }>(`/api/theories/approved${query}`);
}

export async function moderateTheory(id: string, input: {
  status: 'approved' | 'denied';
  title?: string;
  tagIds?: string[];
  denialReason?: string;
}) {
  return apiRequest<{ theory: any }>(`/api/theories/${id}/moderate`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getTags() {
  return apiRequest<{ tags: any[] }>('/api/tags');
}

export async function createTag(name: string) {
  return apiRequest<{ tag: any }>('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteTag(id: string) {
  return apiRequest<{ success: boolean }>(`/api/tags/${id}`, {
    method: 'DELETE',
  });
}

export async function getTopTheories() {
  return apiRequest<{ theories: any[] }>('/api/theories/top');
}

export async function voteTheory(id: string, value: 1 | -1) {
  return apiRequest<{ score: number; upvotes: number; downvotes: number; userVote: number }>(
    `/api/theories/${id}/vote`,
    {
      method: 'POST',
      body: JSON.stringify({ value: value.toString() }),
    }
  );
}

export async function updateUsername(username: string) {
  return apiRequest<{ id: string; username: string }>(
    '/api/auth/username',
    {
      method: 'PUT',
      body: JSON.stringify({ username }),
    }
  );
}

export type ContributionLeaderboardEntry = {
  userId: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  contributions: number;
  approvals: number;
  votes: number;
  rank: number;
};

export type ContributionCurrentUser = Omit<ContributionLeaderboardEntry, 'rank'> & {
  rank: number | null;
};

export type ContributionLeaderboardResponse = {
  leaderboard: ContributionLeaderboardEntry[];
  currentUser: ContributionCurrentUser | null;
  totalContributions: number;
  totalContributors: number;
};

export async function getContributionLeaderboard() {
  return apiRequest<ContributionLeaderboardResponse>('/api/contributions/leaderboard');
}

export type ContributionStatsResponse = {
  totalContributions: number;
  totalContributors: number;
};

export async function getContributionStats() {
  return apiRequest<ContributionStatsResponse>('/api/contributions/stats');
}

export async function getIncompleteTheories() {
  return apiRequest<{ theories: any[] }>('/api/theories/incomplete');
}

export async function updateTheoryTitle(id: string, input: { title: string; tagIds?: string[] }) {
  return apiRequest<{ theory: any }>(`/api/theories/${id}/title`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function splitTheory(
  id: string,
  parts: { title: string; content: string; tagIds?: string[] }[]
) {
  return apiRequest<{ theories: any[] }>(`/api/theories/${id}/split`, {
    method: 'POST',
    body: JSON.stringify({ parts }),
  });
}

export async function updateTheoryContent(id: string, content: string) {
  return apiRequest<{ theory: any }>(`/api/theories/${id}/content`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}
