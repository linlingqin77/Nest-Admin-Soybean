import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Minimal shape that guards in this module require off the request user.
 * The concrete `UserType` lives in modules/users/dto/user.ts but would create
 * an undesired cross-module dependency here, so we keep a narrow structural
 * type instead.
 */
export interface AuthUser {
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

/**
 * Shared scaffolding for "metadata-driven" attribute guards (Roles / Permission).
 *
 * Subclasses only need to implement {@link BaseAttributeGuard.check} — reflector
 * lookup, missing-user handling and the "no requirement = pass" rule all live
 * here so they cannot drift apart between guards.
 */
@Injectable()
export abstract class BaseAttributeGuard<T> implements CanActivate {
  constructor(
    protected readonly reflector: Reflector,
    protected readonly metadataKey: symbol | string | Function,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<T>(this.metadataKey, [context.getHandler(), context.getClass()]);

    // No requirement declared => endpoint is open from this guard's perspective.
    if (required === undefined || required === null) {
      return true;
    }

    if (Array.isArray(required) && (required as unknown[]).length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (!req.user) {
      return false;
    }

    return this.check(req.user, required);
  }

  /**
   * Subclass-specific predicate. The user is guaranteed to be present when this
   * runs (see {@link BaseAttributeGuard.canActivate}).
   */
  protected abstract check(user: AuthUser, required: T): boolean;
}
