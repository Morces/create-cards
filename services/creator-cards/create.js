const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { CreatorCardsMessages } = require('@app/messages');
const { ulid, randomBytes } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-cards');

const spec = `root {
  title string<minLength:3|maxLength:100>
  description? string<maxLength:500>
  slug? string<minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? {
    title string<minLength:1|maxLength:100>
    url string<maxLength:200|startsWith:http>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<minLength:3|maxLength:100>
      description? string<maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedSpec = validator.parse(spec);

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);

  // Business Rule: access_code is required when access_type is private
  if (data.access_type === 'private' && !data.access_code) {
    throwAppError(CreatorCardsMessages.PRIVATE_ACCESS_CODE_REQUIRED, 'AC01');
  }

  // Business Rule: access_code must not be set on public cards
  if ((!data.access_type || data.access_type === 'public') && data.access_code) {
    throwAppError(CreatorCardsMessages.PUBLIC_ACCESS_CODE_FORBIDDEN, 'AC05');
  }

  if (data.access_code && !/^[a-zA-Z0-9]{6}$/.test(data.access_code)) {
    // VSL doesn't perfectly do alphanumeric 6 chars, so we enforce it here.
    // Assuming framework validation failure throws 400.
    const err = new Error('access_code must be exactly 6 alphanumeric characters');
    err.isApplicationError = true;
    err.errorCode = 'VALIDATIONERR';
    throw err;
  }

  if (!data.access_type) {
    data.access_type = 'public';
  }

  // Slug Generation / Validation
  let finalSlug = data.slug;
  if (!finalSlug) {
    const baseSlug = generateSlug(data.title);
    if (baseSlug.length < 5) {
      finalSlug = `${baseSlug}-${randomBytes(3).toString('hex').slice(0, 6)}`;
    } else {
      const existing = await CreatorCard.findOne({ query: { slug: baseSlug } });
      if (existing) {
        finalSlug = `${baseSlug}-${randomBytes(3).toString('hex').slice(0, 6)}`;
      } else {
        finalSlug = baseSlug;
      }
    }
  } else {
    // Validate slug characters
    if (!/^[a-zA-Z0-9-_]+$/.test(finalSlug)) {
      const err = new Error('Slug contains invalid characters');
      err.isApplicationError = true;
      err.errorCode = 'VALIDATIONERR';
      throw err;
    }
    const existing = await CreatorCard.findOne({ query: { slug: finalSlug } });
    if (existing) {
      throwAppError(CreatorCardsMessages.SLUG_TAKEN, 'SL02');
    }
  }

  data.slug = finalSlug;

  // Set ULID
  data._id = ulid();

  const savedCard = await CreatorCard.create(data);

  // Serialize output format
  const result = {
    id: savedCard._id,
    title: savedCard.title,
    description: savedCard.description || undefined,
    slug: savedCard.slug,
    creator_reference: savedCard.creator_reference,
    links: savedCard.links && savedCard.links.length > 0 ? savedCard.links : undefined,
    service_rates:
      savedCard.service_rates &&
      savedCard.service_rates.rates &&
      savedCard.service_rates.rates.length > 0
        ? savedCard.service_rates
        : undefined,
    status: savedCard.status,
    access_type: savedCard.access_type,
    access_code: savedCard.access_code || null,
    created: savedCard.created,
    updated: savedCard.updated,
    deleted: savedCard.deleted || null,
  };

  return result;
}

module.exports = createCreatorCard;
