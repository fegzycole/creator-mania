const CreatorCardRepository = require('@app/repository/creator-card');
const { enforceRetrievalAccess } = require('./helpers/access');
const { throwCreatorCardError } = require('./helpers/errors');
const { serializeCreatorCard } = require('./helpers/serializer');
const { validateSlugData } = require('./helpers/validation');

function ensureCardExists(card) {
  if (!card) throwCreatorCardError('NF01');
}

function ensureCardPublished(card) {
  if (card.status === 'draft') throwCreatorCardError('NF02');
}

async function retrieveCreatorCard(serviceData) {
  const data = validateSlugData(serviceData);
  const card = await CreatorCardRepository.findActiveBySlug(data.slug);

  ensureCardExists(card);
  ensureCardPublished(card);
  enforceRetrievalAccess(card, serviceData);

  const response = serializeCreatorCard(card);
  return response;
}

module.exports = retrieveCreatorCard;
