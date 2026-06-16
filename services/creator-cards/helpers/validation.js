const validator = require('@app-core/validator');

const createSpec = `root {
  title string<trim|lengthBetween:3,100>
  description? string<trim|maxLength:500>
  slug? string<trim|lengthBetween:5,50|isSlug>
  creator_reference string<trim|length:20>
  links[]? object {
    title string<trim|lengthBetween:1,100>
    url string<trim|maxLength:200|isHttpUrl>
  }
  service_rates? object {
    currency string(NGN|USD|GBP|GHS)
    rates[] object {
      name string<trim|lengthBetween:3,100>
      description string<trim|maxLength:250>
      amount number<min:1|integer>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6|isAlphanumeric>
}`;

const slugSpec = `root {
  slug string<trim|lengthBetween:5,50|isSlug>
}`;

const deleteSpec = `root {
  slug string<trim|lengthBetween:5,50|isSlug>
  creator_reference string<trim|length:20>
}`;

const parsedCreateSpec = validator.parse(createSpec);
const parsedSlugSpec = validator.parse(slugSpec);
const parsedDeleteSpec = validator.parse(deleteSpec);

function validateCreateData(data) {
  return validator.validate(data, parsedCreateSpec);
}

function validateSlugData(data) {
  return validator.validate(data, parsedSlugSpec);
}

function validateDeleteData(data) {
  return validator.validate(data, parsedDeleteSpec);
}

module.exports = {
  validateCreateData,
  validateSlugData,
  validateDeleteData,
};
