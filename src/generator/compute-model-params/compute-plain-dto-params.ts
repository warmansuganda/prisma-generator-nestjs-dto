import slash from 'slash';
import path from 'node:path';
import {
  DTO_API_HIDDEN,
  DTO_ENTITY_HIDDEN,
  DTO_RELATION_INCLUDE_ID,
} from '../annotations';
import { isAnnotatedWith, isRelation, isType } from '../field-classifiers';
import {
  getRelationScalars,
  getRelativePath,
  makeImportsFromPrismaClient,
  mapDMMFToParsedField,
  zipImportStatementParams,
} from '../helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from '../template-helpers';
import type {
  Model,
  ImportStatementParams,
  ParsedField,
  PlainDtoParams,
  IDecorators,
} from '../types';
import {
  makeImportsFromNestjsSwagger,
  parseApiProperty,
} from '../api-decorator';
import { makeImportsFromClassTransformer } from '../class-transformer';

interface ComputePlainDtoParamsParam {
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
}
export const computePlainDtoParams = ({
  model,
  allModels,
  templateHelpers,
}: ComputePlainDtoParamsParam): PlainDtoParams => {
  const imports: ImportStatementParams[] = [];
  const apiExtraModels: string[] = [];

  const relationScalarFields = getRelationScalars(model.fields);
  const relationScalarFieldNames = Object.keys(relationScalarFields);

  const fields = model.fields.reduce((result, field) => {
    const { name } = field;
    const overrides: Partial<DMMF.Field> = {
      isRequired: true,
      isNullable: !field.isRequired,
    };
    const decorators: IDecorators = {};

    if (isAnnotatedWith(field, DTO_ENTITY_HIDDEN)) return result;

    if (isRelation(field)) return result;
    if (
      !isAnnotatedWith(field, DTO_RELATION_INCLUDE_ID) &&
      relationScalarFieldNames.includes(name)
    )
      return result;

    if (isType(field)) {
      // don't try to import the class we're preparing params for
      if (field.type !== model.name) {
        const modelToImportFrom = allModels.find(
          ({ name }) => name === field.type,
        );

        if (!modelToImportFrom)
          throw new Error(
            `related type '${field.type}' for '${model.name}.${field.name}' not found`,
          );

        const importName = templateHelpers.plainDtoName(field.type);
        const importFrom = slash(
          `${getRelativePath(model.output.dto, modelToImportFrom.output.dto)}${
            path.sep
          }${templateHelpers.plainDtoFilename(field.type)}`,
        );

        // don't double-import the same thing
        // TODO should check for match on any import name ( - no matter where from)
        if (
          !imports.some(
            (item) =>
              Array.isArray(item.destruct) &&
              item.destruct.includes(importName) &&
              item.from === importFrom,
          )
        ) {
          imports.push({
            destruct: [importName],
            from: importFrom,
          });
        }
      }
    }

    if (!templateHelpers.config.noDependencies) {
      if (isAnnotatedWith(field, DTO_API_HIDDEN)) {
        decorators.apiHideProperty = true;
      } else {
        decorators.apiProperties = parseApiProperty(
          {
            ...field,
            isRequired: templateHelpers.config.requiredResponseApiProperty
              ? !!overrides.isRequired
              : false,
            isNullable: !field.isRequired,
          },
          {
            default: false,
            type: templateHelpers.config.outputApiPropertyType,
          },
        );
        const typeProperty = decorators.apiProperties.find(
          (p) => p.name === 'type',
        );
        if (typeProperty?.value === field.type)
          typeProperty.value =
            '() => ' +
            (field.type === 'Json'
              ? 'Object'
              : templateHelpers.plainDtoName(typeProperty.value));
      }
    }

    if (templateHelpers.config.noDependencies) {
      if (field.type === 'Json') field.type = 'Object';
      else if (field.type === 'Decimal') field.type = 'Float';
    }

    return [...result, mapDMMFToParsedField(field, overrides, decorators)];
  }, [] as ParsedField[]);

  const importPrismaClient = makeImportsFromPrismaClient(
    fields,
    templateHelpers.config.prismaClientImportPath,
  );

  const importClassTransformer = makeImportsFromClassTransformer(fields);

  const importNestjsSwagger = makeImportsFromNestjsSwagger(
    fields,
    apiExtraModels,
  );

  return {
    model,
    fields,
    imports: zipImportStatementParams([
      ...importPrismaClient,
      ...importClassTransformer,
      ...importNestjsSwagger,
      ...imports,
    ]),
    apiExtraModels,
  };
};
