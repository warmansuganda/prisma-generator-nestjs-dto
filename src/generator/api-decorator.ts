import { DMMF } from '@prisma/generator-helper';
import { IApiProperty, ImportStatementParams, ParsedField } from './types';

const ApiProps = [
  'description',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'example',
];

const PrismaScalarToFormat: Record<string, { type: string; format?: string }> =
  {
    String: { type: 'string' },
    Boolean: { type: 'boolean' },
    Int: { type: 'integer', format: 'int32' },
    BigInt: { type: 'integer', format: 'int64' },
    Float: { type: 'number', format: 'float' },
    Decimal: { type: 'number', format: 'double' },
    DateTime: { type: 'string', format: 'date-time' },
  };

export function isAnnotatedWithDoc(field: ParsedField): boolean {
  return ApiProps.some((prop) =>
    new RegExp(`@${prop}\\s+(.+)\\s*$`, 'm').test(field.documentation || ''),
  );
}

function getDefaultValue(field: ParsedField): any {
  if (!field.hasDefaultValue) return undefined;

  switch (typeof field.default) {
    case 'string':
    case 'number':
    case 'boolean':
      return field.default;
    case 'object':
      if (field.default.name) {
        return field.default.name;
      }
    // fall-through
    default:
      return undefined;
  }
}

function extractAnnotation(
  field: ParsedField,
  prop: string,
): IApiProperty | null {
  const regexp = new RegExp(`@${prop}\\s+(.+)\\s*$`, 'm');
  const matches = regexp.exec(field.documentation || '');

  if (matches && matches[1]) {
    return {
      name: prop,
      value: matches[1],
    };
  }

  return null;
}

/**
 * Wrap string with single-quotes unless it's a (stringified) number, boolean, or array.
 */
function encapsulateString(value: string): string {
  return /^$|^(?!true$|false$)[^0-9\[]/.test(value)
    ? `'${value.replace(/'/g, "\\'")}'`
    : value;
}

/**
 * Parse all types of annotation that can be decorated with `@ApiProperty()`.
 * @param field
 * @param include All default to `true`. Set to `false` if you want to exclude a type of annotation.
 */
export function parseApiProperty(
  field: DMMF.Field,
  include: {
    default?: boolean;
    doc?: boolean;
    enum?: boolean;
    type?: boolean;
  } = {},
): IApiProperty[] {
  const incl = {
    default: true,
    doc: true,
    enum: true,
    type: true,
    ...include,
  };
  const properties: IApiProperty[] = [];

  if (incl.doc && field.documentation) {
    for (const prop of ApiProps) {
      const property = extractAnnotation(field, prop);
      if (property) {
        properties.push(property);
      }
    }
  }

  if (incl.type) {
    const scalarFormat = PrismaScalarToFormat[field.type];
    if (scalarFormat) {
      properties.push({
        name: 'type',
        value: scalarFormat.type,
      });
      if (scalarFormat.format) {
        properties.push({ name: 'format', value: scalarFormat.format });
      }
    } else if (field.kind !== 'enum') {
      properties.push({
        name: 'type',
        value: field.type,
        noEncapsulation: true,
      });
    }
    if (field.isList) {
      properties.push({ name: 'isArray', value: 'true' });
    }
  }

  if (incl.enum && field.kind === 'enum') {
    properties.push({ name: 'enum', value: field.type });
  }

  const defaultValue = getDefaultValue(field);
  if (incl.default && defaultValue !== undefined) {
    properties.push({ name: 'default', value: `${defaultValue}` });
  }

  if (!field.isRequired) {
    properties.push({ name: 'required', value: 'false' });
  }
  if (
    typeof field.isNullable === 'boolean' ? field.isNullable : !field.isRequired
  ) {
    properties.push({ name: 'nullable', value: 'true' });
  }

  // set dummy property to force `@ApiProperty` decorator
  if (properties.length === 0) {
    properties.push({ name: 'dummy', value: '' });
  }

  return properties;
}

/**
 * Compose `@ApiProperty()` decorator.
 */
export function decorateApiProperty(field: ParsedField): string {
  if (field.apiHideProperty) {
    return '@ApiHideProperty()\n';
  }

  if (
    field.apiProperties?.length === 1 &&
    field.apiProperties[0].name === 'dummy'
  ) {
    return '@ApiProperty()\n';
  }

  let decorator = '';

  if (field.apiProperties?.length) {
    decorator += '@ApiProperty({\n';
    field.apiProperties.forEach((prop) => {
      if (prop.name === 'dummy') return;
      decorator += `  ${prop.name}: ${
        prop.name === 'enum' || prop.noEncapsulation
          ? prop.value
          : encapsulateString(prop.value)
      },\n`;
    });
    decorator += '})\n';
  }

  return decorator;
}

export function makeImportsFromNestjsSwagger(
  fields: ParsedField[],
  apiExtraModels?: string[],
): ImportStatementParams[] {
  const hasApiProperty = fields.some((field) => field.apiProperties?.length);
  const hasApiHideProperty = fields.some((field) => field.apiHideProperty);

  if (hasApiProperty || hasApiHideProperty || apiExtraModels?.length) {
    const destruct: string[] = [];

    if (apiExtraModels?.length) destruct.push('ApiExtraModels');
    if (hasApiHideProperty) destruct.push('ApiHideProperty');
    if (hasApiProperty) destruct.push('ApiProperty');

    return [{ from: '@nestjs/swagger', destruct }];
  }

  return [];
}
