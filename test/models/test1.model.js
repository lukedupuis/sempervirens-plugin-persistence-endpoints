import mongoose from 'mongoose';

const test1Schema = new mongoose.Schema({
  prop1a: { type: String },
  prop1b: { type: String },
  prop1c: { type: String }
});

test1Schema.pre('save', function(next) {
  this.prop1c = `${this.prop1a}-${this.prop1b}`;
  next();
});

export default {
  name: 'Test1',
  schema: test1Schema
};