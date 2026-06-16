function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function toPlainObject(card) {
  const plainCard = card?.toObject ? card.toObject() : card;
  return JSON.parse(JSON.stringify(plainCard));
}

function serializeValue(value) {
  if (Array.isArray(value)) return value.map(serializeValue);
  if (!isObject(value)) return value;

  return Object.entries(value).reduce((serialized, [key, entryValue]) => {
    if (key === '_id' || key === '__v') return serialized;
    return { ...serialized, [key]: serializeValue(entryValue) };
  }, {});
}

function cardId(card) {
  return card._id?.toString ? card._id.toString() : card._id;
}

function normalizeAccessCode(card) {
  if (card.access_type === 'private') return card.access_code;
  return null;
}

function serializeCreatorCard(card, options = {}) {
  const plainCard = toPlainObject(card);
  const serialized = serializeValue(plainCard);

  serialized.id = cardId(plainCard);

  if (options.includeAccessCode) {
    serialized.access_code = normalizeAccessCode(serialized);
  } else {
    delete serialized.access_code;
  }

  return serialized;
}

module.exports = { serializeCreatorCard };
