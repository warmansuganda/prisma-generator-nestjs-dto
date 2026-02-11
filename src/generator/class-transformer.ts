import { isAnnotatedWith } from './field-classifiers';
import { ImportStatementParams, ParsedField } from './types';

export const EXCLUDE_ENTITY = /@Exclude/;
export const CUSTOM_TRANSFORMER = /@Transformer/;

export function decorateTransformer(field: ParsedField): string {
  let decorator = '';

  const type = field.apiProperties?.find((i) => i.noEncapsulation);
  if (type) decorator += `@Type(${type.value})\n`;

  if (isAnnotatedWith({ documentation: field.documentation }, EXCLUDE_ENTITY)) {
    decorator += `@Exclude()\n`;
  }

  if (
    isAnnotatedWith({ documentation: field.documentation }, CUSTOM_TRANSFORMER)
  ) {
    decorator += `${field.documentation}\n`;
  }

  if (
    field.type === 'DateTime' &&
    !isAnnotatedWith(
      { documentation: field.documentation },
      /@TransformerDateTime/,
    )
  ) {
    decorator += `@TransformerDateTime()\n`;
  }

  return decorator;
}

export function makeImportsFromClassTransformer(
  fields: ParsedField[],
  transformersPath = '',
): ImportStatementParams[] {
  const hasType = fields.some((field) =>
    field.apiProperties?.some((i) => i.noEncapsulation),
  );
  const hasExclude = fields.some((field) =>
    isAnnotatedWith({ documentation: field.documentation }, EXCLUDE_ENTITY),
  );

  const hasCustomTransformer = fields
    .map((field) => {
      let decorator = field.documentation;
      if (
        field.type === 'DateTime' &&
        !isAnnotatedWith(
          { documentation: field.documentation },
          /@TransformerDateTime/,
        )
      ) {
        decorator += `\n@TransformerDateTime()`;
      }
      return {
        ...field,
        documentation: decorator,
      };
    })
    .filter((field) =>
      isAnnotatedWith(
        { documentation: field.documentation },
        CUSTOM_TRANSFORMER,
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

  hasCustomTransformer.forEach((input) => {
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

  const transformerBase = transformersPath
    ? transformersPath.replace(/\/$/, '') + '/'
    : '../transformers/';
  const customTransformer = customDestruct.length
    ? customDestruct.map((item) => ({
        from: `${transformerBase}${item}`,
        default: item.toString(),
      }))
    : [];

  return [...classTransformer, ...customTransformer];
}
