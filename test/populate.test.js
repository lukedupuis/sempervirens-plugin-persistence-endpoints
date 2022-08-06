import { expect } from 'chai';
import dao from '@sempervirens/dao';

import { initDb, afterTests, toObject } from './helpers/index.js';

import populate from '../src/helpers/populate.js';

initDb();

const db = dao.getDb('testdb');
const Test1 = db.getModel('Test1');
const Test2 = db.getModel('Test2');
const Test3 = db.getModel('Test3');

describe('1. populate', () => {

  let record1, record2, record3;
  before(async () => {
    record1 = await Test1.create({
      prop1a: 'val1a',
      prop1b: 'val1b'
    });
    record2 = await Test2.create({
      test1: record1._id,
      prop2a: 'val2a',
      prop2b: 'val2b'
    });
    record3 = await Test3.create({
      test1: record1._id,
      test2: record2._id,
      prop3a: 'val3a',
      prop3b: 'val3b'
    });
  });

  describe('1.1. When "populate" is given as a string', () => {
    it('1.1.1. Should populate the given path', async () => {
      const populated = await populate(record2, 'test1');
      expect(toObject(populated.test1)).to.deep.equal(toObject(record1));
      await record2.depopulate();
    });
  });

  describe('1.2. When "populate" is given as an object with "path" only', () => {
    it('1.2.1. Should populate the given path', async () => {
      const populated = await populate(record2, { path: 'test1' })
      expect(toObject(populated.test1)).to.deep.equal(toObject(record1));
      await record2.depopulate();
    });
  });

  describe('1.3. When "populate" is given as an object with "path" and "select"', () => {
    it('1.3.1. Should populate the given path', async () => {
      const populated = await populate(record2, {
        path: 'test1',
        select: 'prop1a'
      })
      expect(toObject(populated.test1)).to.deep.equal({
        _id: record1._id.toString(),
        prop1a: 'val1a'
      });
      await record2.depopulate();
    });
  });

  describe('1.4. When "populate" is given as an object with "path" and multiple "select" values', () => {
    it('1.4.1. Should populate the path with all the given properties', async () => {
      const populated = await populate(record2, {
        path: 'test1',
        select: 'prop1a prop1b'
      });
      expect(toObject(populated.test1)).to.deep.equal({
        _id: record1._id.toString(),
        prop1a: 'val1a',
        prop1b: 'val1b'
      });
      await record2.depopulate();
    });
  });

  describe('1.5. When "populate" is given as an array of multilpe objects with "path" only', () => {
    it('1.5.1. Should populate all the given paths', async () => {
      const populated = await populate(record3, [
        { path: 'test1' },
        { path: 'test2' }
      ]);
      expect(toObject(populated.test1)).to.deep.equal(toObject(record1));
      expect(toObject(populated.test2)).to.deep.equal(toObject(record2));
      await record3.depopulate();
    });
  });

  describe('1.6. When "populate" is given as an array of multilpe objects with "path" and "select"', () => {
    it('1.6.1. Should populate all the given paths and given properties', async () => {
      const populated = await populate(record3, [
        { path: 'test1', select: 'prop1a' },
        { path: 'test2', select: 'prop2a prop2b' }
      ]);
      expect(toObject(populated.test1)).to.deep.equal({
        _id: record1._id.toString(),
        prop1a: 'val1a'
      });
      expect(toObject(populated.test2)).to.deep.equal({
        _id: record2._id.toString(),
        prop2a: 'val2a',
        prop2b: 'val2b'
      });
      await record3.depopulate();
    });
  });

  describe('1.7. When "populate" is given an a JSON string', () => {
    it('1.7.1. Should populate all the given paths and given properties', async () => {
      const populated = await populate(record3, JSON.stringify([
        { path: 'test1', select: 'prop1a' },
        { path: 'test2', select: 'prop2a prop2b' }
      ]));
      expect(toObject(populated.test1)).to.deep.equal({
        _id: record1._id.toString(),
        prop1a: 'val1a'
      });
      expect(toObject(populated.test2)).to.deep.equal({
        _id: record2._id.toString(),
        prop2a: 'val2a',
        prop2b: 'val2b'
      });
      await record3.depopulate();
    });
  });

  describe('1.8. When "toPopulate" is an array', () => {
    it('1.8.1. Should populate all the records in the array', async () => {
      const record4 = await Test2.create({
        test1: record1._id,
        prop2a: 'val2a',
        prop2b: 'val2b'
      });
      const record5 = await Test2.create({
        test1: record1._id,
        prop2a: 'val2a',
        prop2b: 'val2b'
      });
      const populated = await populate([record4, record5], {
        path: 'test1',
        select: 'prop1a prop1b'
      });
      expect(toObject(populated[0].test1)).to.deep.equal({
        _id: record1._id.toString(),
        prop1a: 'val1a',
        prop1b: 'val1b'
      });
      expect(toObject(populated[1].test1)).to.deep.equal({
        _id: record1._id.toString(),
        prop1a: 'val1a',
        prop1b: 'val1b'
      });
    });
  });

  describe('1.9. When "toPopulate" is empty', () => {

    describe('1.9.1. When the value is "null" or "undefined"', () => {
      it('1.9.1.1. Should skip populating', async () => {
        expect(await populate(null, 'test1')).to.be.null;
        expect(await populate(undefined, 'test1')).to.be.undefined;
      });
    });

    describe('1.9.2. When the value is an empty array', () => {
      it('1.9.2.1. Should skip populating', async () => {
        expect(await populate([], 'test1')).to.be.empty;
      });
    });

  });

  afterTests(async () => await afterTests());

});