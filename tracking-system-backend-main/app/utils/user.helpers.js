const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Store/display email as entered (trim + lowercase only). Dots are kept. */
const sanitizeEmailAddress = (email = '') => email.trim().toLowerCase();

/**
 * Gmail ignores dots in the local part for delivery.
 * Used only for login/uniqueness matching — not for storage.
 */
const canonicalizeEmailForMatch = (email = '') => {
  const trimmed = sanitizeEmailAddress(email);
  const atIndex = trimmed.lastIndexOf('@');

  if (atIndex === -1) {
    return trimmed;
  }

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${localPart.replace(/\./g, '')}@gmail.com`;
  }

  return trimmed;
};

/** @deprecated Prefer sanitizeEmailAddress for storage; kept for callers. */
const normalizeEmailAddress = sanitizeEmailAddress;

const buildUserPayloadFromBody = (body, overrides = {}) => ({
  firstName: body.firstName?.trim(),
  lastName: body.lastName?.trim(),
  email: {
    address: sanitizeEmailAddress(body.email?.address || body['email.address'] || ''),
  },
  phone: {
    countryCode: (body.phone?.countryCode || body['phone.countryCode'] || '').trim(),
    number: (body.phone?.number || body['phone.number'] || '').trim(),
  },
  ...overrides,
});

const findUserByLoginIdentifier = async (User, username) => {
  const normalized = username?.trim();
  if (!normalized) return null;

  if (normalized.includes('@')) {
    const sanitizedEmail = sanitizeEmailAddress(normalized);
    const canonicalEmail = canonicalizeEmailForMatch(normalized);

    let user = await User.findOne({ 'email.address': sanitizedEmail });
    if (user) return user;

    // Match Gmail accounts regardless of dots (stored with dots or without).
    if (canonicalEmail !== sanitizedEmail || sanitizedEmail.endsWith('@gmail.com') || sanitizedEmail.endsWith('@googlemail.com')) {
      const candidates = await User.find({
        'email.address': { $regex: /@(gmail|googlemail)\.com$/i },
      });

      user = candidates.find(
        (candidate) => canonicalizeEmailForMatch(candidate.email?.address) === canonicalEmail,
      );
      if (user) return user;
    }
  }

  let user = await User.findOne({
    $or: [
      { 'email.address': { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } },
      { 'phone.number': normalized },
    ],
  });

  if (user) return user;

  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly.length < 7) return null;

  const usersWithPhone = await User.find({
    'phone.number': { $exists: true, $ne: '' },
  });

  return (
    usersWithPhone.find((candidate) => {
      const fullPhone = `${candidate.phone?.countryCode || ''}${candidate.phone?.number || ''}`.replace(
        /\D/g,
        '',
      );
      const numberOnly = (candidate.phone?.number || '').replace(/\D/g, '');

      return fullPhone === digitsOnly || numberOnly === digitsOnly;
    }) || null
  );
};

module.exports = {
  normalizeEmailAddress,
  sanitizeEmailAddress,
  canonicalizeEmailForMatch,
  buildUserPayloadFromBody,
  findUserByLoginIdentifier,
};
