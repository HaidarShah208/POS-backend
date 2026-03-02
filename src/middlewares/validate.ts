import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import type { ValidationError } from "class-validator";

type DtoClass = { new (): object };

function collectErrorMessages(errors: ValidationError[], prefix = ""): string[] {
  const messages: string[] = [];
  for (const e of errors) {
    const field = prefix ? `${prefix}.${e.property}` : e.property;
    if (e.constraints) {
      messages.push(...Object.values(e.constraints).map((c) => `${field}: ${c}`));
    }
    if (e.children?.length) {
      messages.push(...collectErrorMessages(e.children, field));
    }
  }
  return messages;
}

const runValidation = async (instance: object, res: Response): Promise<boolean> => {
  const errors = await validate(instance as object);
  if (errors.length > 0) {
    const messages = collectErrorMessages(errors);
    const text = messages.length ? messages.join("; ") : "Validation failed";
    res.status(400).json({ error: text });
    return false;
  }
  return true;
};

export function validateBody(dtoClass: DtoClass) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, req.body, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });
    if (!(await runValidation(instance, res))) return;
    req.body = instance;
    next();
  };
}

export function validateQuery(dtoClass: DtoClass) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, req.query, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });
    if (!(await runValidation(instance, res))) return;
    req.query = instance as typeof req.query;
    next();
  };
}
