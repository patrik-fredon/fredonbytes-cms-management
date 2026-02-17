export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export class AuthError extends DomainError {}
export class ValidationError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ConflictError extends DomainError {}
export class PaymentError extends DomainError {}
export class ProviderError extends DomainError {}
