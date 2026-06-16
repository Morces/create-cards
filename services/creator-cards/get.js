const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { CreatorCardsMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-cards');

const spec = `root {
  slug string
  access_code? string
}`;

const parsedSpec = validator.parse(spec);

async function getCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);

  const card = await CreatorCard.findOne({ query: { slug: data.slug, deleted: null } });

  // 1. If no card exists or has been deleted -> NF01
  if (!card) {
    throwAppError(CreatorCardsMessages.NOT_FOUND, 'NF01');
  }

  // 2. If status is draft -> NF02
  if (card.status === 'draft') {
    throwAppError(CreatorCardsMessages.DRAFT_CARD, 'NF02');
  }

  // 3. If private and no access_code supplied -> AC03
  if (card.access_type === 'private' && !data.access_code) {
    throwAppError(CreatorCardsMessages.PRIVATE_CARD_NEEDS_CODE, 'AC03');
  }

  // 4. If private and wrong access_code -> AC04
  if (card.access_type === 'private' && card.access_code !== data.access_code) {
    throwAppError(CreatorCardsMessages.INVALID_ACCESS_CODE, 'AC04');
  }

  // 5. Otherwise success
  const result = {
    id: card._id,
    title: card.title,
    description: card.description || undefined,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links && card.links.length > 0 ? card.links : undefined,
    service_rates:
      card.service_rates && card.service_rates.rates && card.service_rates.rates.length > 0
        ? card.service_rates
        : undefined,
    status: card.status,
    access_type: card.access_type,
    created: card.created,
    updated: card.updated,
    deleted: card.deleted || null,
  };

  return result;
}

module.exports = getCreatorCard;
