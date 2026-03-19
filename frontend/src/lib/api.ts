const rawBase = import.meta.env.VITE_API_BASE_URL?.toString().trim().replace(/\/$/, '') || '';
const API_BASE_URL = rawBase === '' ? '' : rawBase;

const withBase = (path: string) => `${API_BASE_URL}${path}`;

const toError = async (response: Response) => {
  const text = await response.text();
  if (!text) return new Error(`Request failed with status ${response.status}`);
  try {
    const j = JSON.parse(text);
    const detail = j?.detail;
    if (Array.isArray(detail)) {
      const msg = detail
        .map((item) => {
          const loc = Array.isArray(item?.loc) ? item.loc.filter((p: unknown) => p !== 'body') : [];
          const path = loc.length > 0 ? loc.join('.') : '';
          const message = typeof item?.msg === 'string' ? item.msg : 'Invalid value';
          return path ? `${path}: ${message}` : message;
        })
        .join('; ');
      return new Error(msg || `Request failed with status ${response.status}`);
    }
    if (typeof detail === 'string' && detail.trim() !== '') {
      return new Error(detail);
    }
    return new Error(text || `Request failed with status ${response.status}`);
  } catch {
    return new Error(text || `Request failed with status ${response.status}`);
  }
};

function headers(token?: string): HeadersInit {
  const h: HeadersInit = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export type UploadResult = { message?: string };
export type QueryResult = { answer: string; sources?: Array<Record<string, unknown>> };
export type AuthResult = { access_token: string; token_type: string };

async function authRequest(
  endpoint: '/auth/login' | '/auth/signup',
  email: string,
  password: string,
): Promise<AuthResult> {
  const normalizedEmail = email.trim();
  const attempts: Array<{ headers: HeadersInit; body: BodyInit }> = [
    {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password, username: normalizedEmail }),
    },
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: normalizedEmail,
        email: normalizedEmail,
        password,
      }),
    },
  ];

  let lastError: Error | null = null;
  for (let i = 0; i < attempts.length; i += 1) {
    const response = await fetch(withBase(endpoint), {
      method: 'POST',
      headers: attempts[i].headers,
      body: attempts[i].body,
    });
    if (response.ok) {
      return response.json() as Promise<AuthResult>;
    }

    // Backward-compat retry: some backends validate a different body shape.
    if (response.status === 422 && i < attempts.length - 1) {
      lastError = await toError(response);
      continue;
    }
    throw await toError(response);
  }

  throw lastError ?? new Error('Authentication failed');
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return authRequest('/auth/login', email, password);
}

export async function signup(email: string, password: string): Promise<AuthResult> {
  return authRequest('/auth/signup', email, password);
}

export async function uploadDocument(file: File, token?: string): Promise<UploadResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx');

  if (!isPdf && !isDocx) {
    throw new Error('Only PDF or DOCX files are supported.');
  }

  const endpoint = isPdf ? '/upload/pdf' : '/upload/docx';
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(withBase(endpoint), {
    method: 'POST',
    headers: headers(token),
    body: formData,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  try {
    return (await response.json()) as UploadResult;
  } catch (error) {
    return {};
  }
}

export async function askQuestion(question: string, topK = 4, token?: string): Promise<QueryResult> {
  if (!token) {
    const response = await fetch(withBase('/chat/general'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) {
      throw await toError(response);
    }
    return (await response.json()) as QueryResult;
  }

  const formData = new FormData();
  formData.append('question', question);
  formData.append('top_k', String(topK));

  const response = await fetch(withBase('/query'), {
    method: 'POST',
    headers: headers(token),
    body: formData,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  return (await response.json()) as QueryResult;
}
