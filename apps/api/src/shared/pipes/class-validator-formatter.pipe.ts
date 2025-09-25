import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ClassValidatorFormatterPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    try {
      const object = plainToClass(metatype, value);
      const errors = await validate(object);

      if (errors.length > 0) {
        const fieldErrors: Record<string, string> = {};

        errors.forEach(error => {
          const field = error.property;
          const message =
            Object.values(error.constraints || {})[0] || 'Invalid value';
          fieldErrors[field] = message;
        });

        throw new BadRequestException({
          message: 'Validation failed',
          fieldErrors,
          error: 'Please check the form for errors',
        });
      }

      return object;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      return value;
    }
  }

  private toValidate(metatype: new (...args: any[]) => any): boolean {
    return (
      typeof metatype === 'function' &&
      metatype.prototype &&
      metatype.prototype.constructor === metatype &&
      !this.isPrimitiveType(metatype)
    );
  }

  private isPrimitiveType(metatype: new (...args: any[]) => any): boolean {
    const primitiveTypes: (new (...args: any[]) => any)[] = [
      String,
      Boolean,
      Number,
      Array,
      Object,
      Date,
    ];
    return primitiveTypes.includes(metatype);
  }
}
