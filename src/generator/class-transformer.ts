import { isAnnotatedWith } from './field-classifiers';
import { ImportStatementParams, ParsedField } from './types';

export const EXCLUDE_ENTITY = /@Exclude/;

export function decorateTransformer(field: ParsedField): string {
  let decorator = '';

  const type = field.apiProperties?.find((i) => i.noEncapsulation);
  if (type) decorator += `@Type(${type.value})\n`;

  if (isAnnotatedWith({ documentation: field.documentation }, EXCLUDE_ENTITY)) {
    decorator += `@Exclude\n`;
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

  const destruct: string[] = [];
  if (hasType) destruct.push('Type');
  if (hasExclude) destruct.push('Exclude');

  return destruct.length ? [{ from: 'class-transformer', destruct }] : [];
}
