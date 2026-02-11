import fs from 'node:fs/promises';
import path from 'node:path';
import makeDir from 'make-dir';
import slash from 'slash';
import { generatorHandler } from '@prisma/generator-helper';
import prettier from 'prettier';
import { logger, parseEnvValue } from './utils';
import { run } from './generator';

import type { GeneratorOptions } from '@prisma/generator-helper';
import type { WriteableFileSpecs, NamingStyle } from './generator/types';

const stringToBoolean = (
  input: string | string[] | undefined,
  defaultValue = false,
) => {
  const val = Array.isArray(input) ? input[0] : (input ?? '');
  if (val === 'true') {
    return true;
  }
  if (val === 'false') {
    return false;
  }

  return defaultValue;
};

const toStr = (v: string | string[] | undefined, def: string): string =>
  (Array.isArray(v) ? v[0] : v) ?? def;

export const generate = async (options: GeneratorOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const output = parseEnvValue(options.generator.output!);
  if (!output) {
    throw new Error('Failed to parse output path');
  }

  const config = options.generator.config;
  const connectDtoPrefix = toStr(config.connectDtoPrefix, 'Connect');
  const createDtoPrefix = toStr(config.createDtoPrefix, 'Create');
  const updateDtoPrefix = toStr(config.updateDtoPrefix, 'Update');
  const dtoSuffix = toStr(config.dtoSuffix, 'Dto');
  const entityPrefix = toStr(config.entityPrefix, '');
  const entitySuffix = toStr(config.entitySuffix, '');
  const fileNamingStyle = toStr(config.fileNamingStyle, 'camel');
  const outputType = toStr(config.outputType, 'class');
  const generateFileTypes = toStr(config.generateFileTypes, 'all');

  const exportRelationModifierClasses = stringToBoolean(
    config.exportRelationModifierClasses,
    true,
  );

  const outputToNestJsResourceStructure = stringToBoolean(
    config.outputToNestJsResourceStructure,
    // using `true` as default value would be a breaking change
    false,
  );

  const flatResourceStructure = stringToBoolean(
    config.flatResourceStructure,
    // using `true` as default value would be a breaking change
    false,
  );

  const reExport = stringToBoolean(
    config.reExport,
    // using `true` as default value would be a breaking change
    false,
  );

  const supportedFileNamingStyles = ['kebab', 'camel', 'pascal', 'snake'];
  const isSupportedFileNamingStyle = (style: string): style is NamingStyle =>
    supportedFileNamingStyles.includes(style);

  if (!isSupportedFileNamingStyle(fileNamingStyle)) {
    throw new Error(
      `'${fileNamingStyle}' is not a valid file naming style. Valid options are ${supportedFileNamingStyles
        .map((s) => `'${s}'`)
        .join(', ')}.`,
    );
  }

  const classValidation = stringToBoolean(
    config.classValidation,
    // using `true` as default value would be a breaking change
    false,
  );

  const supportedOutputTypes = ['class', 'interface'];
  if (!supportedOutputTypes.includes(outputType)) {
    throw new Error(
      `'${outputType}' is not a valid output type. Valid options are 'class' and 'interface'.`,
    );
  }

  const noDependencies = stringToBoolean(
    config.noDependencies,
    // using `true` as default value would be a breaking change
    false,
  );

  if (classValidation && outputType !== 'class') {
    throw new Error(
      `To use 'validation' validation decorators, 'outputType' must be 'class'.`,
    );
  }

  if (classValidation && noDependencies) {
    throw new Error(
      `To use 'validation' validation decorators, 'noDependencies' cannot be false.`,
    );
  }

  const definiteAssignmentAssertion = stringToBoolean(
    config.definiteAssignmentAssertion,
    false,
  );
  if (definiteAssignmentAssertion && outputType !== 'class') {
    throw new Error(
      `To use 'definiteAssignmentAssertion', 'outputType' must be 'class'.`,
    );
  }

  const requiredResponseApiProperty = stringToBoolean(
    config.requiredResponseApiProperty,
    true,
  );

  const prismaClientGenerator = options.otherGenerators.find(
    (config) => config.name === 'client',
  );
  const prismaClientOutputPath = prismaClientGenerator?.output?.value;
  let prismaClientImportPath = '@prisma/client';
  if (
    prismaClientOutputPath &&
    !prismaClientOutputPath.endsWith(
      ['node_modules', '@prisma', 'client'].join(path.sep),
    )
  ) {
    const withStructure = outputToNestJsResourceStructure
      ? flatResourceStructure
        ? '../'
        : '../../'
      : '';
    prismaClientImportPath = slash(
      withStructure + path.relative(output, prismaClientOutputPath),
    );
    if (!prismaClientImportPath.startsWith('.')) {
      prismaClientImportPath = './' + prismaClientImportPath;
    }
  }

  const outputApiPropertyType = stringToBoolean(
    config.outputApiPropertyType,
    true,
  );

  const results = run({
    output,
    dmmf: options.dmmf,
    exportRelationModifierClasses,
    outputToNestJsResourceStructure,
    flatResourceStructure,
    connectDtoPrefix,
    createDtoPrefix,
    updateDtoPrefix,
    dtoSuffix,
    entityPrefix,
    entitySuffix,
    fileNamingStyle,
    classValidation,
    outputType,
    noDependencies,
    definiteAssignmentAssertion,
    requiredResponseApiProperty,
    prismaClientImportPath,
    outputApiPropertyType,
    generateFileTypes,
  });

  const indexCollections: Record<string, WriteableFileSpecs> = {};

  if (reExport) {
    results.forEach(({ fileName }) => {
      const dirName = path.dirname(fileName);

      const { [dirName]: fileSpec } = indexCollections;
      indexCollections[dirName] = {
        fileName: fileSpec?.fileName || path.join(dirName, 'index.ts'),
        content: [
          fileSpec?.content || '',
          `export * from './${path.basename(fileName, '.ts')}';`,
        ].join('\n'),
      };
    });

    // combined index.ts in root output folder
    if (outputToNestJsResourceStructure) {
      const content: string[] = [];
      Object.keys(indexCollections)
        .sort()
        .forEach((dirName) => {
          const base = dirName
            .split(/[\\\/]/)
            .slice(flatResourceStructure ? -1 : -2);
          content.push(
            `export * from './${base[0]}${base[1] ? '/' + base[1] : ''}';`,
          );
        });
      indexCollections[output] = {
        fileName: path.join(output, 'index.ts'),
        content: content.join('\n'),
      };
    }
  }

  const applyPrettier = stringToBoolean(config.prettier, false);

  let prettierConfig: prettier.Options = {};
  if (applyPrettier) {
    const prettierConfigFile = await prettier.resolveConfigFile();
    if (!prettierConfigFile) {
      logger('Stylizing output DTOs with the default Prettier config.');
    } else {
      logger(
        `Stylizing output DTOs with found Prettier config. (${prettierConfigFile})`,
      );
    }

    if (prettierConfigFile) {
      const resolvedConfig = await prettier.resolveConfig(prettierConfigFile, {
        config: prettierConfigFile,
      });

      if (resolvedConfig) prettierConfig = resolvedConfig;
    }

    // Ensures that there are no parsing issues
    // We know that the output files are always TypeScript
    prettierConfig.parser = 'typescript';
  }

  return Promise.all(
    results
      .concat(Object.values(indexCollections))
      .map(async ({ fileName, content }) => {
        await makeDir(path.dirname(fileName));

        if (applyPrettier) {
          content = await prettier.format(content, prettierConfig);
        }

        return fs.writeFile(fileName, content);
      }),
  );
};

generatorHandler({
  onManifest: () => ({
    defaultOutput: '../src/generated/nestjs-dto',
    prettyName: 'NestJS DTO Generator',
  }),
  onGenerate: generate,
});
