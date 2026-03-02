import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

type DtoClass = { new (): object };

const runValidation = async (instance: object, res: Response): Promise<boolean> => {
  const errors = await validate(instance as object);
  if (errors.length > 0) {
    const messages = errors.flatMap((e) =>
      e.constraints ? Object.values(e.constraints) : []
    );
    res.status(400).json({ error: messages.join("; ") });
    return false;
  }
  return true;
};

export function validateBody(dtoClass: DtoClass) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, req.body, {
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
