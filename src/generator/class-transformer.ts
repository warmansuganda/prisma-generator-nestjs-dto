import { isAnnotatedWith } from './field-classifiers';
import { ImportStatementParams, ParsedField } from './types';

export const EXCLUDE_ENTITY = /@Exclude/;
export const TRANSFORM_FILE_URL_ENTITY = /@TransformFileUrl/;

export function decorateTransformer(field: ParsedField): string {
  let decorator = '';

  const type = field.apiProperties?.find((i) => i.noEncapsulation);
  if (type) decorator += `@Type(${type.value})\n`;

  if (isAnnotatedWith({ documentation: field.documentation }, EXCLUDE_ENTITY)) {
    decorator += `@Exclude()\n`;
  }

  if (
    isAnnotatedWith(
      { documentation: field.documentation },
      TRANSFORM_FILE_URL_ENTITY,
    )
  ) {
    decorator += `@TransformFileUrl()\n`;
  }

  return decorator;
}

export function makeImportsFromClassTransformer(
  fields: ParsedField[],
): ImportStatementParams[] {
  const hasType = fields.some((field) =>
    field.apiProperties?.some((i) => i.noEncapsulation),
  );
  const hasExclude = fields.some((field) =>
    isAnnotatedWith({ documentation: field.documentation }, EXCLUDE_ENTITY),
  );

  const hasTransformFileUrl = fields.some((field) =>
    isAnnotatedWith(
      { documentation: field.documentation },
      TRANSFORM_FILE_URL_ENTITY,
    ),
  );

  const destruct: string[] = [];
  if (hasType) destruct.push('Type');
  if (hasExclude) destruct.push('Exclude');

  const classTransformer = destruct.length
    ? [{ from: 'class-transformer', destruct }]
    : [];

  const destructDecorator: string[] = [];
  if (hasTransformFileUrl) destructDecorator.push('TransformFileUrl');

  const classDecorator = destructDecorator.length
    ? [
        {
          from: '@inofix/prisma-generator-nestjs-dto/decorators',
          destruct: destructDecorator,
        },
      ]
    : [];

  return [...classTransformer, ...classDecorator];
}
