import { isAnnotatedWith } from './field-classifiers';
import { ImportStatementParams, ParsedField } from './types';

export const EXCLUDE_ENTITY = /@Exclude/;
export const TRANSFORM_FILE_URL_ENTITY = /@Transformer/;

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
    decorator += `${field.documentation}\n`;
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

  const hasTransformFileUrl = fields.filter((field) =>
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

  // Regular expression to match function names between @ and (
  const regex = /@([^\s(]+)\(/g;

  // Create a Set to store unique function names
  const uniqueFunctions = new Set();

  hasTransformFileUrl.forEach((input) => {
    let match;

    if (input.documentation) {
      // Find all matches in the current string
      while ((match = regex.exec(input.documentation)) !== null) {
        uniqueFunctions.add(match[1]); // Add to Set (automatically handles duplicates)
      }
    }
  });

  // Convert the Set to an array
  const customDestruct = Array.from(uniqueFunctions) as string[];

  const customTransformer = customDestruct.length
    ? customDestruct.map((item) => ({
        from: `../transformers/${item}`,
        default: item.toString(),
      }))
    : [];

  return [...classTransformer, ...customTransformer];
}
