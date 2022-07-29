import mongoose from 'mongoose';

const { Types } = mongoose.Schema;

const test3Schema = new mongoose.Schema({
  test1: { type: Types.ObjectId, ref: 'Test1' },
  test2: { type: Types.ObjectId, ref: 'Test2' },
  prop3a: { type: String },
  prop3b: { type: String }
});

export default {
  name: 'Test3',
  schema: test3Schema
};