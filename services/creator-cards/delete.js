const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { CreatorCardsMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-cards');

const spec = `root {
  slug string
  creator_reference string<length:20>
}`;

const parsedSpec = validator.parse(spec);

async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);

  // Use findOne first to check existence
  const card = await CreatorCard.findOne({ query: { slug: data.slug, deleted: null } });

  if (!card) {
    throwAppError(CreatorCardsMessages.NOT_FOUND, 'NF01');
  }

  // Soft delete
  await CreatorCard.updateOne({
    query: { _id: card._id },
    updateValues: { deleted: Date.now() },
  });

  const updatedCard = await CreatorCard.findOne({ query: { _id: card._id } });

  // Return deleted card in same format as creation response, with deleted set
  const result = {
    id: updatedCard._id,
    title: updatedCard.title,
    description: updatedCard.description || undefined,
    slug: updatedCard.slug,
    creator_reference: updatedCard.creator_reference,
    links: updatedCard.links && updatedCard.links.length > 0 ? updatedCard.links : undefined,
    service_rates:
      updatedCard.service_rates &&
      updatedCard.service_rates.rates &&
      updatedCard.service_rates.rates.length > 0
        ? updatedCard.service_rates
        : undefined,
    status: updatedCard.status,
    access_type: updatedCard.access_type,
    access_code: updatedCard.access_code || null,
    created: updatedCard.created,
    updated: updatedCard.updated,
    deleted: updatedCard.deleted || null,
  };

  return result;
}

module.exports = deleteCreatorCard;
