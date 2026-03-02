import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

type DtoClass = { new (): object };

export function validateBody(dtoClass: DtoClass) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, req.body, {
      excludeExtraneousValues: false,
    });
    const errors = await validate(instance as object);
    if (errors.length > 0) {
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : []
    );
      res.status(400).json({ error: messages.join("; ") });
      return;
    }
    req.body = instance;
    next();
  };
}
