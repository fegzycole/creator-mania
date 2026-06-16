function processArray(functionToCall, value, args, prop) {
  const errorMessages = [];
  const result = {
    isSatisfied: true,
    evaluatedValue: [],
    errorMessage: '',
  };
  value.forEach((v, i) => {
    const params = [v, ...args, `${prop}.${i}`];
    const functionCallResult = functionToCall(...params);
    if (!functionCallResult.isSatisfied) {
      functionCallResult.isSatisfied = false;
    }
    errorMessages.push(functionCallResult.errorMessage);
    result.evaluatedValue.push(functionCallResult.evaluatedValue);
  });
  result.errorMessage = errorMessages.join(', ');
  return result;
}
function min(value, arg, isNot, prop) {
  let result = value * 1 >= arg;
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(min, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should be${notPrefix}greater than ${arg}`,
  };
}

function max(value, arg, isNot, prop) {
  let result = value * 1 <= arg;
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(max, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should be${notPrefix}lesser than ${arg}`,
  };
}

function length(value, arg, isNot, prop) {
  let result = value.length === arg * 1;
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(length, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} length ${value.length} should${notPrefix}be ${arg}`,
  };
}

function lengthbetween(value, arg, isNot, prop) {
  const len = value.length;
  let [arg1, arg2] = arg.split(',');
  arg1 *= 1;
  arg2 *= 1;
  let result = len >= arg1 * 1 && len <= arg2 * 1;
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(lengthbetween, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} length ${value.length} should${notPrefix}be between ${arg1} and ${arg2}`,
  };
}

function minlength(value, arg, isNot, prop) {
  let result = value.length >= arg * 1;
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(minlength, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} length ${value.length} should${notPrefix}be at least ${arg}`,
  };
}

function maxlength(value, arg, isNot, prop) {
  let result = value.length <= arg * 1;
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(maxlength, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} length ${value.length} should${notPrefix}be at most ${arg}`,
  };
}

function between(value, arg, isNot, prop) {
  let [arg1, arg2] = arg.split(',');
  arg1 *= 1;
  arg2 *= 1;
  let result = value >= arg1 * 1 && value <= arg2 * 1;
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(between, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should${notPrefix}be between ${arg1} and ${arg2}`,
  };
}

function startswith(value, arg, isNot, prop) {
  let result = value.startsWith(arg);
  if (isNot) {
    result = !result;
  }
  const isSatisfied = result ? value : false;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(startswith, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should${notPrefix}start with ${arg}`,
  };
}

function endswith(value, arg, isNot, prop) {
  let result = value.endsWith(arg);
  if (isNot) {
    result = !result;
  }
  const isSatisfied = result ? value : false;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(endswith, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should${notPrefix}end with ${arg}`,
  };
}

function isanyof(value, arg, isNot, prop) {
  let result = arg.split(',').some((x) => x === value);
  if (isNot) {
    result = !result;
  }
  const isSatisfied = result ? value : false;
  const notPrefix = isNot ? ' not ' : ' ';
  if (Array.isArray(value)) {
    return processArray(isanyof, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should${notPrefix}be any of ${arg}`,
  };
}

function trim(value, _, __, prop) {
  if (Array.isArray(value)) {
    return processArray(trim, value, [], prop);
  }
  return {
    isSatisfied: true,
    evaluatedValue: value.trim(),
    errorMessage: 'none',
  };
}

function lowercase(value, _, __, prop) {
  if (Array.isArray(value)) {
    return processArray(lowercase, value, [], prop);
  }
  return {
    isSatisfied: true,
    evaluatedValue: value.toLowerCase(),
    errorMessage: 'none',
  };
}

function uppercase(value, _, __, prop) {
  if (Array.isArray(value)) {
    return processArray(uppercase, value, [], prop);
  }
  return {
    isSatisfied: true,
    evaluatedValue: value.toUpperCase(),
    errorMessage: 'none',
  };
}

function timestamptohex(value, _, __, prop) {
  if (Array.isArray(value)) {
    return processArray(timestamptohex, value, [], prop);
  }
  return {
    isSatisfied: true,
    evaluatedValue: value.toString(16),
    errorMessage: 'none',
  };
}

function isemail(value, arg, isNot, prop) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  let result = emailRegex.test(value) ? value : false;
  if (isNot) {
    result = !result;
  }
  const isSatisfied = result ? value : false;
  const lastPhrase = isNot ? 'should not be a valid email' : 'is not a valid email';
  if (Array.isArray(value)) {
    return processArray(isemail, value, [arg, isNot], prop);
  }
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} ${lastPhrase}`,
  };
}

function integer(value, _, isNot, prop) {
  let result = Number.isInteger(value);
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? 'not ' : '';
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should ${notPrefix}be an integer`,
  };
}

function isalphanumeric(value, _, isNot, prop) {
  const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
  let result = alphaNumericRegex.test(value);
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? 'not ' : '';
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should ${notPrefix}be alphanumeric`,
  };
}

function isslug(value, _, isNot, prop) {
  const slugRegex = /^[a-zA-Z0-9_-]+$/;
  let result = slugRegex.test(value);
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? 'not ' : '';
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should ${notPrefix}use only letters, numbers, hyphens, and underscores`,
  };
}

function ishttpurl(value, _, isNot, prop) {
  let result = value.startsWith('http://') || value.startsWith('https://');
  if (isNot) {
    result = !result;
  }
  const isSatisfied = !!result;
  const notPrefix = isNot ? 'not ' : '';
  return {
    evaluatedValue: value,
    isSatisfied,
    errorMessage: `Passed ${prop} value ${value} should ${notPrefix}start with http:// or https://`,
  };
}

module.exports = {
  min,
  max,
  between,
  length,
  lengthbetween,
  minlength,
  maxlength,
  startswith,
  endswith,
  isanyof,
  trim,
  lowercase,
  uppercase,
  timestamptohex,
  isemail,
  integer,
  isalphanumeric,
  isslug,
  ishttpurl,
};
