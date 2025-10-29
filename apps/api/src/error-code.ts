export enum ErrorCode {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  // OIDC errors
  OIDC_NOT_CONFIGURED = 'OIDC_NOT_CONFIGURED',
  OIDC_RESPONSE_ERROR = 'OIDC_RESPONSE_ERROR',
  OIDC_CLAIMS_NOT_AVAILABLE = 'OIDC_CLAIMS_NOT_AVAILABLE',
  OIDC_EMAIL_NOT_AVAILABLE = 'OIDC_EMAIL_NOT_AVAILABLE',
  OIDC_EMAIL_MISMATCH = 'OIDC_EMAIL_MISMATCH',
  OIDC_PROVIDER_ID_MISMATCH = 'OIDC_PROVIDER_ID_MISMATCH',

  // Workspace errors
  WORKSPACE_NOT_MEMBER = 'WORKSPACE_NOT_MEMBER',
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  WORKSPACE_DELETE_NOT_ALLOWED = 'WORKSPACE_DELETE_NOT_ALLOWED',
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [ErrorCode.OIDC_NOT_CONFIGURED]: 'OIDC is not configured',
  [ErrorCode.OIDC_RESPONSE_ERROR]: 'OIDC response error: ${error}',
  [ErrorCode.OIDC_CLAIMS_NOT_AVAILABLE]: 'OIDC claims are not available',
  [ErrorCode.OIDC_EMAIL_NOT_AVAILABLE]: 'Email not available in the ID token',
  [ErrorCode.OIDC_EMAIL_MISMATCH]:
    'Email mismatch between the ID token and the user',
  [ErrorCode.OIDC_PROVIDER_ID_MISMATCH]:
    'Provider ID mismatch between the ID token and the user',

  [ErrorCode.WORKSPACE_NOT_MEMBER]: 'User is not a member of the workspace',
  [ErrorCode.WORKSPACE_NOT_FOUND]: 'Workspace ${workspaceId} not found',
  [ErrorCode.WORKSPACE_DELETE_NOT_ALLOWED]: 'Workspace ${workspaceId} cannot be deleted by you',
};
