import mongoose from 'mongoose'

// One @username per wallet, one wallet per @username.
//
// Both fields are unique at the DATABASE level, not just checked in the
// route — two people claiming the same name in the same second would both
// pass an "is it free?" lookup, and only a unique index decides who wins.
const usernameSchema = new mongoose.Schema({
  // Stored lowercase so @Alice and @alice are the same person. The display
  // form is always lowercase too — there is no separate "pretty" casing,
  // which keeps look-alike impersonation (Alice vs aIice) out of the picture.
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-z][a-z0-9_]{2,19}$/,
  },

  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^0x[a-f0-9]{40}$/,
  },

  // When the name was last set or changed. Drives the rename cooldown.
  changedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export default mongoose.model('Username', usernameSchema)