import { describe, expect, test } from '@jest/globals';
import { AtLeastPropError, CtorParamDataObjectError, DataObjectError, DirNotExistError, FileNotExistError, InvalidPatternListError, IsuboError, NonEmptyError, NonEmptyStringError, NonEmptyStringItemArrayError, NonEmptyStringOrNonEmptyStringItemArrayError, StringArrayError, TruthNaturalNumError, TruthPositiveIntError } from '../lib/utils/error.js';

describe('Util:Custom Error', () => {
  test.each([
    {
      name: 'non-object',
      metadata: 0
    },
    {
      name: 'empty-object',
      metadata: {}
    },
  ])('Instantiate IsuboError with $name metadata, it will emit error', ({ metadata }) => {
    try {
      new IsuboError('test', metadata);
    } catch (error) {
      expect(error.message).toEqual(
        new DataObjectError('metadata').message
      )
    }
  });

  test.each([
    { ErrCtor: IsuboError, name: 'IsuboError' }
  ])('Instantiate $name, right errMsg and metadata', ({ ErrCtor }) => {
    const errMsg = 'test errMsg';
    const metadata = {
      hint: 'isubo hint'
    };
    try {
      throw new ErrCtor(errMsg, metadata);
    } catch (error) {
      expect(error.stack.length).toBeGreaterThan(0);
      expect(error.message).toEqual(errMsg);
      expect(error.metadata).toHaveProperty('hint', metadata.hint); 
    }
  });

  test.each([
    { ErrCtor: CtorParamDataObjectError, name: 'CtorParamDataObjectError' },
    { ErrCtor: DataObjectError, name: 'DataObjectError' },
    { ErrCtor: AtLeastPropError, name: 'AtLeastPropError' },
    { ErrCtor: NonEmptyStringError, name: 'NonEmptyStringError' },
    { ErrCtor: StringArrayError, name: 'StringArrayError' },
    { ErrCtor: NonEmptyStringItemArrayError, name: 'NonEmptyStringItemArrayError' },
    { ErrCtor: FileNotExistError, name: 'FileNotExistError' },
    { ErrCtor: DirNotExistError, name: 'DirNotExistError' },
    { ErrCtor: TruthPositiveIntError, name: 'TruthPositiveIntError' },
    { ErrCtor: TruthNaturalNumError, name: 'TruthNaturalNumError' },
    { ErrCtor: InvalidPatternListError, name: 'InvalidPatternListError', argv0: ['/pattern-1'] },
    { ErrCtor: NonEmptyError, name: 'NonEmptyError' },
    { ErrCtor: NonEmptyStringOrNonEmptyStringItemArrayError, name: 'NonEmptyStringOrNonEmptyStringItemArrayError' },
  ])('Instantiate $name, right errMsg and metadata', ({ ErrCtor, name, argv0 }) => {
    const getErrIns = () => {
      const errMsg = 'test errMsg';
      const metadata = {
        hint: 'isubo hint'
      };
      let argvs = [argv0 || errMsg, metadata];
      if (name === 'CtorParamDataObjectError') {
        argvs = [metadata];
      }
      return new ErrCtor(...argvs);
    };
    const getErrInsWithoutParams = () => new ErrCtor();

    try {
      throw getErrIns();
    } catch (error) {
      const expectErr = getErrIns();
      expect(error.stack.length).toBeGreaterThan(0);
      expect(error.message).toEqual(expectErr.message);
      expect(error.metadata).toHaveProperty('hint', expectErr.metadata.hint); 
    }

    try {
      getErrInsWithoutParams();
    } catch (error) {
      const expectErr = getErrInsWithoutParams();
      expect(error.stack.length).toBeGreaterThan(0);
      if (name !== 'CtorParamDataObjectError') {
        expect(!!error.warning).toBeTruthy();
      }
      expect(!!error.message).toBeTruthy();
      expect(error.message).toEqual(expectErr.message);
      expect(error.metadata).toBeUndefined();
    }
  });


});
