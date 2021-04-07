/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ClassConstructor,
  classToPlain,
  ClassTransformOptions,
  plainToClass,
  Transform,
  TransformationType,
} from 'class-transformer';

export type RecordTransformOptions<T, R extends Record<any, T>> = ClassTransformOptions & {
  recordType?: ClassConstructor<R>;
};

function getOptions<R extends Record<any, T>, T>(
  options: ClassTransformOptions,
  roottype: ClassConstructor<R>,
  type: ClassConstructor<T>,
  value: any,
): ClassTransformOptions {
  return {
    ...options,
    targetMaps: [
      ...((options && options.targetMaps) || []),
      {
        target: roottype,
        properties: Object.keys(value).reduce((prev, cur) => {
          return {
            ...prev,
            [cur]: type,
          };
        }, {}),
      },
    ],
  };
}

export function plainToRecord<R extends Record<any, T>, T>(
  type: ClassConstructor<T>,
  value: any,
  options?: RecordTransformOptions<T, R>,
): R {
  const recordType: ClassConstructor<R> =
    options?.recordType ||
    (class InternalDictionary {
      [key: string]: T;
    } as any);
  return plainToClass(recordType, value, getOptions(options, recordType, type, value));
}

/**
 * This method doesn't work properly yet
 */
export function recordToPlain<R extends Record<any, T>, T>(
  type: ClassConstructor<T>,
  value: R,
  options?: RecordTransformOptions<T, R>,
) {
  const recordType = options?.recordType || (value.constructor as ClassConstructor<R>);
  return classToPlain(value, getOptions(options, recordType, type, value));
}

export function RecordType<T, R extends Record<any, T>>(
  itemType: ClassConstructor<T>,
  recordType?: ClassConstructor<R>,
) {
  return Transform(params => {
    if (params.type === TransformationType.PLAIN_TO_CLASS) {
      return plainToRecord(itemType, params.value, {
        ...params.options,
        recordType,
      });
    }

    if (params.type === TransformationType.CLASS_TO_PLAIN) {
      return recordToPlain(itemType, params.value, {
        ...params.options,
        recordType,
      });
    }

    return params.value;
  });
}
