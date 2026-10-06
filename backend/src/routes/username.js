import express from 'express'
import rateLimit from 'express-rate-limit'
import Username from '../models/Username.js'
import {
  validateUsername, verifyClaim, ADDRESS_RE, RENAME_COOLDOWN_MS,
} from '../services/usernameService.js'

const router = express.Router()

// Claiming is the only write, and each one needs a wallet signature, so a
// tight limit costs real users nothing and stops signature-grinding.
const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { error: 'Too many username attempts — please try again later' },
})

// ─── GET /api/username/check/:name ─────────────────────────────────────
// Powers the live "available / taken" hint while someone types.
router.get('/check/:name', async (req, res) => {
  try {
    const v = validateUsername(req.params.name)
    if (!v.ok) return res.json({ available: false, valid: false, reason: v.reason })

    const taken = await Username.exists({ username: v.name })
    res.json({
      available: !taken,
      valid: true,
      username: v.name,
      reason: taken ? 'Already taken.' : null,
    })
  } catch (err) {
    console.error('Username check error:', err)
    res.status(500).json({ error: 'Could not check username' })
  }
})

// ─── GET /api/username/resolve/:name ───────────────────────────────────
// @name -> wallet. Used by the Send tab and by /pay/:name links.
router.get('/resolve/:name', async (req, res) => {
  try {
    const v = validateUsername(req.params.name)
    if (!v.ok) return res.status(404).json({ error: 'Username not found' })

    const doc = await Username.findOne({ username: v.name }).lean()
    if (!doc) return res.status(404).json({ error: 'Username not found' })

    res.json({ username: doc.username, walletAddress: doc.walletAddress })
  } catch (err) {
    console.error('Username resolve error:', err)
    res.status(500).json({ error: 'Could not resolve username' })
  }
})

// ─── GET /api/username/wallet/:address ─────────────────────────────────
// wallet -> @name (or null). Shows a user their own handle.
router.get('/wallet/:address', async (req, res) => {
  try {
    if (!ADDRESS_RE.test(req.params.address)) {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }
    const doc = await Username.findOne({
      walletAddress: req.params.address.toLowerCase(),
    }).lean()

    res.json({
      username: doc ? doc.username : null,
      // Lets the UI show "you can change this again in X hours".
      canChangeAt: doc ? new Date(new Date(doc.changedAt).getTime() + RENAME_COOLDOWN_MS) : null,
    })
  } catch (err) {
    console.error('Username wallet lookup error:', err)
    res.status(500).json({ error: 'Could not look up wallet' })
  }
})

// ─── POST /api/username/claim ──────────────────────────────────────────
// Body: { username, walletAddress, signature, issuedAt }
//
// The signature is what makes this safe. Without it anyone could POST
// "claim @bob for <someone else's wallet>" and own their identity.
router.post('/claim', claimLimiter, async (req, res) => {
  try {
    const { username, walletAddress, signature, issuedAt } = req.body || {}

    const v = validateUsername(username)
    if (!v.ok) return res.status(400).json({ error: v.reason })

    const check = verifyClaim({ username: v.name, walletAddress, signature, issuedAt })
    if (!check.ok) return res.status(401).json({ error: check.reason })

    const wallet = walletAddress.toLowerCase()
    const existing = await Username.findOne({ walletAddress: wallet })

    // Same wallet claiming the name it already has — nothing to do.
    if (existing && existing.username === v.name) {
      return res.json({ success: true, username: existing.username, unchanged: true })
    }

    // Changing an existing name is rate-limited.
    if (existing) {
      const waitMs = new Date(existing.changedAt).getTime() + RENAME_COOLDOWN_MS - Date.now()
      if (waitMs > 0) {
        const hours = Math.ceil(waitMs / 3600000)
        return res.status(429).json({
          error: 'You can change your username again in about ' + hours + ' hour' + (hours === 1 ? '' : 's') + '.',
        })
      }
    }

    // Free for someone else? (The unique index below is the real guard —
    // this lookup just gives a friendlier message in the common case.)
    const owner = await Username.findOne({ username: v.name }).lean()
    if (owner && owner.walletAddress !== wallet) {
      return res.status(409).json({ error: '@' + v.name + ' is already taken.' })
    }

    let doc
    if (existing) {
      existing.username = v.name
      existing.changedAt = new Date()
      doc = await existing.save()
    } else {
      doc = await Username.create({ username: v.name, walletAddress: wallet })
    }

    res.status(201).json({ success: true, username: doc.username })
  } catch (err) {
    // Lost a race for the same name — the unique index caught it.
    if (err.code === 11000) {
      return res.status(409).json({ error: 'That username was just taken. Try another.' })
    }
    console.error('Username claim error:', err)
    res.status(500).json({ error: 'Could not save username' })
  }
})

export default router