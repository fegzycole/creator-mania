const { throwAppError } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');

const ERROR_MESSAGES = {
  SL02: CreatorCardMessages.SLUG_TAKEN,
  AC01: CreatorCardMessages.ACCESS_CODE_REQUIRED_PRIVATE,
  AC05: CreatorCardMessages.ACCESS_CODE_PRIVATE_ONLY,
  NF01: CreatorCardMessages.NOT_FOUND,
  NF02: CreatorCardMessages.DRAFT_NOT_FOUND,
  AC03: CreatorCardMessages.PRIVATE_ACCESS_CODE_REQUIRED,
  AC04: CreatorCardMessages.INVALID_ACCESS_CODE,
};

function throwCreatorCardError(code) {
  throwAppError(ERROR_MESSAGES[code], code);
}

module.exports = { throwCreatorCardError };
