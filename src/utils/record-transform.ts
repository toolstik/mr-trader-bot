/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ClassConstructor,
  classToPlain,
  ClassTransformOptions,
  plainToClass,
  Transform,
  TransformationType,
} from 'class-transformer';

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

export type RecordTransformOptions<R> = ClassTransformOptions & {
  recordType?: ClassConstructor<R>;
};

type RecordKey<T> = T extends Record<infer K, any> ? K : never;
type RecordValue<T> = T extends Record<any, infer V> ? V : never;

export function recordToClass<R extends Record<any, T>, T>(
  type: ClassConstructor<T>,
  value: any,
  options?: RecordTransformOptions<R>,
): R {
  console.log('%%%% recordToClass', value);

  const recordType: ClassConstructor<R> = options?.recordType || (Dictionary as any);
  return plainToClass(recordType, value, getOptions(options, recordType, type, value));
}

/**
 * This method doesn't work properly yet
 */
export function classToRecord<R extends Record<any, T>, T>(
  type: ClassConstructor<T>,
  value: R,
  options?: RecordTransformOptions<R>,
) {
  console.log('%%%% classToRecord', value);

  // const valueType = value.constructor as any;
  return classToPlain(value, getOptions(options, options?.recordType, type, value));
}

class Dictionary<T = any> implements Record<any, T> {
  [key: string]: T;
}

export function RecordType<T, R extends Record<any, T>>(
  itemType: ClassConstructor<T>,
  recordType?: ClassConstructor<R>,
) {
  recordType = recordType || (Dictionary as any);

  return Transform(params => {
    if (params.type === TransformationType.PLAIN_TO_CLASS) {
      return recordToClass(itemType, params.value, { ...params.options, recordType });
    }

    if (params.type === TransformationType.CLASS_TO_PLAIN) {
      return classToRecord(itemType, params.value, { ...params.options, recordType });
    }

    return params.value;
  });
}
