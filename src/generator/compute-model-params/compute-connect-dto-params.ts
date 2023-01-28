import { isId, isUnique } from '../field-classifiers';
import { concatUniqueIntoArray, mapDMMFToParsedField, uniq } from '../helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { ConnectDtoParams } from '../types';
import { IApiProperty, IClassValidator, ImportStatementParams } from '../types';
import { parseClassValidators } from '../class-validator';
import { TemplateHelpers } from '../template-helpers';
import { parseApiProperty } from '../api-decorator';

interface ComputeConnectDtoParamsParam {
  model: DMMF.Model;
  templateHelpers: TemplateHelpers;
}
export const computeConnectDtoParams = ({
  model,
  templateHelpers,
}: ComputeConnectDtoParamsParam): ConnectDtoParams => {
  let hasApiProperty = false;
  const imports: ImportStatementParams[] = [];
  const classValidators: IClassValidator[] = [];

  const idFields = model.fields.filter((field) => isId(field));
  const isUniqueFields = model.fields.filter((field) => isUnique(field));

  /**
   * @ApiProperty({
   *  type: 'array',
   *  items: {
   *    oneOf: [{ $ref: getSchemaPath(A) }, { $ref: getSchemaPath(B) }],
   *  },
   * })
   * connect?: (A | B)[];
   */
  // TODO consider adding documentation block to model that one of the properties must be provided
  const uniqueFields = uniq([...idFields, ...isUniqueFields]);
  const overrides = uniqueFields.length > 1 ? { isRequired: false } : {};

  const fields = uniqueFields.map((field) => {
    const decorators: {
      apiProperties?: IApiProperty[];
      classValidators?: IClassValidator[];
    } = {};

    if (templateHelpers.config.classValidation) {
      decorators.classValidators = parseClassValidators({
        ...field,
        ...overrides,
      });
      concatUniqueIntoArray(
        decorators.classValidators,
        classValidators,
        'name',
      );
    }

    if (!templateHelpers.config.noDependencies) {
      decorators.apiProperties = parseApiProperty(
        {
          ...field,
          ...overrides,
        },
        { default: false },
      );
      if (decorators.apiProperties.length) hasApiProperty = true;
    }

    return mapDMMFToParsedField(field, overrides, decorators);
  });

  if (hasApiProperty) {
    imports.unshift({ from: '@nestjs/swagger', destruct: ['ApiProperty'] });
  }

  if (classValidators.length) {
    if (classValidators.find((cv) => cv.name === 'Type')) {
      imports.unshift({
        from: 'class-transformer',
        destruct: ['Type'],
      });
    }
    imports.unshift({
      from: 'class-validator',
      destruct: classValidators
        .filter((cv) => cv.name !== 'Type')
        .map((v) => v.name)
        .sort(),
    });
  }

  return { model, fields, imports };
};
