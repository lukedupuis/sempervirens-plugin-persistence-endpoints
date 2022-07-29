import mongoose from 'mongoose';

const { Types } = mongoose.Schema;

const test2Schema = new mongoose.Schema({
  test1: { type: Types.ObjectId, ref: 'Test1' },
  test1s: [{ type: Types.ObjectId, ref: 'Test1' }],
  prop2a: { type: String },
  prop2b: { type: String }
});

export default {
  name: 'Test2',
  schema: test2Schema
};