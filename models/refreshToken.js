const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const model = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  token: String,
  expires: Date,
  createdByIp: String,
  revoked: Date,
  revokedByIp: String,
  replacedByToken: String
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      // remove these props when object is serialized
      delete ret._id;
      delete ret.id;
      delete ret.user;
    }
  }
});

model.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});

model.virtual('isActive').get(function () {
  return !this.revoked && !this.is_expired;
});

module.exports = mongoose.model('RefreshToken', model);