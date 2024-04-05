# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.21.0] - 2024-04-05

### Added

- add `@DtoConnectHidden` annotation [#28][i28]

### Changed

- `type` in `@ApiProperty` is now always explicitly set [#38][i38]

## [1.20.0] - 2024-01-20

### Added

- support `@ValidateIf()` decorator
- add `@DtoCreateValidateIf(...)` and `@DtoUpdateValidateIf(...)` decorators [#36][pr36] [#37][i37] (thanks to [iamciroja](https://github.com/iamciroja))

## [1.19.3] - 2024-01-19

### Fixed

- fix CreateDto/UpdateDto on nullable Json fields: use `Prisma.NullableJsonNullValueInput` instead of `null`

## [1.19.2] - 2024-01-18

### Fixed

- fix ApiProperty type in ConnectDto if field is JsonValue 

## [1.19.1] - 2024-01-17

- updated prettier and eslint

## [1.19.0] - 2023-12-20

### Changed

- allow `null` for optional fields in CreateDto [#27][pr27] [#34][i34]

## [1.18.4] - 2023-09-19

### Fixed

- add lazy resolver for complex types to avoid circular dependency issues [#31][i31]

## [1.18.3] - 2023-09-14

### Changed

- support `[]` characters in `@DtoCastType()` annotation 

## [1.18.2] - 2023-08-30

### Fixed

- prevent double type field in api properties [#29][pr29]

## [1.18.0] - 2023-08-10

### Added

- add `@DtoCreateHidden` and `@DtoUpdateHidden` annotation [#21][i21]
- add `@DtoApiHidden` annotation to add `@ApiHideProperty` decorator [#23][i23]
- add `DtoRelationCanDisconnectOnUpdate` annotation [#25][pr25] (thanks to [@m1212e](https://github.com/m1212e))

### Changed

- Use default ApiProperty required behavior [#18][i18]. Use `requiredResponseApiProperty = "false"` parameter for the old behavior.
- create a combined index.ts in root output folder [#22][i22]
- upgrade to prisma@4.16.2 now parses triple-slash comments on composite types

### Fixed

- add type to @ApiProperty if field is a list [#20][i20]

## [1.17.4] - 2023-03-04

### Fixed

- fix connect and create class names that get too many suffixes if `dtoSuffix` does not end with `dto` [#17][i17]

## [1.17.3] - 2023-02-22

### Fixed

- fix namespaced imports with `@DtoCastType` annotation [#16][pr16]

## [1.17.2] - 2023-02-10

### Fixed

- prisma imports for ConnectDTOs

## [1.17.0] - 2023-02-10

### Added

- support custom prisma-client import path [#15][pr15] (thanks to [konsti](https://github.com/konsti))
- `definiteAssignmentAssertion` flag to optionally add definite assignment assertion operator `!` to properties [#14][i14]
- support for compound unique inputs [#i8][i8], all ConnectDTOs now have proper swagger and class-validation decorators

### Fixed

- regular expression for class validators was also matching substrings

## [1.16.0] - 2023-01-06

### Added

- `@DtoCastType` annotation [#12][pr12] (thanks to [zackdotcomputer](https://github.com/zackdotcomputer))

## [1.15.0] - 2022-12-04

- updated dependencies [#11][pr11]

### Fixed

- `replaceAll` is not supported by Node.js < 15 [#10][i10]

## [1.14.0] - 2022-11-22

### Added

- add ApiProperty type and class validation to relation inputs [#6][i6]

### Fixed

- add `isArray: true` in ApiProperty decorator, if field is list
- build dist files with LF endings [#9][i9]

## [1.13.0] - 2022-09-14

### Added

- support for composite types (including nested class validation) [#2][i2]
- `@DtoTypeFullUpdate` annotation [#2][i2-comment]
- optionally auto-format output with prettier [#3][pr3] (thanks to [@Zyrakia](https://github.com/Zyrakia))

### Changed

- set `@ApiProperty({ required: false, nullable: true }` if field is optional
- add `{ each: true }` class-validator option if field is a list
- class-validator `@IsDateString()` for type `DateTime` and `@IsDecimal` for type `Decimal`

## [1.13.0-beta.1] - 2022-09-10

### Added

- `@DtoTypeFullUpdate` annotation [#2][i2]

## [1.12.2] - 2022-09-09

### Fixed

- optional fields can be `null` only `UpdateDTO`

## [1.12.1] - 2022-09-09

### Fixed

- optional fields can be `null` in `CreateDTO` and `UpdateDTO`

## [1.13.0-beta.0] - 2022-09-02

### Added

- support for composite types (including nested class validation) [#2][i2]

### Changed

- set `@ApiProperty({ required: false, nullable: true }` if field is optional
- add `{ each: true }` class-validator option if field is a list

## [1.12.0] - 2022-07-25

### Added

- `@DtoRelationIncludeId` annotation: relation IDs are omitted by default, but can be forced to be included in the DTOs

## [1.11.4] - 2022-05-17

### Fixed

- removed class validator `@IsJSON()` from `CreateDTO` and `UpdateDTO` for fields with `Json` type, because request body is already parsed and the respective property is not a JSON string anymore

## [1.11.3] - 2022-05-02

### Fixed

- if entity prefix/suffix is specified, relation input DTOs are named incorrectly (occurs if tags like @DtoRelationCanConnectOnCreate are used)

## [1.11.2] - 2022-04-20

### Fixed

- escape aposthrophe `'` with `\'`, otherwise string generation breaks

## [1.11.1] - 2022-04-14

### Fixed

- field with attribute `@default("")` resulted in empty `default` value: `@Apiproperty({ default: })'`
- parsed apiProperties were propagated to other DTOs

## [1.11.0] - 2022-03-31

### Added

- optionally add validation decorators from `class-validator`

## [1.10.0] - 2022-03-29

### Added

- config `outputType` to generate DTOs as `class` or as `interface`

## [1.9.1] - 2022-03-29

### Fixed

- missing import of `ApiProperty`

## [1.9.0] - 2022-03-29

### Added

- flag `flatResourceStructure` to flatten the subfolders if `outputToNestJsResourceStructure` is `true`
- flag `noDependencies` to output DTOs without any imports and decorators from external dependencies (useful to generate DTOs for frontend)
- `@example` annotation adds example to `@ApiProperty()`

## [1.8.1] - 2022-03-25

### Fixed

- missing `import` of `ApiProperty` if only type-format annotations

## [1.8.0] - 2022-03-25

### Added

- generate plain `DTO` classes (same as entity classes, but without relation fields)

### Changed

- default values are added to the `@ApiDecorator()` only in the `CreateDTO` and `UpdateDTO` classes

## [1.7.1] - 2022-03-22

### Fixed

- omit `@ApiProperty()` annotations for connect-dto classes

## [1.7.0] - 2022-03-18

### Added

- add default value (if any) to `@ApiProperty()`

## [1.6.2] - 2022-03-16

### Added

- process additional documentation tags to generate `@ApiProperty()` decorator
- translate prisma type to schema object type and format

## [1.4.1] - 2021-10-08

- upgrades prisma dependencies to their latest 3.x versions

### Fixed

- Generated code imports using \ instead of / ([#10](https://github.com/vegardit/prisma-generator-nestjs-dto/issues/10))

## [1.4.0] - 2021-09-24

- upgrades prisma dependencies to their latest 3.x versions

## [1.3.1] - 2021-09-24

- applies available minor and patch updates to dependencies

[i2]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/2
[i2-comment]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/2#issuecomment-1238855460
[pr3]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/3
[i6]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/6
[i8]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/8
[i9]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/9
[i10]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/10
[pr11]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/11
[pr12]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/12
[i14]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/14
[pr15]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/15
[pr16]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/16
[i17]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/17
[i18]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/18
[i20]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/20
[i21]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/21
[i22]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/22
[i23]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/23
[pr25]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/25
[pr29]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/29
[i31]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/31
[pr27]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/27
[i28]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/28
[i34]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/34
[pr36]: https://github.com/Brakebein/prisma-generator-nestjs-dto/pull/36
[i37]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/37
[i38]: https://github.com/Brakebein/prisma-generator-nestjs-dto/issues/38
